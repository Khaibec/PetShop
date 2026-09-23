using PetShop.Api.DTOs;

namespace PetShop.Api.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
    Task<UserDto?> GetUserByIdAsync(int userId);
}
