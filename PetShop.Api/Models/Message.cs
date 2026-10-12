namespace PetShop.Api.Models;

public class Message
{
    public int Id { get; set; }

    public int ConversationId { get; set; }
    public Conversation Conversation { get; set; } = null!;

    public int SenderId { get; set; }
    public User Sender { get; set; } = null!;

    // Vai trò của người gửi: "Customer" hoặc "Admin"
    public string SenderRole { get; set; } = "Customer";

    public string Content { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Thời điểm người nhận đã đọc tin nhắn này (null nếu chưa đọc)
    public DateTime? ReadAt { get; set; }

    // Soft delete cờ nếu cần
    public bool IsDeleted { get; set; } = false;
}
