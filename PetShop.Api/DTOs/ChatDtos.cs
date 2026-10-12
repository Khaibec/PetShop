using System.ComponentModel.DataAnnotations;

namespace PetShop.Api.DTOs;

public class ConversationDto
{
    public int Id { get; set; }
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;
    public string? CustomerAvatarUrl { get; set; }

    public int? AdminId { get; set; }
    public string? AdminName { get; set; }

    public string Status { get; set; } = "Open";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime LastMessageAt { get; set; }

    // Thông tin tin nhắn cuối cùng và số lượng tin chưa đọc
    public string? LastMessageContent { get; set; }
    public string? LastMessageSenderRole { get; set; }
    public DateTime? LastMessageTime { get; set; }
    public int UnreadCount { get; set; }
}

public class MessageDto
{
    public int Id { get; set; }
    public int ConversationId { get; set; }
    public int SenderId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string? SenderAvatarUrl { get; set; }
    public string SenderRole { get; set; } = "Customer";
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
    public bool IsRead => ReadAt != null;
    public bool IsMine { get; set; }
}

public class CreateConversationDto
{
    // Tùy chọn nếu admin tạo hộ cho khách, hoặc gửi tin nhắn khởi đầu
    public int? CustomerId { get; set; }

    [MaxLength(2000, ErrorMessage = "Nội dung tin nhắn không được vượt quá 2000 ký tự.")]
    public string? InitialMessage { get; set; }
}

public class SendMessageDto
{
    [Required(ErrorMessage = "Nội dung tin nhắn không được để trống.")]
    [MinLength(1, ErrorMessage = "Nội dung tin nhắn phải có ít nhất 1 ký tự.")]
    [MaxLength(2000, ErrorMessage = "Nội dung tin nhắn không được vượt quá 2000 ký tự.")]
    public string Content { get; set; } = string.Empty;
}

public class UserTypingDto
{
    public int ConversationId { get; set; }
    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public bool IsTyping { get; set; }
}

public class ConversationFilterParams
{
    public string? Status { get; set; } // "Open", "Closed", null (Tất cả)
    public string? Search { get; set; }
    public bool? UnreadOnly { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
