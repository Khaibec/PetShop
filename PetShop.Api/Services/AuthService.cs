using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PetShop.Api.Data;
using PetShop.Api.DTOs;
using PetShop.Api.Models;

namespace PetShop.Api.Services;

public class AuthService : IAuthService
{
    private readonly PetShopDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(PetShopDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var normalizedInput = dto.UsernameOrEmail.Trim().ToLower();

        var user = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedInput || u.Username.ToLower() == normalizedInput);

        if (user == null || !user.IsActive)
        {
            return null;
        }

        // Verify password with BCrypt
        bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!isPasswordValid)
        {
            return null;
        }

        var expiresAt = DateTime.UtcNow.AddDays(7);
        var token = GenerateJwtToken(user, expiresAt);

        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            ExpiresAt = expiresAt
        };
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
    {
        var normalizedEmail = dto.Email.Trim().ToLower();
        var normalizedUsername = dto.Username.Trim().ToLower();

        bool exists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == normalizedEmail || u.Username.ToLower() == normalizedUsername);

        if (exists)
        {
            return null; // Already exists
        }

        var user = new User
        {
            Username = dto.Username.Trim(),
            Email = normalizedEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            FullName = dto.FullName.Trim(),
            PhoneNumber = dto.PhoneNumber?.Trim() ?? string.Empty,
            Address = dto.Address?.Trim() ?? string.Empty,
            Role = "User", // Mặc định đăng ký mới là User
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var expiresAt = DateTime.UtcNow.AddDays(7);
        var token = GenerateJwtToken(user, expiresAt);

        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            ExpiresAt = expiresAt
        };
    }

    public async Task<UserDto?> GetUserByIdAsync(int userId)
    {
        return await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == userId && u.IsActive)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Username = u.Username,
                Email = u.Email,
                FullName = u.FullName,
                PhoneNumber = u.PhoneNumber,
                Address = u.Address,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            })
            .FirstOrDefaultAsync();
    }

    public async Task<AuthResponseDto?> ExternalLoginAsync(string provider, string providerKey, string? email, string? fullName, string? avatarUrl)
    {
        var normalizedProvider = provider.Trim();
        var normalizedKey = providerKey.Trim();
        var normalizedEmail = email?.Trim().ToLower();

        // 1. Kiểm tra tài khoản liên kết đã tồn tại hay chưa
        var externalAccount = await _context.UserExternalAccounts
            .Include(ea => ea.User)
            .FirstOrDefaultAsync(ea => ea.Provider.ToLower() == normalizedProvider.ToLower() && ea.ProviderKey == normalizedKey);

        User? user = null;

        if (externalAccount != null)
        {
            user = externalAccount.User;
            if (!user.IsActive)
            {
                return null;
            }

            bool isUpdated = false;
            if (!string.IsNullOrEmpty(avatarUrl) && string.IsNullOrEmpty(user.AvatarUrl))
            {
                user.AvatarUrl = avatarUrl;
                isUpdated = true;
            }

            if (!string.IsNullOrEmpty(normalizedEmail) && externalAccount.ProviderEmail != normalizedEmail)
            {
                externalAccount.ProviderEmail = normalizedEmail;
                externalAccount.UpdatedAt = DateTime.UtcNow;
                isUpdated = true;
            }

            if (isUpdated)
            {
                await _context.SaveChangesAsync();
            }
        }
        else
        {
            // 2. Nếu chưa có liên kết, kiểm tra theo Email đã tồn tại hay chưa
            if (!string.IsNullOrEmpty(normalizedEmail))
            {
                user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);
            }

            if (user != null)
            {
                if (!user.IsActive)
                {
                    return null;
                }

                // Tự động liên kết tài khoản cho User hiện có
                var newAccount = new UserExternalAccount
                {
                    UserId = user.Id,
                    Provider = normalizedProvider,
                    ProviderKey = normalizedKey,
                    ProviderEmail = normalizedEmail,
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserExternalAccounts.Add(newAccount);

                if (!string.IsNullOrEmpty(avatarUrl) && string.IsNullOrEmpty(user.AvatarUrl))
                {
                    user.AvatarUrl = avatarUrl;
                }

                await _context.SaveChangesAsync();
            }
            else
            {
                // 3. User hoàn toàn mới: Tạo User mới + UserExternalAccount
                string baseUsername = !string.IsNullOrEmpty(normalizedEmail)
                    ? normalizedEmail.Split('@')[0]
                    : $"{normalizedProvider.ToLower()}_{normalizedKey[..Math.Min(6, normalizedKey.Length)]}";

                baseUsername = new string(baseUsername.Where(char.IsLetterOrDigit).ToArray());
                if (string.IsNullOrWhiteSpace(baseUsername))
                {
                    baseUsername = "user";
                }

                string username = baseUsername;
                int suffix = 1;
                while (await _context.Users.AnyAsync(u => u.Username.ToLower() == username.ToLower()))
                {
                    username = $"{baseUsername}{suffix++}";
                }

                var randomPassword = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
                var passwordHash = BCrypt.Net.BCrypt.HashPassword(randomPassword);

                user = new User
                {
                    Username = username,
                    Email = !string.IsNullOrEmpty(normalizedEmail) ? normalizedEmail : $"{username}@{normalizedProvider.ToLower()}.local",
                    PasswordHash = passwordHash,
                    FullName = !string.IsNullOrWhiteSpace(fullName) ? fullName.Trim() : username,
                    PhoneNumber = string.Empty,
                    Address = string.Empty,
                    Role = "User",
                    AvatarUrl = avatarUrl,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                var newAccount = new UserExternalAccount
                {
                    UserId = user.Id,
                    Provider = normalizedProvider,
                    ProviderKey = normalizedKey,
                    ProviderEmail = normalizedEmail,
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserExternalAccounts.Add(newAccount);
                await _context.SaveChangesAsync();
            }
        }

        var expiresAt = DateTime.UtcNow.AddDays(7);
        var token = GenerateJwtToken(user, expiresAt);

        return new AuthResponseDto
        {
            Token = token,
            UserId = user.Id,
            Username = user.Username,
            Email = user.Email,
            FullName = user.FullName,
            Role = user.Role,
            ExpiresAt = expiresAt
        };
    }

    public async Task<List<ExternalAccountDto>> GetExternalAccountsAsync(int userId)
    {
        return await _context.UserExternalAccounts
            .AsNoTracking()
            .Where(ea => ea.UserId == userId)
            .OrderByDescending(ea => ea.CreatedAt)
            .Select(ea => new ExternalAccountDto
            {
                Id = ea.Id,
                Provider = ea.Provider,
                ProviderEmail = ea.ProviderEmail,
                CreatedAt = ea.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<bool> UnlinkExternalAccountAsync(int userId, string provider)
    {
        var normalizedProvider = provider.Trim().ToLower();
        var account = await _context.UserExternalAccounts
            .FirstOrDefaultAsync(ea => ea.UserId == userId && ea.Provider.ToLower() == normalizedProvider);

        if (account == null)
        {
            return false;
        }

        _context.UserExternalAccounts.Remove(account);
        await _context.SaveChangesAsync();
        return true;
    }

    private string GenerateJwtToken(User user, DateTime expiresAt)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? "PetShopSecretKey2026SuperSecureKeyWithLongEnoughEntropy!";
        var issuer = _configuration["Jwt:Issuer"] ?? "PetShopApi";
        var audience = _configuration["Jwt:Audience"] ?? "PetShopClient";

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role),
            new("FullName", user.FullName)
        };

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiresAt,
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = credentials
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }
}
