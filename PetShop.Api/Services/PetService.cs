using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using PetShop.Api.Data;
using PetShop.Api.DTOs;
using PetShop.Api.Models;

namespace PetShop.Api.Services;

public interface IPetService
{
    Task<PagedResult<PetListDto>> GetPagedPetsAsync(PetFilterParams filter);
    Task<PetDetailDto?> GetPetByIdAsync(int id);
    Task<IEnumerable<PetListDto>> GetFeaturedPetsAsync(int count = 8);
    Task<PetDetailDto> CreatePetAsync(CreatePetDto dto);
    Task<PetDetailDto?> UpdatePetAsync(int id, UpdatePetDto dto);
    Task<bool> UpdatePetStatusAsync(int id, string status);
    Task<bool> DeletePetAsync(int id);
}

public class PetService : IPetService
{
    private readonly PetShopDbContext _context;
    private readonly IMemoryCache _cache;
    private const string FeaturedPetsCacheKey = "PetShop_Featured_Pets";

    public PetService(PetShopDbContext context, IMemoryCache cache)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<PagedResult<PetListDto>> GetPagedPetsAsync(PetFilterParams filter)
    {
        // EF Core optimization: AsNoTracking()
        var query = _context.Pets
            .AsNoTracking();

        // Filter by Species (Chó / Mèo)
        if (!string.IsNullOrWhiteSpace(filter.Species))
        {
            query = query.Where(p => p.Species.ToLower() == filter.Species.Trim().ToLower());
        }

        // Filter by Breed
        if (!string.IsNullOrWhiteSpace(filter.Breed))
        {
            query = query.Where(p => p.Breed.ToLower().Contains(filter.Breed.Trim().ToLower()));
        }

        // Filter by Gender
        if (!string.IsNullOrWhiteSpace(filter.Gender))
        {
            query = query.Where(p => p.Gender.ToLower() == filter.Gender.Trim().ToLower());
        }

        // Filter by Status (default shows Available or whatever specified)
        if (!string.IsNullOrWhiteSpace(filter.Status))
        {
            query = query.Where(p => p.Status.ToLower() == filter.Status.Trim().ToLower());
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

        // Filter Featured
        if (filter.IsFeatured.HasValue)
        {
            query = query.Where(p => p.IsFeatured == filter.IsFeatured.Value);
        }

        // Search term (name, breed, color, description)
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(term) 
                                  || p.Breed.ToLower().Contains(term)
                                  || p.Color.ToLower().Contains(term));
        }

        // Sorting
        query = filter.SortBy?.ToLower() switch
        {
            "price_asc" => query.OrderBy(p => p.Price),
            "price_desc" => query.OrderByDescending(p => p.Price),
            "age_asc" => query.OrderBy(p => p.AgeMonths),
            "name" => query.OrderBy(p => p.Name),
            _ => query.OrderByDescending(p => p.CreatedAt) // default newest
        };

        var totalCount = await query.CountAsync();

        // Projection
        var items = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .Select(p => new PetListDto
            {
                Id = p.Id,
                Name = p.Name,
                Breed = p.Breed,
                Species = p.Species,
                AgeMonths = p.AgeMonths,
                Gender = p.Gender,
                Color = p.Color,
                WeightKg = p.WeightKg,
                Price = p.Price,
                OriginalPrice = p.OriginalPrice,
                Vaccinated = p.Vaccinated,
                Dewormed = p.Dewormed,
                Status = p.Status,
                ImageUrl = p.ImageUrl,
                IsFeatured = p.IsFeatured
            })
            .ToListAsync();

