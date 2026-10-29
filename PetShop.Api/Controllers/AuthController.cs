using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using PetShop.Api.DTOs;
using PetShop.Api.Services;

namespace PetShop.Api.Controllers;

public class LinkTokenData
{
    public int UserId { get; set; }
    public string Provider { get; set; } = string.Empty;
}

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IConfiguration _configuration;
    private readonly IMemoryCache _cache;

    public AuthController(IAuthService authService, IConfiguration configuration, IMemoryCache cache)
    {
        _authService = authService;
        _configuration = configuration;
        _cache = cache;
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
            var err = Uri.EscapeDataString(authResult.Failure?.Message ?? "Xác thực tài khoản bên thứ 3 thất bại hoặc bạn đã từ chối.");
            return Redirect($"{frontendBaseUrl}/auth/login?error={err}");
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
            return Redirect($"{frontendBaseUrl}/auth/login?error={Uri.EscapeDataString("Không nhận diện được định danh tài khoản bên thứ 3.")}");
        }

        var result = await _authService.ExternalLoginAsync(provider, providerKey, email, fullName, avatarUrl);

        await HttpContext.SignOutAsync("ExternalAuth");

        if (result == null)
        {
            return Redirect($"{frontendBaseUrl}/auth/login?error={Uri.EscapeDataString("Tài khoản của bạn đã bị khóa hoặc không thể đăng nhập.")}");
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
    [HttpPost("link/initiate")]
    public async Task<IActionResult> InitiateLinkExternal([FromBody] LinkInitiateRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var validProviders = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "Google", "Google" },
            { "Facebook", "Facebook" },
            { "GitHub", "GitHub" }
        };

        if (!validProviders.TryGetValue(dto.Provider, out var matchedProvider))
        {
            return BadRequest(new { message = $"Nhà cung cấp '{dto.Provider}' không được hỗ trợ." });
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
        {
            return Unauthorized();
        }

        // Kiểm tra xem người dùng đã liên kết với provider này chưa
        var currentAccounts = await _authService.GetExternalAccountsAsync(userId);
        if (currentAccounts.Any(a => a.Provider.Equals(matchedProvider, StringComparison.OrdinalIgnoreCase)))
        {
            return BadRequest(new { message = $"Bạn đã liên kết với tài khoản {matchedProvider} rồi." });
        }

        var linkToken = Guid.NewGuid().ToString("N");
        var tokenData = new LinkTokenData
        {
            UserId = userId,
            Provider = matchedProvider
        };

        _cache.Set($"link_token:{linkToken}", tokenData, TimeSpan.FromMinutes(5));

        var redirectUrl = $"{Request.Scheme}://{Request.Host}/api/auth/link/{matchedProvider}?token={linkToken}";
        return Ok(new LinkInitiateResponseDto { RedirectUrl = redirectUrl });
    }

    [HttpGet("link/{provider}")]
    public IActionResult LinkExternal([FromRoute] string provider, [FromQuery] string token)
    {
        var frontendOrigins = _configuration.GetSection("AllowedOrigins").Get<string[]>();
        var frontendBaseUrl = frontendOrigins?.FirstOrDefault() ?? "http://localhost:4200";

        if (string.IsNullOrWhiteSpace(token) || !_cache.TryGetValue($"link_token:{token}", out LinkTokenData? tokenData) || tokenData == null)
        {
            return Redirect($"{frontendBaseUrl}/profile/settings?error={Uri.EscapeDataString("Yêu cầu liên kết đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.")}");
        }

        if (!tokenData.Provider.Equals(provider, StringComparison.OrdinalIgnoreCase))
        {
            return Redirect($"{frontendBaseUrl}/profile/settings?error={Uri.EscapeDataString("Thông tin nhà cung cấp không khớp với yêu cầu liên kết.")}");
        }

        var redirectUrl = Url.Action(nameof(LinkCallback), "Auth");
        var properties = new AuthenticationProperties
        {
            RedirectUri = redirectUrl
        };

        properties.Items["link_token"] = token;
        properties.Items["user_id"] = tokenData.UserId.ToString();
        properties.Items["link_provider"] = tokenData.Provider;

        return Challenge(properties, tokenData.Provider);
    }

    [HttpGet("link-callback")]
    public async Task<IActionResult> LinkCallback()
    {
        var frontendOrigins = _configuration.GetSection("AllowedOrigins").Get<string[]>();
        var frontendBaseUrl = frontendOrigins?.FirstOrDefault() ?? "http://localhost:4200";

        var authResult = await HttpContext.AuthenticateAsync("ExternalAuth");
        if (!authResult.Succeeded || authResult.Principal == null)
        {
            var err = Uri.EscapeDataString(authResult.Failure?.Message ?? "Xác thực liên kết tài khoản thất bại hoặc bạn đã từ chối.");
            return Redirect($"{frontendBaseUrl}/profile/settings?error={err}");
        }

        var principal = authResult.Principal;

        var linkToken = authResult.Properties?.Items.TryGetValue("link_token", out var tokenVal) == true ? tokenVal : null;
        var userIdStr = authResult.Properties?.Items.TryGetValue("user_id", out var uidVal) == true ? uidVal : null;
        var provider = authResult.Properties?.Items.TryGetValue("link_provider", out var pVal) == true ? pVal : null;

        if (string.IsNullOrEmpty(linkToken) || string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId) || string.IsNullOrEmpty(provider))
        {
            await HttpContext.SignOutAsync("ExternalAuth");
            return Redirect($"{frontendBaseUrl}/profile/settings?error={Uri.EscapeDataString("Thông tin phiên liên kết không hợp lệ hoặc đã hết hạn.")}");
        }

        // Kiểm tra và xóa token khỏi cache (chỉ dùng 1 lần)
        if (!_cache.TryGetValue($"link_token:{linkToken}", out LinkTokenData? _))
        {
            await HttpContext.SignOutAsync("ExternalAuth");
            return Redirect($"{frontendBaseUrl}/profile/settings?error={Uri.EscapeDataString("Phiên liên kết tài khoản đã hết hạn.")}");
        }
        _cache.Remove($"link_token:{linkToken}");

        var providerKey = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? principal.FindFirst("sub")?.Value
            ?? principal.FindFirst("id")?.Value;

        var email = principal.FindFirst(ClaimTypes.Email)?.Value
            ?? principal.FindFirst("email")?.Value;

        var avatarUrl = principal.FindFirst("picture")?.Value
            ?? principal.FindFirst("urn:google:picture")?.Value
            ?? principal.FindFirst("avatar_url")?.Value
            ?? principal.FindFirst("urn:github:avatar")?.Value;

        if (string.IsNullOrEmpty(providerKey))
        {
            await HttpContext.SignOutAsync("ExternalAuth");
            return Redirect($"{frontendBaseUrl}/profile/settings?error={Uri.EscapeDataString("Không nhận diện được định danh tài khoản bên thứ 3.")}");
        }

        var linkResult = await _authService.LinkExternalAccountAsync(userId, provider, providerKey, email, avatarUrl);

        await HttpContext.SignOutAsync("ExternalAuth");

        if (!linkResult.Success)
        {
            return Redirect($"{frontendBaseUrl}/profile/settings?error={Uri.EscapeDataString(linkResult.ErrorMessage ?? "Không thể liên kết tài khoản.")}&provider={Uri.EscapeDataString(provider)}");
        }

        return Redirect($"{frontendBaseUrl}/profile/settings?success={Uri.EscapeDataString($"Liên kết tài khoản {provider} thành công!")}&provider={Uri.EscapeDataString(provider)}");
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
