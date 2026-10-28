using PetShop.Api.DTOs;

namespace PetShop.Api.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
    Task<UserDto?> GetUserByIdAsync(int userId);
    Task<AuthResponseDto?> ExternalLoginAsync(string provider, string providerKey, string? email, string? fullName, string? avatarUrl);
    Task<List<ExternalAccountDto>> GetExternalAccountsAsync(int userId);
    Task<bool> UnlinkExternalAccountAsync(int userId, string provider);
}
