using System.ComponentModel.DataAnnotations;

namespace PetShop.Api.DTOs;

public class ProductListDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public decimal? OriginalPrice { get; set; }
    public int Stock { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public double Rating { get; set; }
    public int ReviewCount { get; set; }
    public int SoldQuantity { get; set; }
    public bool IsFeatured { get; set; }
}

public class ProductDetailDto : ProductListDto
{
    public string Description { get; set; } = string.Empty;
    public List<string> AdditionalImages { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public List<ReviewDto> Reviews { get; set; } = new();
}

public class ReviewDto
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class ProductFilterParams : PaginationParams
{
    public int? CategoryId { get; set; }
    public string? Brand { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public bool? InStockOnly { get; set; }
    public bool? IsFeatured { get; set; }
}

public class CreateProductDto
{
    [Required(ErrorMessage = "Tên sản phẩm không được để trống")]
    [MaxLength(250)]
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Required]
    [Range(0, 1000000000, ErrorMessage = "Giá sản phẩm phải lớn hơn hoặc bằng 0")]
    public decimal Price { get; set; }

    public decimal? OriginalPrice { get; set; }

    [Required]
    [Range(0, 100000)]
    public int Stock { get; set; } = 1;

    public string Brand { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập ảnh đại diện sản phẩm")]
    public string ImageUrl { get; set; } = string.Empty;

    public List<string>? AdditionalImages { get; set; }

    [Required(ErrorMessage = "Vui lòng chọn danh mục")]
    public int CategoryId { get; set; }

    public bool IsFeatured { get; set; } = false;
}

public class UpdateProductDto : CreateProductDto
{
}
