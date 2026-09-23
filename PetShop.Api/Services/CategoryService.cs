using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PetShop.Api.Data;
using PetShop.Api.DTOs;

namespace PetShop.Api.Services;

public interface ICategoryService
{
    Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync(string? type = null);
    Task<CategoryDto?> GetCategoryByIdAsync(int id);
}

public class CategoryService : ICategoryService
{
    private readonly PetShopDbContext _context;
    private readonly IMemoryCache _cache;
    private const string CacheKeyPrefix = "PetShop_Categories_";

    public CategoryService(PetShopDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync(string? type = null)
    {
        string cacheKey = $"{CacheKeyPrefix}{type ?? "All"}";

        if (_cache.TryGetValue(cacheKey, out IEnumerable<CategoryDto>? cachedList) && cachedList != null)
        {
            return cachedList;
        }

        // EF Core optimization: AsNoTracking() + Projection Select()
        var query = _context.Categories
            .AsNoTracking()
            .Where(c => c.IsActive);

        if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(c => c.Type.ToLower() == type.ToLower());
        }

        var result = await query
            .OrderBy(c => c.DisplayOrder)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                Icon = c.Icon,
                Type = c.Type,
                DisplayOrder = c.DisplayOrder,
                ProductCount = c.Products.Count(p => p.IsActive)
            })
            .ToListAsync();

        // Cache for 10 minutes
        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(10));

        return result;
    }

    public async Task<CategoryDto?> GetCategoryByIdAsync(int id)
    {
        return await _context.Categories
            .AsNoTracking()
            .Where(c => c.Id == id && c.IsActive)
            .Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                ImageUrl = c.ImageUrl,
                Icon = c.Icon,
                Type = c.Type,
                DisplayOrder = c.DisplayOrder,
                ProductCount = c.Products.Count(p => p.IsActive)
            })
            .FirstOrDefaultAsync();
    }
}
