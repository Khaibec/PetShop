using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PetShop.Api.DTOs;
using PetShop.Api.Services;

namespace PetShop.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IConfiguration _configuration;

    public AuthController(IAuthService authService, IConfiguration configuration)
    {
        _authService = authService;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _authService.LoginAsync(dto);
        if (result == null)
        {
            return Unauthorized(new { message = "Tài khoản hoặc mật khẩu không chính xác." });
        }

        return Ok(result);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _authService.RegisterAsync(dto);
        if (result == null)
        {
            return BadRequest(new { message = "Email hoặc tên tài khoản đã tồn tại trong hệ thống." });
        }

        return Ok(result);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized();
        }

        var user = await _authService.GetUserByIdAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(user);
    }

    [HttpGet("external-login")]
    public IActionResult ExternalLogin([FromQuery] string provider, [FromQuery] string? returnUrl = "/")
    {
        if (string.IsNullOrWhiteSpace(provider))
        {
            return BadRequest(new { message = "Vui lòng chọn nhà cung cấp đăng nhập (Google, Facebook, GitHub)." });
        }

        var validProviders = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "Google", "Google" },
            { "Facebook", "Facebook" },
            { "GitHub", "GitHub" }
        };

        if (!validProviders.TryGetValue(provider, out var matchedProvider))
        {
            return BadRequest(new { message = $"Nhà cung cấp '{provider}' không được hỗ trợ." });
        }

        var redirectUrl = Url.Action(nameof(ExternalCallback), "Auth", new { returnUrl });
        var properties = new AuthenticationProperties
        {
            RedirectUri = redirectUrl
        };

        return Challenge(properties, matchedProvider);
    }

    [HttpGet("external-callback")]
    public async Task<IActionResult> ExternalCallback([FromQuery] string? returnUrl = "/")
    {
        var frontendOrigins = _configuration.GetSection("AllowedOrigins").Get<string[]>();
        var frontendBaseUrl = frontendOrigins?.FirstOrDefault() ?? "http://localhost:4200";

        var authResult = await HttpContext.AuthenticateAsync("ExternalAuth");
        if (!authResult.Succeeded || authResult.Principal == null)
        {
            var err = Uri.EscapeDataString(authResult.Failure?.Message ?? "Xác thực tài khoản bên thứ 3 thất bại.");
            return Redirect($"{frontendBaseUrl}/auth/callback?error={err}");
        }

        var principal = authResult.Principal;

        var provider = "External";
        if (authResult.Properties?.Items.TryGetValue(".AuthScheme", out var scheme) == true && !string.IsNullOrEmpty(scheme))
        {
            provider = scheme;
        }
        else if (!string.IsNullOrEmpty(principal.Identity?.AuthenticationType))
        {
            provider = principal.Identity.AuthenticationType;
        }

        if (provider.Equals("Google", StringComparison.OrdinalIgnoreCase)) provider = "Google";
        else if (provider.Equals("Facebook", StringComparison.OrdinalIgnoreCase)) provider = "Facebook";
        else if (provider.Equals("GitHub", StringComparison.OrdinalIgnoreCase)) provider = "GitHub";

        var providerKey = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? principal.FindFirst("sub")?.Value
            ?? principal.FindFirst("id")?.Value;

        var email = principal.FindFirst(ClaimTypes.Email)?.Value
            ?? principal.FindFirst("email")?.Value;

        var fullName = principal.FindFirst(ClaimTypes.Name)?.Value
            ?? principal.FindFirst("name")?.Value;

        var avatarUrl = principal.FindFirst("picture")?.Value
            ?? principal.FindFirst("urn:google:picture")?.Value
            ?? principal.FindFirst("avatar_url")?.Value
            ?? principal.FindFirst("urn:github:avatar")?.Value;

        if (string.IsNullOrEmpty(providerKey))
        {
            await HttpContext.SignOutAsync("ExternalAuth");
            return Redirect($"{frontendBaseUrl}/auth/callback?error={Uri.EscapeDataString("Không nhận diện được định danh tài khoản bên thứ 3.")}");
        }

        var result = await _authService.ExternalLoginAsync(provider, providerKey, email, fullName, avatarUrl);

        await HttpContext.SignOutAsync("ExternalAuth");

        if (result == null)
        {
            return Redirect($"{frontendBaseUrl}/auth/callback?error={Uri.EscapeDataString("Tài khoản của bạn đã bị khóa hoặc không thể đăng nhập.")}");
        }

        var safeReturnUrl = string.IsNullOrWhiteSpace(returnUrl) || returnUrl.StartsWith("http", StringComparison.OrdinalIgnoreCase)
            ? "/"
            : returnUrl;

        var redirectTarget = $"{frontendBaseUrl}/auth/callback" +
            $"?token={Uri.EscapeDataString(result.Token)}" +
            $"&userId={result.UserId}" +
            $"&username={Uri.EscapeDataString(result.Username)}" +
            $"&email={Uri.EscapeDataString(result.Email)}" +
            $"&fullName={Uri.EscapeDataString(result.FullName)}" +
            $"&role={Uri.EscapeDataString(result.Role)}" +
            $"&expiresAt={Uri.EscapeDataString(result.ExpiresAt.ToString("o"))}" +
            $"&returnUrl={Uri.EscapeDataString(safeReturnUrl)}";

        return Redirect(redirectTarget);
    }

    [Authorize]
    [HttpGet("external-accounts")]
    public async Task<IActionResult> GetExternalAccounts()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized();
        }

        var accounts = await _authService.GetExternalAccountsAsync(userId);
        return Ok(accounts);
    }

    [Authorize]
    [HttpDelete("external-accounts/{provider}")]
    public async Task<IActionResult> UnlinkExternalAccount(string provider)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized();
        }

        var success = await _authService.UnlinkExternalAccountAsync(userId, provider);
        if (!success)
        {
            return BadRequest(new { message = $"Không tìm thấy liên kết với {provider} để hủy." });
        }

        return Ok(new { message = $"Đã hủy liên kết với {provider} thành công." });
    }
}
