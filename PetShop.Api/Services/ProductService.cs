using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PetShop.Api.Data;
using PetShop.Api.DTOs;
using PetShop.Api.Models;

namespace PetShop.Api.Services;

public interface IProductService
{
    Task<PagedResult<ProductListDto>> GetPagedProductsAsync(ProductFilterParams filter);
    Task<ProductDetailDto?> GetProductByIdAsync(int id);
    Task<IEnumerable<ProductListDto>> GetFeaturedProductsAsync(int count = 8);
    Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto);
    Task<ProductDetailDto?> UpdateProductAsync(int id, UpdateProductDto dto);
    Task<bool> DeleteProductAsync(int id);
}

public class ProductService : IProductService
{
    private readonly PetShopDbContext _context;
    private readonly IMemoryCache _cache;
    private const string FeaturedCacheKey = "PetShop_Featured_Products";

    public ProductService(PetShopDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<PagedResult<ProductListDto>> GetPagedProductsAsync(ProductFilterParams filter)
    {
        // EF Core optimization: AsNoTracking()
        var query = _context.Products
            .AsNoTracking()
            .Where(p => p.IsActive);

        // Filter by Category
        if (filter.CategoryId.HasValue && filter.CategoryId.Value > 0)
        {
            query = query.Where(p => p.CategoryId == filter.CategoryId.Value);
        }

        // Filter by Brand
        if (!string.IsNullOrWhiteSpace(filter.Brand))
        {
            query = query.Where(p => p.Brand.ToLower() == filter.Brand.Trim().ToLower());
        }

        // Filter by Price range
        if (filter.MinPrice.HasValue)
        {
            query = query.Where(p => p.Price >= filter.MinPrice.Value);
        }
        if (filter.MaxPrice.HasValue)
        {
            query = query.Where(p => p.Price <= filter.MaxPrice.Value);
        }

        // Filter in stock only
        if (filter.InStockOnly == true)
        {
            query = query.Where(p => p.Stock > 0);
        }

        // Filter featured
        if (filter.IsFeatured.HasValue)
        {
            query = query.Where(p => p.IsFeatured == filter.IsFeatured.Value);
        }

        // Search term (name, brand, description)
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(term) || p.Brand.ToLower().Contains(term));
        }

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "popular" => query.OrderByDescending(p => p.SoldQuantity),
            "rating" => query.OrderByDescending(p => p.Rating),
            "name" => query.OrderBy(p => p.Name),
            _ => query.OrderByDescending(p => p.CreatedAt) // default newest
        };

        var totalCount = await query.CountAsync();

        // Projection Select to lightweight DTO
        var items = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(p => new ProductListDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                Price = p.Price,
                OriginalPrice = p.OriginalPrice,
                Stock = p.Stock,
                Brand = p.Brand,
                ImageUrl = p.ImageUrl,
                CategoryId = p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : string.Empty,
                Rating = p.Rating,
                ReviewCount = p.ReviewCount,
                SoldQuantity = p.SoldQuantity,
                IsFeatured = p.IsFeatured
            })
            .ToListAsync();

        return new PagedResult<ProductListDto>(items, totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<ProductDetailDto?> GetProductByIdAsync(int id)
    {
        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Reviews)
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

        if (product == null)
        {
            return null;
        }

        List<string> additionalImages;
        try
        {
            additionalImages = JsonSerializer.Deserialize<List<string>>(product.AdditionalImagesJson) ?? new List<string>();
        }
        catch
        {
            additionalImages = new List<string>();
        }

        return new ProductDetailDto
        {
            Id = product.Id,
            Name = product.Name,
            Slug = product.Slug,
            Description = product.Description,
            Price = product.Price,
            OriginalPrice = product.OriginalPrice,
            Stock = product.Stock,
            Brand = product.Brand,
            ImageUrl = product.ImageUrl,
            AdditionalImages = additionalImages,
            CategoryId = product.CategoryId,
            CategoryName = product.Category?.Name ?? string.Empty,
            Rating = product.Rating,
            ReviewCount = product.ReviewCount,
            SoldQuantity = product.SoldQuantity,
            IsFeatured = product.IsFeatured,
            CreatedAt = product.CreatedAt,
            Reviews = product.Reviews.Select(r => new ReviewDto
            {
                Id = r.Id,
                UserName = r.UserName,
                Rating = r.Rating,
                Comment = r.Comment,
                CreatedAt = r.CreatedAt
            }).ToList()
        };
    }

    public async Task<IEnumerable<ProductListDto>> GetFeaturedProductsAsync(int count = 8)
    {
        if (_cache.TryGetValue(FeaturedCacheKey, out IEnumerable<ProductListDto>? cached) && cached != null)
        {
            return cached;
        }

        var products = await _context.Products
            .AsNoTracking()
            .Where(p => p.IsActive && p.IsFeatured)
            .OrderByDescending(p => p.SoldQuantity)
            .Take(count)
            .Select(p => new ProductListDto
            {
                Id = p.Id,
                Name = p.Name,
                Slug = p.Slug,
                Price = p.Price,
                OriginalPrice = p.OriginalPrice,
                Stock = p.Stock,
                Brand = p.Brand,
                ImageUrl = p.ImageUrl,
                CategoryId = p.CategoryId,
                CategoryName = p.Category != null ? p.Category.Name : string.Empty,
                Rating = p.Rating,
                ReviewCount = p.ReviewCount,
                SoldQuantity = p.SoldQuantity,
                IsFeatured = p.IsFeatured
            })
            .ToListAsync();

        _cache.Set(FeaturedCacheKey, products, TimeSpan.FromMinutes(5));
        return products;
    }

    public async Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto)
    {
        var product = new Product
        {
            Name = dto.Name.Trim(),
            Slug = GenerateSlug(dto.Name),
            Description = dto.Description,
            Price = dto.Price,
            OriginalPrice = dto.OriginalPrice,
            Stock = dto.Stock,
            Brand = dto.Brand.Trim(),
            ImageUrl = dto.ImageUrl.Trim(),
            AdditionalImagesJson = JsonSerializer.Serialize(dto.AdditionalImages ?? new List<string>()),
            CategoryId = dto.CategoryId,
            IsFeatured = dto.IsFeatured,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        _cache.Remove(FeaturedCacheKey);

        return (await GetProductByIdAsync(product.Id))!;
    }

    public async Task<ProductDetailDto?> UpdateProductAsync(int id, UpdateProductDto dto)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return null;
        }

        product.Name = dto.Name.Trim();
        product.Slug = GenerateSlug(dto.Name);
        product.Description = dto.Description;
        product.Price = dto.Price;
        product.OriginalPrice = dto.OriginalPrice;
        product.Stock = dto.Stock;
        product.Brand = dto.Brand.Trim();
        product.ImageUrl = dto.ImageUrl.Trim();
        product.AdditionalImagesJson = JsonSerializer.Serialize(dto.AdditionalImages ?? new List<string>());
        product.CategoryId = dto.CategoryId;
        product.IsFeatured = dto.IsFeatured;

        await _context.SaveChangesAsync();
        _cache.Remove(FeaturedCacheKey);

        return await GetProductByIdAsync(id);
    }

    public async Task<bool> DeleteProductAsync(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return false;
        }

        product.IsActive = false; // Soft delete
        await _context.SaveChangesAsync();
        _cache.Remove(FeaturedCacheKey);

        return true;
    }

    private static string GenerateSlug(string phrase)
    {
        string str = phrase.ToLower().Trim();
        str = System.Text.RegularExpressions.Regex.Replace(str, @"[^a-z0-9\s-]", "");
        str = System.Text.RegularExpressions.Regex.Replace(str, @"\s+", "-").Trim('-');
        return $"{str}-{DateTime.UtcNow.Ticks % 10000}";
    }
}
