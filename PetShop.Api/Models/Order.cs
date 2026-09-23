using System.ComponentModel.DataAnnotations.Schema;

namespace PetShop.Api.Models;

public class Order
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;

    public int? UserId { get; set; }
    public User? User { get; set; }

    public string CustomerName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string ShippingAddress { get; set; } = string.Empty;
    public string Note { get; set; } = string.Empty;

    // PaymentMethod: "COD" (Thanh toán khi nhận hàng), "BankTransfer" (Chuyển khoản ngân hàng)
    public string PaymentMethod { get; set; } = "COD";
    public string PaymentStatus { get; set; } = "Pending"; // "Pending", "Paid"

    // Status: "Pending", "Confirmed", "Processing", "Shipping", "Completed", "Cancelled"
    public string Status { get; set; } = "Pending";

    [Column(TypeName = "decimal(18,2)")]
    public decimal SubTotal { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal ShippingFee { get; set; } = 30000m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountAmount { get; set; } = 0m;

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalAmount { get; set; }

    public string? TrackingCode { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
