using System.ComponentModel.DataAnnotations.Schema;

namespace PetShop.Api.Models;

public class OrderItem
{
    public int Id { get; set; }

    public int OrderId { get; set; }
    public Order? Order { get; set; }

    // Item Type: "Product" hoặc "Pet"
    public string ItemType { get; set; } = "Product";

    public int? ProductId { get; set; }
    public Product? Product { get; set; }

    public int? PetId { get; set; }
    public Pet? Pet { get; set; }

    public string ItemName { get; set; } = string.Empty;
    public string ItemImageUrl { get; set; } = string.Empty;

    [Column(TypeName = "decimal(18,2)")]
    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; } = 1;

    [Column(TypeName = "decimal(18,2)")]
    public decimal TotalPrice { get; set; }
}
