using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PetShop.Api.Data;
using PetShop.Api.Models;
using PetShop.Api.Services;
using Xunit;

namespace PetShop.Tests;

public class ExternalAuthServiceTests
{
    private PetShopDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<PetShopDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new PetShopDbContext(options);

        // Seed 1 active user
        var existingUser = new User
        {
            Id = 10,
            Username = "existinguser",
            Email = "existing@petshop.com",
            FullName = "Existing User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
            Role = "User",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        // Seed 1 inactive user
        var inactiveUser = new User
        {
            Id = 11,
            Username = "inactiveuser",
            Email = "inactive@petshop.com",
            FullName = "Inactive User",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123"),
            Role = "User",
            IsActive = false,
            CreatedAt = DateTime.UtcNow
        };

        // Seed 1 external account for existingUser
        var linkedAccount = new UserExternalAccount
        {
            Id = 1,
            UserId = 10,
            Provider = "Google",
            ProviderKey = "google_sub_1001",
            ProviderEmail = "existing@petshop.com",
            CreatedAt = DateTime.UtcNow
        };

        context.Users.AddRange(existingUser, inactiveUser);
        context.UserExternalAccounts.Add(linkedAccount);
        context.SaveChanges();

        return context;
    }

    private IConfiguration CreateTestConfiguration()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            { "Jwt:Key", "PetShopSecretKey2026SuperSecureKeyWithLongEnoughEntropy!" },
            { "Jwt:Issuer", "PetShopApi" },
            { "Jwt:Audience", "PetShopClient" }
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();
    }

    [Fact]
    public async Task ExternalLogin_ExistingExternalAccount_LogsInSuccessfully()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var config = CreateTestConfiguration();
        var service = new AuthService(context, config);

        // Act
        var result = await service.ExternalLoginAsync("Google", "google_sub_1001", "existing@petshop.com", "Existing User", null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.UserId);
        Assert.Equal("existinguser", result.Username);
        Assert.False(string.IsNullOrEmpty(result.Token));
    }

    [Fact]
    public async Task ExternalLogin_ExistingUserSameEmail_AutoLinksAccount()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var config = CreateTestConfiguration();
        var service = new AuthService(context, config);

        // Act: Đăng nhập Facebook với cùng email của existing user (Id = 10)
        var result = await service.ExternalLoginAsync("Facebook", "fb_sub_2002", "existing@petshop.com", "Existing User FB", "http://avatar.url");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(10, result.UserId);

        // Kiểm tra database có liên kết mới
        var fbLink = await context.UserExternalAccounts.FirstOrDefaultAsync(ea => ea.Provider == "Facebook" && ea.ProviderKey == "fb_sub_2002");
        Assert.NotNull(fbLink);
        Assert.Equal(10, fbLink.UserId);
    }

    [Fact]
    public async Task ExternalLogin_NewUser_CreatesUserAndExternalAccount()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var config = CreateTestConfiguration();
        var service = new AuthService(context, config);

        // Act: Người dùng Google hoàn toàn mới
        var result = await service.ExternalLoginAsync("Google", "google_new_sub_3003", "newcustomer@gmail.com", "Khách Hàng Mới", "https://avatar.url/pic.jpg");

        // Assert
        Assert.NotNull(result);
        Assert.Equal("newcustomer@gmail.com", result.Email);
        Assert.Equal("Khách Hàng Mới", result.FullName);
        Assert.Equal("User", result.Role);
        Assert.False(string.IsNullOrEmpty(result.Token));

        // Kiểm tra trong DB
        var userInDb = await context.Users.Include(u => u.ExternalAccounts).FirstOrDefaultAsync(u => u.Email == "newcustomer@gmail.com");
        Assert.NotNull(userInDb);
        Assert.Equal("https://avatar.url/pic.jpg", userInDb.AvatarUrl);
        Assert.Single(userInDb.ExternalAccounts);
        Assert.Equal("Google", userInDb.ExternalAccounts.First().Provider);
    }

    [Fact]
    public async Task ExternalLogin_InactiveUser_ReturnsNull()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var config = CreateTestConfiguration();
        var service = new AuthService(context, config);

        // Act: Đăng nhập với email của inactive user
        var result = await service.ExternalLoginAsync("Google", "google_inactive_4004", "inactive@petshop.com", "Inactive User", null);

        // Assert
        Assert.Null(result);
    }

    [Fact]
    public async Task ExternalLogin_UsernameCollision_AppendsNumericSuffix()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var config = CreateTestConfiguration();
        var service = new AuthService(context, config);

        // Act: User mới có email prefix trùng với username 'existinguser'
        var result = await service.ExternalLoginAsync("GitHub", "gh_5005", "existinguser@differentdomain.com", "Collision User", null);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("existinguser1", result.Username);
    }

    [Fact]
    public async Task GetExternalAccounts_ReturnsLinkedAccountsForUser()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var config = CreateTestConfiguration();
        var service = new AuthService(context, config);

        // Act
        var accounts = await service.GetExternalAccountsAsync(10);

        // Assert
        Assert.NotEmpty(accounts);
        Assert.Contains(accounts, a => a.Provider == "Google");
    }

    [Fact]
    public async Task UnlinkExternalAccount_RemovesAccountSuccessfully()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var config = CreateTestConfiguration();
        var service = new AuthService(context, config);

        // Act
        var success = await service.UnlinkExternalAccountAsync(10, "Google");

        // Assert
        Assert.True(success);
        var inDb = await context.UserExternalAccounts.FirstOrDefaultAsync(ea => ea.UserId == 10 && ea.Provider == "Google");
        Assert.Null(inDb);

        // Act again for non-existent provider
        var fail = await service.UnlinkExternalAccountAsync(10, "NonExistent");
        Assert.False(fail);
    }
}
