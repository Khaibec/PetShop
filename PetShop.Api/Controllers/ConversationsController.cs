using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using PetShop.Api.DTOs;
using PetShop.Api.Hubs;
using PetShop.Api.Services;

namespace PetShop.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ConversationsController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly ILogger<ConversationsController> _logger;

    public ConversationsController(
        IChatService chatService, 
        IHubContext<ChatHub> hubContext,
        ILogger<ConversationsController> logger)
    {
        _chatService = chatService;
        _hubContext = hubContext;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách hội thoại. Khách hàng xem hội thoại của mình, Admin xem tất cả theo bộ lọc.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetConversations([FromQuery] ConversationFilterParams filterParams)
    {
        var (userId, isAdmin) = GetCurrentUser();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var conversations = await _chatService.GetConversationsAsync(userId.Value, isAdmin, filterParams);
        return Ok(conversations);
    }

    /// <summary>
    /// Lấy chi tiết một cuộc trò chuyện theo Id
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetConversationById(int id)
    {
        var (userId, isAdmin) = GetCurrentUser();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var canAccess = await _chatService.CanUserAccessConversationAsync(id, userId.Value, isAdmin);
        if (!canAccess)
        {
            return Forbid();
        }

        var conversation = await _chatService.GetConversationByIdAsync(id, userId.Value, isAdmin);
        if (conversation == null)
        {
            return NotFound(new { message = $"Không tìm thấy hội thoại #{id}" });
        }

        return Ok(conversation);
    }

    /// <summary>
    /// Tạo mới hoặc lấy hội thoại đang mở (Open) của khách hàng
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateOrGetConversation([FromBody] CreateConversationDto? dto)
    {
        var (userId, isAdmin) = GetCurrentUser();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        int targetCustomerId = userId.Value;
        if (isAdmin && dto?.CustomerId.HasValue == true)
        {
            targetCustomerId = dto.CustomerId.Value;
        }

        var conversation = await _chatService.GetOrCreateActiveConversationAsync(targetCustomerId, dto?.InitialMessage);

        // Thông báo realtime tới admins và khách hàng
        await _hubContext.Clients.Group("Admins").SendAsync("ConversationUpdated", conversation);
        await _hubContext.Clients.Group($"user_{targetCustomerId}").SendAsync("ConversationUpdated", conversation);

        return Ok(conversation);
    }

    /// <summary>
    /// Lấy danh sách tin nhắn của một hội thoại (hỗ trợ phân trang)
    /// </summary>
    [HttpGet("{id}/messages")]
    public async Task<IActionResult> GetMessages(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 30)
    {
        var (userId, isAdmin) = GetCurrentUser();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var canAccess = await _chatService.CanUserAccessConversationAsync(id, userId.Value, isAdmin);
        if (!canAccess)
        {
            return Forbid();
        }

        var result = await _chatService.GetMessagesAsync(id, userId.Value, isAdmin, page, pageSize);
        return Ok(result);
    }

    /// <summary>
    /// Gửi tin nhắn mới vào một cuộc trò chuyện
    /// </summary>
    [HttpPost("{id}/messages")]
    public async Task<IActionResult> SendMessage(int id, [FromBody] SendMessageDto dto)
    {
        if (!ModelState.IsValid)
        {
            return UnprocessableEntity(ModelState);
        }

        if (string.IsNullOrWhiteSpace(dto.Content))
        {
            return UnprocessableEntity(new { message = "Nội dung tin nhắn không được để trống." });
        }

        var (userId, isAdmin) = GetCurrentUser();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var canAccess = await _chatService.CanUserAccessConversationAsync(id, userId.Value, isAdmin);
        if (!canAccess)
        {
            return Forbid();
        }

        try
        {
            var senderRole = isAdmin ? "Admin" : "Customer";
            var message = await _chatService.SendMessageAsync(id, userId.Value, senderRole, dto);

            // 1. Gửi realtime event ReceiveMessage tới phòng chat của hội thoại
            await _hubContext.Clients.Group($"conversation_{id}").SendAsync("ReceiveMessage", message);

            // 2. Cập nhật thông tin hội thoại mới nhất trong danh sách hội thoại của người dùng và admin
            var conversation = await _chatService.GetConversationByIdAsync(id, userId.Value, isAdmin);
            if (conversation != null)
            {
                await _hubContext.Clients.Group($"user_{conversation.CustomerId}").SendAsync("ConversationUpdated", conversation);
                await _hubContext.Clients.Group("Admins").SendAsync("ConversationUpdated", conversation);
            }

            return StatusCode(201, message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi gửi tin nhắn vào hội thoại #{ConversationId}", id);
            return StatusCode(500, new { message = "Đã xảy ra lỗi khi gửi tin nhắn." });
        }
    }

    /// <summary>
    /// Đánh dấu đã đọc các tin nhắn gửi tới người dùng trong hội thoại này
    /// </summary>
    [HttpPatch("{id}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var (userId, isAdmin) = GetCurrentUser();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var canAccess = await _chatService.CanUserAccessConversationAsync(id, userId.Value, isAdmin);
        if (!canAccess)
        {
            return Forbid();
        }

        var updated = await _chatService.MarkMessagesAsReadAsync(id, userId.Value, isAdmin);
        if (updated)
        {
            var now = DateTime.UtcNow;
            // Phát sự kiện MessageRead cho các thành viên trong conversation
            await _hubContext.Clients.Group($"conversation_{id}").SendAsync("MessageRead", new
            {
                ConversationId = id,
                ReaderId = userId.Value,
                ReadAt = now
            });

            // Cập nhật lại unread count trên danh sách hội thoại
            var conversation = await _chatService.GetConversationByIdAsync(id, userId.Value, isAdmin);
            if (conversation != null)
            {
                await _hubContext.Clients.Group($"user_{conversation.CustomerId}").SendAsync("ConversationUpdated", conversation);
                await _hubContext.Clients.Group("Admins").SendAsync("ConversationUpdated", conversation);
            }
        }

        return Ok(new { success = true, marked = updated });
    }

    /// <summary>
    /// Đóng một cuộc trò chuyện
    /// </summary>
    [HttpPatch("{id}/close")]
    public async Task<IActionResult> CloseConversation(int id)
    {
        var (userId, isAdmin) = GetCurrentUser();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var canAccess = await _chatService.CanUserAccessConversationAsync(id, userId.Value, isAdmin);
        if (!canAccess)
        {
            return Forbid();
        }

        try
        {
            var conversation = await _chatService.CloseConversationAsync(id, userId.Value, isAdmin);
            if (conversation == null)
            {
                return NotFound(new { message = $"Không tìm thấy hội thoại #{id}" });
            }

            // Phát sự kiện ConversationUpdated
            await _hubContext.Clients.Group($"conversation_{id}").SendAsync("ConversationUpdated", conversation);
            await _hubContext.Clients.Group($"user_{conversation.CustomerId}").SendAsync("ConversationUpdated", conversation);
            await _hubContext.Clients.Group("Admins").SendAsync("ConversationUpdated", conversation);

            return Ok(conversation);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Mở lại một cuộc trò chuyện đã đóng
    /// </summary>
    [HttpPatch("{id}/reopen")]
    public async Task<IActionResult> ReopenConversation(int id)
    {
        var (userId, isAdmin) = GetCurrentUser();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var canAccess = await _chatService.CanUserAccessConversationAsync(id, userId.Value, isAdmin);
        if (!canAccess)
        {
            return Forbid();
        }

        try
        {
            var conversation = await _chatService.ReopenConversationAsync(id, userId.Value, isAdmin);
            if (conversation == null)
            {
                return NotFound(new { message = $"Không tìm thấy hội thoại #{id}" });
            }

            // Phát sự kiện ConversationUpdated
            await _hubContext.Clients.Group($"conversation_{id}").SendAsync("ConversationUpdated", conversation);
            await _hubContext.Clients.Group($"user_{conversation.CustomerId}").SendAsync("ConversationUpdated", conversation);
            await _hubContext.Clients.Group("Admins").SendAsync("ConversationUpdated", conversation);

            return Ok(conversation);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Lấy tổng số lượng tin nhắn chưa đọc của người dùng hiện tại
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetTotalUnreadCount()
    {
        var (userId, isAdmin) = GetCurrentUser();
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var count = await _chatService.GetTotalUnreadCountAsync(userId.Value, isAdmin);
        return Ok(new { unreadCount = count });
    }

    private (int? UserId, bool IsAdmin) GetCurrentUser()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!int.TryParse(claim, out int id))
        {
            return (null, false);
        }

        var role = User.FindFirst(ClaimTypes.Role)?.Value;
        return (id, role == "Admin");
    }
}
