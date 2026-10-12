using PetShop.Api.DTOs;
using PetShop.Api.Models;

namespace PetShop.Api.Services;

public interface IChatService
{
    Task<IEnumerable<ConversationDto>> GetConversationsAsync(int currentUserId, bool isAdmin, ConversationFilterParams filterParams);
    Task<ConversationDto?> GetConversationByIdAsync(int conversationId, int currentUserId, bool isAdmin);
    Task<ConversationDto> GetOrCreateActiveConversationAsync(int customerId, string? initialMessage = null);
    Task<PagedResult<MessageDto>> GetMessagesAsync(int conversationId, int currentUserId, bool isAdmin, int page = 1, int pageSize = 30);
    Task<MessageDto> SendMessageAsync(int conversationId, int senderId, string senderRole, SendMessageDto dto);
    Task<bool> MarkMessagesAsReadAsync(int conversationId, int readerId, bool isAdmin);
    Task<ConversationDto?> CloseConversationAsync(int conversationId, int currentUserId, bool isAdmin);
    Task<ConversationDto?> ReopenConversationAsync(int conversationId, int currentUserId, bool isAdmin);
    Task<int> GetTotalUnreadCountAsync(int currentUserId, bool isAdmin);
    Task<bool> CanUserAccessConversationAsync(int conversationId, int userId, bool isAdmin);
}
