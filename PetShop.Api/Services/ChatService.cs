using Microsoft.EntityFrameworkCore;
using PetShop.Api.Data;
using PetShop.Api.DTOs;
using PetShop.Api.Models;

namespace PetShop.Api.Services;

public class ChatService : IChatService
{
    private readonly PetShopDbContext _context;

    public ChatService(PetShopDbContext context)
    {
        _context = context;
    }

    public async Task<bool> CanUserAccessConversationAsync(int conversationId, int userId, bool isAdmin)
    {
        if (isAdmin)
        {
            return true;
        }

        return await _context.Conversations
            .AsNoTracking()
            .AnyAsync(c => c.Id == conversationId && c.CustomerId == userId);
    }

    public async Task<IEnumerable<ConversationDto>> GetConversationsAsync(int currentUserId, bool isAdmin, ConversationFilterParams filterParams)
    {
        var query = _context.Conversations
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.Admin)
            .Include(c => c.Messages)
            .AsQueryable();

        if (!isAdmin)
        {
            // Khách hàng chỉ xem được các hội thoại của chính mình
            query = query.Where(c => c.CustomerId == currentUserId);
        }
        else
        {
            // Admin có thể lọc theo trạng thái
            if (!string.IsNullOrWhiteSpace(filterParams.Status))
            {
                var statusNorm = filterParams.Status.Trim();
                query = query.Where(c => c.Status.ToLower() == statusNorm.ToLower());
            }

            // Lọc theo từ khóa tìm kiếm (tên, username, email của khách hàng)
            if (!string.IsNullOrWhiteSpace(filterParams.Search))
            {
                var searchNorm = filterParams.Search.Trim().ToLower();
                query = query.Where(c => c.Customer.FullName.ToLower().Contains(searchNorm) ||
                                         c.Customer.Username.ToLower().Contains(searchNorm) ||
                                         c.Customer.Email.ToLower().Contains(searchNorm));
            }
        }

        var conversations = await query
            .OrderByDescending(c => c.LastMessageAt)
            .ToListAsync();

        var result = conversations.Select(c =>
        {
            var lastMsg = c.Messages
                .Where(m => !m.IsDeleted)
                .OrderByDescending(m => m.CreatedAt)
                .FirstOrDefault();

            int unreadCount;
            if (isAdmin)
            {
                // Đối với admin: đếm tin nhắn của khách chưa đọc
                unreadCount = c.Messages.Count(m => !m.IsDeleted && m.SenderRole == "Customer" && m.ReadAt == null);
            }
            else
            {
                // Đối với khách: đếm tin nhắn của admin gửi tới chưa đọc
                unreadCount = c.Messages.Count(m => !m.IsDeleted && m.SenderId != currentUserId && m.ReadAt == null);
            }

            return new ConversationDto
            {
                Id = c.Id,
                CustomerId = c.CustomerId,
                CustomerName = c.Customer.FullName,
                CustomerEmail = c.Customer.Email,
                CustomerAvatarUrl = c.Customer.AvatarUrl,
                AdminId = c.AdminId,
                AdminName = c.Admin?.FullName,
                Status = c.Status,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt,
                LastMessageAt = c.LastMessageAt,
                LastMessageContent = lastMsg?.Content,
                LastMessageSenderRole = lastMsg?.SenderRole,
                LastMessageTime = lastMsg?.CreatedAt,
                UnreadCount = unreadCount
            };
        });

        if (isAdmin && filterParams.UnreadOnly == true)
        {
            result = result.Where(c => c.UnreadCount > 0);
        }

