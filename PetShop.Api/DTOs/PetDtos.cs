using System.ComponentModel.DataAnnotations;

namespace PetShop.Api.DTOs;

public class PetListDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Breed { get; set; } = string.Empty;
    public string Species { get; set; } = "Chó"; // "Chó" / "Mèo"
    public int AgeMonths { get; set; }
    public string Gender { get; set; } = "Đực";
    public string Color { get; set; } = string.Empty;
    public decimal WeightKg { get; set; }
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public bool Vaccinated { get; set; }
    public bool Dewormed { get; set; }
    public string Status { get; set; } = "Available"; // "Available", "Reserved", "Sold"
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsFeatured { get; set; }
}

public class PetDetailDto : PetListDto
{
    public string HealthCertificate { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public List<string> AdditionalImages { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class PetFilterParams : PaginationParams
{
    public string? Species { get; set; } // "Chó", "Mèo"
    public string? Breed { get; set; }
    public string? Gender { get; set; }
    public string? Status { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? IsFeatured { get; set; }
}

public class CreatePetDto
{
    [Required(ErrorMessage = "Tên thú cưng không được để trống")]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập giống loài")]
    public string Breed { get; set; } = string.Empty;

    [Required]
    public string Species { get; set; } = "Chó"; // Chó hoặc Mèo

    public int AgeMonths { get; set; } = 2;
    public string Gender { get; set; } = "Đực";
    public string Color { get; set; } = string.Empty;
    public decimal WeightKg { get; set; } = 1.0m;

    [Required]
    [Range(0, 1000000000)]
    public decimal Price { get; set; }

    public decimal? OriginalPrice { get; set; }

    public bool Vaccinated { get; set; } = true;
    public bool Dewormed { get; set; } = true;
    public string HealthCertificate { get; set; } = "Sổ tiêm ngừa và bảo hành sức khỏe đầy đủ";

    public string Status { get; set; } = "Available";

    [Required(ErrorMessage = "Vui lòng nhập link ảnh đại diện")]
    public string ImageUrl { get; set; } = string.Empty;

    public List<string>? AdditionalImages { get; set; }
    public string Description { get; set; } = string.Empty;
    public bool IsFeatured { get; set; } = false;
}

public class UpdatePetDto : CreatePetDto
{
}
