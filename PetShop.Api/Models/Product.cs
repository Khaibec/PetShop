using System.ComponentModel.DataAnnotations.Schema;

namespace PetShop.Api.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? OriginalPrice { get; set; }

    public int Stock { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string AdditionalImagesJson { get; set; } = "[]";

    public int CategoryId { get; set; }
    public Category? Category { get; set; }

    public double Rating { get; set; } = 5.0;
    public int ReviewCount { get; set; } = 0;
    public int SoldQuantity { get; set; } = 0;

    public bool IsFeatured { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
