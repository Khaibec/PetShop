namespace PetShop.Api.Models;

public class Conversation
{
    public int Id { get; set; }

    // Người dùng là khách hàng
    public int CustomerId { get; set; }
    public User Customer { get; set; } = null!;

    // Quản trị viên phụ trách (nếu có)
    public int? AdminId { get; set; }
    public User? Admin { get; set; }

    // Trạng thái hội thoại: "Open" (đang mở) hoặc "Closed" (đã đóng)
    public string Status { get; set; } = "Open";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

    // Danh sách tin nhắn
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}
