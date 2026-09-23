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
