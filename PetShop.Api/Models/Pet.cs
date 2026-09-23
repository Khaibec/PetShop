using System.ComponentModel.DataAnnotations.Schema;

namespace PetShop.Api.Models;

public class Pet
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Breed { get; set; } = string.Empty; // Poodle, Corgi, Golden, Aln, etc.
    public string Species { get; set; } = "Chó"; // "Chó" hoặc "Mèo"
    public int AgeMonths { get; set; } = 2;
    public string Gender { get; set; } = "Đực"; // "Đực" hoặc "Cái"
    public string Color { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal WeightKg { get; set; } = 1.0m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? OriginalPrice { get; set; }

    public bool Vaccinated { get; set; } = true;
    public bool Dewormed { get; set; } = true;
    public string HealthCertificate { get; set; } = "Sổ tiêm ngừa và kiểm định sức khỏe đầy đủ";

    // Status: "Available" (Có sẵn), "Reserved" (Đang giữ chỗ), "Sold" (Đã bán)
    public string Status { get; set; } = "Available";

    public string ImageUrl { get; set; } = string.Empty;
    public string AdditionalImagesJson { get; set; } = "[]";
    public string Description { get; set; } = string.Empty;

    public bool IsFeatured { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}
