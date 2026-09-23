namespace PetShop.Api.Models;

public class Review
{
    public int Id { get; set; }

    public int? ProductId { get; set; }
    public Product? Product { get; set; }

    public int? UserId { get; set; }
    public User? User { get; set; }

    public string UserName { get; set; } = "Khách hàng ẩn danh";
    public int Rating { get; set; } = 5;
    public string Comment { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
