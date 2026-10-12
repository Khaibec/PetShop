using Microsoft.EntityFrameworkCore;
using PetShop.Api.Data;
using PetShop.Api.DTOs;
using PetShop.Api.Models;
using PetShop.Api.Services;
using Xunit;

namespace PetShop.Tests;

public class ChatServiceTests
{
    private PetShopDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<PetShopDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new PetShopDbContext(options);

        // Seed 1 Admin và 2 Customers
        var admin = new User
        {
            Id = 1,
            Username = "admin",
            Email = "admin@petshop.com",
            FullName = "Admin Quản Trị",
            Role = "Admin"
        };

        var customer1 = new User
        {
            Id = 2,
            Username = "customer1",
            Email = "customer1@petshop.com",
            FullName = "Khách Hàng 1",
            Role = "User"
        };

        var customer2 = new User
        {
            Id = 3,
            Username = "customer2",
            Email = "customer2@petshop.com",
            FullName = "Khách Hàng 2",
            Role = "User"
        };

        context.Users.AddRange(admin, customer1, customer2);
        context.SaveChanges();

        return context;
    }

    [Fact]
    public async Task GetOrCreateActiveConversationAsync_CreatesNew_WhenNoneExists()
    {
        using var context = CreateInMemoryDbContext();
        var service = new ChatService(context);

        var conv = await service.GetOrCreateActiveConversationAsync(2, "Xin chào cửa hàng!");

        Assert.NotNull(conv);
        Assert.Equal(2, conv.CustomerId);
        Assert.Equal("Open", conv.Status);
        Assert.Equal("Xin chào cửa hàng!", conv.LastMessageContent);
    }

    [Fact]
    public async Task GetOrCreateActiveConversationAsync_ReturnsExisting_WhenOpenExists()
    {
        using var context = CreateInMemoryDbContext();
        var service = new ChatService(context);

        var conv1 = await service.GetOrCreateActiveConversationAsync(2, "Tin nhắn 1");
        var conv2 = await service.GetOrCreateActiveConversationAsync(2, "Tin nhắn 2");

        Assert.Equal(conv1.Id, conv2.Id);
        var totalConvs = await context.Conversations.CountAsync(c => c.CustomerId == 2);
        Assert.Equal(1, totalConvs);
    }

    [Fact]
    public async Task CanUserAccessConversationAsync_CustomerCannotAccessOthersConversation()
    {
        using var context = CreateInMemoryDbContext();
        var service = new ChatService(context);

        var conv = await service.GetOrCreateActiveConversationAsync(2);

        // Customer 1 truy cập conv của mình -> true
        var canAccessOwn = await service.CanUserAccessConversationAsync(conv.Id, 2, isAdmin: false);
        Assert.True(canAccessOwn);

        // Customer 2 cố truy cập conv của Customer 1 -> false
        var canAccessOther = await service.CanUserAccessConversationAsync(conv.Id, 3, isAdmin: false);
        Assert.False(canAccessOther);

        // Admin truy cập conv của bất kỳ ai -> true
        var canAdminAccess = await service.CanUserAccessConversationAsync(conv.Id, 1, isAdmin: true);
        Assert.True(canAdminAccess);
    }

    [Fact]
    public async Task SendMessageAsync_And_GetMessagesAsync_WorkCorrectly()
    {
        using var context = CreateInMemoryDbContext();
        var service = new ChatService(context);

        var conv = await service.GetOrCreateActiveConversationAsync(2);

        // Khách gửi tin nhắn
        var msg1 = await service.SendMessageAsync(conv.Id, 2, "Customer", new SendMessageDto { Content = "Cần tư vấn hạt cho chó" });
        Assert.NotNull(msg1);
        Assert.Equal("Customer", msg1.SenderRole);
        Assert.Equal("Cần tư vấn hạt cho chó", msg1.Content);

        // Admin trả lời
        var msg2 = await service.SendMessageAsync(conv.Id, 1, "Admin", new SendMessageDto { Content = "Dạ chào bạn, cún nhà mình mấy tháng rồi ạ?" });
        Assert.NotNull(msg2);
        Assert.Equal("Admin", msg2.SenderRole);

        // Lấy danh sách tin nhắn
        var pagedMessages = await service.GetMessagesAsync(conv.Id, 2, isAdmin: false, page: 1, pageSize: 30);
        Assert.Equal(2, pagedMessages.TotalCount);
        Assert.Equal(2, pagedMessages.Items.Count());
    }

    [Fact]
    public async Task MarkMessagesAsReadAsync_MarksOnlyTargetMessages()
    {
        using var context = CreateInMemoryDbContext();
        var service = new ChatService(context);

        var conv = await service.GetOrCreateActiveConversationAsync(2);

        // Khách gửi 2 tin
        await service.SendMessageAsync(conv.Id, 2, "Customer", new SendMessageDto { Content = "Tin 1" });
        await service.SendMessageAsync(conv.Id, 2, "Customer", new SendMessageDto { Content = "Tin 2" });

        // Admin có 2 tin chưa đọc
        var adminUnreadBefore = await service.GetTotalUnreadCountAsync(1, isAdmin: true);
        Assert.Equal(2, adminUnreadBefore);

        // Admin đánh dấu đã đọc
        var marked = await service.MarkMessagesAsReadAsync(conv.Id, 1, isAdmin: true);
        Assert.True(marked);

        var adminUnreadAfter = await service.GetTotalUnreadCountAsync(1, isAdmin: true);
        Assert.Equal(0, adminUnreadAfter);
    }

    [Fact]
    public async Task CloseAndReopenConversation_UpdatesStatusProperly()
    {
        using var context = CreateInMemoryDbContext();
        var service = new ChatService(context);

        var conv = await service.GetOrCreateActiveConversationAsync(2);
        Assert.Equal("Open", conv.Status);

        // Đóng hội thoại
        var closedConv = await service.CloseConversationAsync(conv.Id, 1, isAdmin: true);
        Assert.NotNull(closedConv);
        Assert.Equal("Closed", closedConv.Status);

        // Khách hàng gửi tin nhắn mới vào hội thoại đã đóng -> tự động mở lại
        await service.SendMessageAsync(conv.Id, 2, "Customer", new SendMessageDto { Content = "Shop ơi em có thêm câu hỏi" });

        var reopenedConv = await service.GetConversationByIdAsync(conv.Id, 2, isAdmin: false);
        Assert.NotNull(reopenedConv);
        Assert.Equal("Open", reopenedConv.Status);
    }

    [Fact]
    public async Task GetMessagesAsync_PaginatesProperly()
    {
        using var context = CreateInMemoryDbContext();
        var service = new ChatService(context);

        var conv = await service.GetOrCreateActiveConversationAsync(2);

        // Gửi 15 tin nhắn
        for (int i = 1; i <= 15; i++)
        {
            await service.SendMessageAsync(conv.Id, 2, "Customer", new SendMessageDto { Content = $"Tin nhắn {i}" });
        }

        // Trang 1, pageSize = 10
        var page1 = await service.GetMessagesAsync(conv.Id, 2, isAdmin: false, page: 1, pageSize: 10);
        Assert.Equal(15, page1.TotalCount);
        Assert.Equal(10, page1.Items.Count());

        // Trang 2, pageSize = 10
        var page2 = await service.GetMessagesAsync(conv.Id, 2, isAdmin: false, page: 2, pageSize: 10);
        Assert.Equal(15, page2.TotalCount);
        Assert.Equal(5, page2.Items.Count());
    }
}
