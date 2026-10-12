using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using PetShop.Api.DTOs;
using PetShop.Api.Services;

namespace PetShop.Api.Hubs;

[Authorize]
public class ChatHub : Hub
{
    private readonly IChatService _chatService;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(IChatService chatService, ILogger<ChatHub> logger)
    {
        _chatService = chatService;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var role = GetUserRole();

        if (userId.HasValue)
        {
            // Thêm connection vào group riêng của user để nhận notification trực tiếp
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId.Value}");

            // Nếu là admin, thêm vào group quản trị viên
            if (role == "Admin")
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, "Admins");
            }

            _logger.LogInformation("ChatHub: User {UserId} ({Role}) đã kết nối với ConnectionId {ConnectionId}", 
                userId.Value, role, Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();
        if (userId.HasValue)
        {
            _logger.LogInformation("ChatHub: User {UserId} đã ngắt kết nối với ConnectionId {ConnectionId}", 
                userId.Value, Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Tham gia phòng chat của một hội thoại cụ thể
    /// </summary>
    public async Task JoinConversation(int conversationId)
    {
        var userId = GetUserId();
        var isAdmin = IsAdmin();

        if (!userId.HasValue)
        {
            throw new HubException("Chưa xác thực người dùng.");
        }

        bool canAccess = await _chatService.CanUserAccessConversationAsync(conversationId, userId.Value, isAdmin);
        if (!canAccess)
        {
            _logger.LogWarning("ChatHub: User {UserId} cố gắng tham gia conversation {ConversationId} không thuộc quyền sở hữu",
                userId.Value, conversationId);
            throw new HubException("Bạn không có quyền truy cập hội thoại này.");
        }

        var groupName = $"conversation_{conversationId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        _logger.LogInformation("ChatHub: User {UserId} đã tham gia {GroupName}", userId.Value, groupName);
    }

    /// <summary>
    /// Rời khỏi phòng chat của một hội thoại
    /// </summary>
    public async Task LeaveConversation(int conversationId)
    {
        var groupName = $"conversation_{conversationId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Phát sự kiện đang gõ phím (typing indicator) tới các thành viên khác trong phòng chat
    /// </summary>
    public async Task SendTyping(int conversationId, bool isTyping)
    {
        var userId = GetUserId();
        var userName = GetUserName();
        var isAdmin = IsAdmin();

        if (!userId.HasValue)
        {
            return;
        }

        bool canAccess = await _chatService.CanUserAccessConversationAsync(conversationId, userId.Value, isAdmin);
        if (!canAccess)
        {
            return;
        }

        var groupName = $"conversation_{conversationId}";
        if (isTyping)
        {
            await Clients.OthersInGroup(groupName).SendAsync("UserTyping", new UserTypingDto
            {
                ConversationId = conversationId,
                UserId = userId.Value,
                UserName = userName,
                IsTyping = true
            });
        }
        else
        {
            await Clients.OthersInGroup(groupName).SendAsync("UserStoppedTyping", new
            {
                ConversationId = conversationId,
                UserId = userId.Value
            });
        }
    }

    private int? GetUserId()
    {
        var claim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(claim, out int id) ? id : null;
    }

    private string GetUserRole()
    {
        return Context.User?.FindFirst(ClaimTypes.Role)?.Value ?? "User";
    }

    private bool IsAdmin()
    {
        return GetUserRole() == "Admin";
    }

    private string GetUserName()
    {
        return Context.User?.FindFirst("FullName")?.Value 
            ?? Context.User?.FindFirst(ClaimTypes.Name)?.Value 
            ?? "Người dùng";
    }
}
