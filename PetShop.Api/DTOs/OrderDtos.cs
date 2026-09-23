using System.ComponentModel.DataAnnotations;

namespace PetShop.Api.DTOs;

public class CreateOrderItemDto
{
    [Required]
    public string ItemType { get; set; } = "Product"; // "Product" hoặc "Pet"

    public int? ProductId { get; set; }
    public int? PetId { get; set; }

    [Range(1, 100)]
    public int Quantity { get; set; } = 1;
}

public class CreateOrderDto
{
    [Required(ErrorMessage = "Vui lòng nhập tên người nhận")]
    public string CustomerName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập số điện thoại")]
    [Phone]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required(ErrorMessage = "Vui lòng nhập địa chỉ nhận hàng")]
    public string ShippingAddress { get; set; } = string.Empty;

    public string Note { get; set; } = string.Empty;

    public string PaymentMethod { get; set; } = "COD"; // "COD" or "BankTransfer"

    [Required]
    [MinLength(1, ErrorMessage = "Đơn hàng phải có ít nhất 1 sản phẩm")]
    public List<CreateOrderItemDto> Items { get; set; } = new();
}

public class OrderItemDto
{
    public int Id { get; set; }
    public string ItemType { get; set; } = "Product";
    public int? ProductId { get; set; }
    public int? PetId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public string ItemImageUrl { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
    public decimal TotalPrice { get; set; }
}

public class OrderListDto
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public int TotalItems { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class OrderDetailDto : OrderListDto
{
    public string ShippingAddress { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;
    public decimal SubTotal { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? TrackingCode { get; set; }
    public List<OrderItemDto> Items { get; set; } = new();
}

public class UpdateOrderStatusDto
{
    [Required]
    public string Status { get; set; } = string.Empty; // "Pending", "Confirmed", "Processing", "Shipping", "Completed", "Cancelled"

    public string? TrackingCode { get; set; }
    public string? PaymentStatus { get; set; }
}
