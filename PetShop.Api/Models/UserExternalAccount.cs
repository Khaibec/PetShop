namespace PetShop.Api.Models;

public class UserExternalAccount
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Provider { get; set; } = string.Empty;
    public string ProviderKey { get; set; } = string.Empty;
    public string? ProviderEmail { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    // Navigation
    public User User { get; set; } = null!;
}