        return result.ToList();
    }

    public async Task<ConversationDto?> GetConversationByIdAsync(int conversationId, int currentUserId, bool isAdmin)
    {
        var conversation = await _context.Conversations
            .AsNoTracking()
            .Include(c => c.Customer)
            .Include(c => c.Admin)
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null)
        {
            return null;
        }

        if (!isAdmin && conversation.CustomerId != currentUserId)
        {
            return null; // Không có quyền
        }

        var lastMsg = conversation.Messages
            .Where(m => !m.IsDeleted)
            .OrderByDescending(m => m.CreatedAt)
            .FirstOrDefault();

        int unreadCount = isAdmin
            ? conversation.Messages.Count(m => !m.IsDeleted && m.SenderRole == "Customer" && m.ReadAt == null)
            : conversation.Messages.Count(m => !m.IsDeleted && m.SenderId != currentUserId && m.ReadAt == null);

        return new ConversationDto
        {
            Id = conversation.Id,
            CustomerId = conversation.CustomerId,
            CustomerName = conversation.Customer.FullName,
            CustomerEmail = conversation.Customer.Email,
            CustomerAvatarUrl = conversation.Customer.AvatarUrl,
            AdminId = conversation.AdminId,
            AdminName = conversation.Admin?.FullName,
            Status = conversation.Status,
            CreatedAt = conversation.CreatedAt,
            UpdatedAt = conversation.UpdatedAt,
            LastMessageAt = conversation.LastMessageAt,
            LastMessageContent = lastMsg?.Content,
            LastMessageSenderRole = lastMsg?.SenderRole,
            LastMessageTime = lastMsg?.CreatedAt,
            UnreadCount = unreadCount
        };
    }

    public async Task<ConversationDto> GetOrCreateActiveConversationAsync(int customerId, string? initialMessage = null)
    {
        // 1. Tìm hội thoại đang mở (Open) của khách hàng
        var conversation = await _context.Conversations
            .Include(c => c.Customer)
            .Include(c => c.Admin)
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.CustomerId == customerId && c.Status == "Open");

        if (conversation == null)
        {
            // 2. Nếu chưa có, tạo hội thoại mới
            var now = DateTime.UtcNow;
            conversation = new Conversation
            {
                CustomerId = customerId,
                Status = "Open",
                CreatedAt = now,
                UpdatedAt = now,
                LastMessageAt = now
            };

            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();

            // Nạp lại thông tin Customer
            await _context.Entry(conversation).Reference(c => c.Customer).LoadAsync();

            // Nếu có tin nhắn ban đầu, tạo tin nhắn
            if (!string.IsNullOrWhiteSpace(initialMessage))
            {
                var msg = new Message
                {
                    ConversationId = conversation.Id,
                    SenderId = customerId,
                    SenderRole = "Customer",
                    Content = initialMessage.Trim(),
                    CreatedAt = now
                };
                _context.Messages.Add(msg);
                await _context.SaveChangesAsync();
            }
        }

        var lastMsg = conversation.Messages
            .Where(m => !m.IsDeleted)
            .OrderByDescending(m => m.CreatedAt)
            .FirstOrDefault();

        return new ConversationDto
        {
            Id = conversation.Id,
            CustomerId = conversation.CustomerId,
            CustomerName = conversation.Customer.FullName,
            CustomerEmail = conversation.Customer.Email,
            CustomerAvatarUrl = conversation.Customer.AvatarUrl,
            AdminId = conversation.AdminId,
            AdminName = conversation.Admin?.FullName,
            Status = conversation.Status,
            CreatedAt = conversation.CreatedAt,
            UpdatedAt = conversation.UpdatedAt,
            LastMessageAt = conversation.LastMessageAt,
            LastMessageContent = lastMsg?.Content,
            LastMessageSenderRole = lastMsg?.SenderRole,
            LastMessageTime = lastMsg?.CreatedAt,
            UnreadCount = 0
        };
    }

    public async Task<PagedResult<MessageDto>> GetMessagesAsync(int conversationId, int currentUserId, bool isAdmin, int page = 1, int pageSize = 30)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 30;

        var conversation = await _context.Conversations
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null)
        {
            return new PagedResult<MessageDto>(Enumerable.Empty<MessageDto>(), 0, page, pageSize);
        }

        if (!isAdmin && conversation.CustomerId != currentUserId)
        {
            return new PagedResult<MessageDto>(Enumerable.Empty<MessageDto>(), 0, page, pageSize);
        }

        var query = _context.Messages
            .AsNoTracking()
            .Include(m => m.Sender)
            .Where(m => m.ConversationId == conversationId && !m.IsDeleted);

        var totalCount = await query.CountAsync();

        // Lấy tin nhắn theo thứ tự mới nhất (để phân trang trang gần nhất), sau đó sắp xếp tăng dần theo CreatedAt để hiển thị
        var messages = await query
            .OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var messageDtos = messages
            .OrderBy(m => m.CreatedAt)
            .Select(m => new MessageDto
            {
                Id = m.Id,
                ConversationId = m.ConversationId,
                SenderId = m.SenderId,
                SenderName = m.Sender.FullName,
                SenderAvatarUrl = m.Sender.AvatarUrl,
                SenderRole = m.SenderRole,
                Content = m.Content,
                CreatedAt = m.CreatedAt,
                ReadAt = m.ReadAt,
                IsMine = m.SenderId == currentUserId
            })
            .ToList();

        return new PagedResult<MessageDto>(messageDtos, totalCount, page, pageSize);
    }

    public async Task<MessageDto> SendMessageAsync(int conversationId, int senderId, string senderRole, SendMessageDto dto)
    {
        var conversation = await _context.Conversations
            .Include(c => c.Customer)
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy hội thoại với mã {conversationId}");
        }

        var sender = await _context.Users.FindAsync(senderId);
        if (sender == null)
        {
            throw new UnauthorizedAccessException("Người dùng không hợp lệ.");
        }

        var now = DateTime.UtcNow;

        // Nếu cuộc trò chuyện đã đóng mà khách hàng gửi tin -> tự động mở lại
        if (conversation.Status == "Closed")
        {
            conversation.Status = "Open";
        }

        // Nếu admin trả lời và conversation chưa có admin phụ trách -> gán admin này
        if (senderRole == "Admin" && conversation.AdminId == null)
        {
            conversation.AdminId = senderId;
        }

        conversation.LastMessageAt = now;
        conversation.UpdatedAt = now;

        var message = new Message
        {
            ConversationId = conversationId,
            SenderId = senderId,
            SenderRole = senderRole,
            Content = dto.Content.Trim(),
            CreatedAt = now,
            ReadAt = null,
            IsDeleted = false
        };

        _context.Messages.Add(message);
        await _context.SaveChangesAsync();

        return new MessageDto
        {
            Id = message.Id,
            ConversationId = message.ConversationId,
            SenderId = message.SenderId,
            SenderName = sender.FullName,
            SenderAvatarUrl = sender.AvatarUrl,
            SenderRole = message.SenderRole,
            Content = message.Content,
            CreatedAt = message.CreatedAt,
            ReadAt = null,
            IsMine = true
        };
    }

    public async Task<bool> MarkMessagesAsReadAsync(int conversationId, int readerId, bool isAdmin)
    {
        var conversation = await _context.Conversations
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null)
        {
            return false;
        }

        // Tìm các tin nhắn chưa đọc gửi tới reader
        IQueryable<Message> query = _context.Messages
            .Where(m => m.ConversationId == conversationId && !m.IsDeleted && m.ReadAt == null);

        if (isAdmin)
        {
            // Admin đọc tin nhắn của khách gửi tới
            query = query.Where(m => m.SenderRole == "Customer");
        }
        else
        {
            // Khách hàng đọc tin nhắn của admin gửi tới
            query = query.Where(m => m.SenderId != readerId);
        }

        var unreadMessages = await query.ToListAsync();
        if (!unreadMessages.Any())
        {
            return false;
        }

        var now = DateTime.UtcNow;
        foreach (var msg in unreadMessages)
        {
            msg.ReadAt = now;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<ConversationDto?> CloseConversationAsync(int conversationId, int currentUserId, bool isAdmin)
    {
        var conversation = await _context.Conversations
            .Include(c => c.Customer)
            .Include(c => c.Admin)
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null)
        {
            return null;
        }

        if (!isAdmin && conversation.CustomerId != currentUserId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền đóng hội thoại này.");
        }

        conversation.Status = "Closed";
        conversation.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetConversationByIdAsync(conversationId, currentUserId, isAdmin);
    }

    public async Task<ConversationDto?> ReopenConversationAsync(int conversationId, int currentUserId, bool isAdmin)
    {
        var conversation = await _context.Conversations
            .Include(c => c.Customer)
            .Include(c => c.Admin)
            .Include(c => c.Messages)
            .FirstOrDefaultAsync(c => c.Id == conversationId);

        if (conversation == null)
        {
            return null;
        }

        if (!isAdmin && conversation.CustomerId != currentUserId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền mở lại hội thoại này.");
        }

        conversation.Status = "Open";
        conversation.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return await GetConversationByIdAsync(conversationId, currentUserId, isAdmin);
    }

    public async Task<int> GetTotalUnreadCountAsync(int currentUserId, bool isAdmin)
    {
        if (isAdmin)
        {
            // Admin: đếm toàn bộ tin nhắn từ khách chưa đọc
            return await _context.Messages
                .AsNoTracking()
                .CountAsync(m => !m.IsDeleted && m.SenderRole == "Customer" && m.ReadAt == null);
        }
        else
        {
            // Khách: đếm tin nhắn của cửa hàng chưa đọc trong hội thoại của mình
            return await _context.Messages
                .AsNoTracking()
                .Include(m => m.Conversation)
                .CountAsync(m => !m.IsDeleted && 
                                 m.Conversation.CustomerId == currentUserId && 
                                 m.SenderId != currentUserId && 
                                 m.ReadAt == null);
        }
    }
}