        return new PagedResult<PetListDto>(items, totalCount, filter.PageNumber, filter.PageSize);
    }

    public async Task<PetDetailDto?> GetPetByIdAsync(int id)
    {
        var pet = await _context.Pets
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id);

        if (pet == null)
        {
            return null;
        }

        List<string> additionalImages;
        try
        {
            additionalImages = JsonSerializer.Deserialize<List<string>>(pet.AdditionalImagesJson) ?? new List<string>();
        }
        catch
        {
            additionalImages = new List<string>();
        }

        return new PetDetailDto
        {
            Id = pet.Id,
            Name = pet.Name,
            Breed = pet.Breed,
            Species = pet.Species,
            AgeMonths = pet.AgeMonths,
            Gender = pet.Gender,
            Color = pet.Color,
            WeightKg = pet.WeightKg,
            Price = pet.Price,
            OriginalPrice = pet.OriginalPrice,
            Vaccinated = pet.Vaccinated,
            Dewormed = pet.Dewormed,
            HealthCertificate = pet.HealthCertificate,
            Status = pet.Status,
            ImageUrl = pet.ImageUrl,
            AdditionalImages = additionalImages,
            Description = pet.Description,
            IsFeatured = pet.IsFeatured,
            CreatedAt = pet.CreatedAt
        };
    }

    public async Task<IEnumerable<PetListDto>> GetFeaturedPetsAsync(int count = 8)
    {
        if (_cache.TryGetValue(FeaturedPetsCacheKey, out IEnumerable<PetListDto>? cached) && cached != null)
        {
            return cached;
        }

        var pets = await _context.Pets
            .AsNoTracking()
            .Where(p => p.IsFeatured && p.Status == "Available")
            .OrderByDescending(p => p.CreatedAt)
            .Take(count)
            .Select(p => new PetListDto
            {
                Id = p.Id,
                Name = p.Name,
                Breed = p.Breed,
                Species = p.Species,
                AgeMonths = p.AgeMonths,
                Gender = p.Gender,
                Color = p.Color,
                WeightKg = p.WeightKg,
                Price = p.Price,
                OriginalPrice = p.OriginalPrice,
                Vaccinated = p.Vaccinated,
                Dewormed = p.Dewormed,
                Status = p.Status,
                ImageUrl = p.ImageUrl,
                IsFeatured = p.IsFeatured
            })
            .ToListAsync();

        _cache.Set(FeaturedPetsCacheKey, pets, TimeSpan.FromMinutes(5));
        return pets;
    }

    public async Task<PetDetailDto> CreatePetAsync(CreatePetDto dto)
    {
        var pet = new Pet
        {
            Name = dto.Name.Trim(),
            Breed = dto.Breed.Trim(),
            Species = dto.Species.Trim(),
            AgeMonths = dto.AgeMonths,
            Gender = dto.Gender.Trim(),
            Color = dto.Color.Trim(),
            WeightKg = dto.WeightKg,
            Price = dto.Price,
            OriginalPrice = dto.OriginalPrice,
            Vaccinated = dto.Vaccinated,
            Dewormed = dto.Dewormed,
            HealthCertificate = dto.HealthCertificate.Trim(),
            Status = dto.Status.Trim(),
            ImageUrl = dto.ImageUrl.Trim(),
            AdditionalImagesJson = JsonSerializer.Serialize(dto.AdditionalImages ?? new List<string>()),
            Description = dto.Description.Trim(),
            IsFeatured = dto.IsFeatured,
            CreatedAt = DateTime.UtcNow
        };

        _context.Pets.Add(pet);
        await _context.SaveChangesAsync();

        _cache.Remove(FeaturedPetsCacheKey);

        return (await GetPetByIdAsync(pet.Id))!;
    }

    public async Task<PetDetailDto?> UpdatePetAsync(int id, UpdatePetDto dto)
    {
        var pet = await _context.Pets.FindAsync(id);
        if (pet == null)
        {
            return null;
        }

        pet.Name = dto.Name.Trim();
        pet.Breed = dto.Breed.Trim();
        pet.Species = dto.Species.Trim();
        pet.AgeMonths = dto.AgeMonths;
        pet.Gender = dto.Gender.Trim();
        pet.Color = dto.Color.Trim();
        pet.WeightKg = dto.WeightKg;
        pet.Price = dto.Price;
        pet.OriginalPrice = dto.OriginalPrice;
        pet.Vaccinated = dto.Vaccinated;
        pet.Dewormed = dto.Dewormed;
        pet.HealthCertificate = dto.HealthCertificate.Trim();
        pet.Status = dto.Status.Trim();
        pet.ImageUrl = dto.ImageUrl.Trim();
        pet.AdditionalImagesJson = JsonSerializer.Serialize(dto.AdditionalImages ?? new List<string>());
        pet.Description = dto.Description.Trim();
        pet.IsFeatured = dto.IsFeatured;

        await _context.SaveChangesAsync();
        _cache.Remove(FeaturedPetsCacheKey);

        return await GetPetByIdAsync(id);
    }

    public async Task<bool> UpdatePetStatusAsync(int id, string status)
    {
        var pet = await _context.Pets.FindAsync(id);
        if (pet == null)
        {
            return false;
        }

        pet.Status = status;
        await _context.SaveChangesAsync();
        _cache.Remove(FeaturedPetsCacheKey);
        return true;
    }

    public async Task<bool> DeletePetAsync(int id)
    {
        var pet = await _context.Pets.FindAsync(id);
        if (pet == null)
        {
            return false;
        }

        _context.Pets.Remove(pet);
        await _context.SaveChangesAsync();
        _cache.Remove(FeaturedPetsCacheKey);
        return true;
    }
}
