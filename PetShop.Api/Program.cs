using System.IO.Compression;
using System.Text;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using PetShop.Api.Data;
using PetShop.Api.Hubs;
using PetShop.Api.Services;

// Tự động nạp cấu hình từ file .env nếu có (dành cho môi trường development / Docker)
static void LoadDotEnv(string filePath)
{
    if (!File.Exists(filePath)) return;
    foreach (var line in File.ReadAllLines(filePath))
    {
        var trimmed = line.Trim();
        if (string.IsNullOrWhiteSpace(trimmed) || trimmed.StartsWith("#")) continue;
        var separatorIndex = trimmed.IndexOf('=');
        if (separatorIndex > 0)
        {
            var key = trimmed.Substring(0, separatorIndex).Trim();
            var value = trimmed.Substring(separatorIndex + 1).Trim().Trim('"', '\'');
            if (!string.IsNullOrEmpty(key) && string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
            {
                Environment.SetEnvironmentVariable(key, value);
            }
        }
    }
}

var currentDirectory = Directory.GetCurrentDirectory();
LoadDotEnv(Path.Combine(currentDirectory, ".env"));
var parentDirectory = Directory.GetParent(currentDirectory)?.FullName;
if (!string.IsNullOrEmpty(parentDirectory))
{
    LoadDotEnv(Path.Combine(parentDirectory, ".env"));
}

var builder = WebApplication.CreateBuilder(args);

// Đảm bảo nạp các biến môi trường vào hệ thống Configuration
builder.Configuration.AddEnvironmentVariables();

// 1. Cấu hình DbContext kết nối SQL Server (đọc từ Environment Variables hoặc appsettings)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (string.IsNullOrWhiteSpace(connectionString))
{
    connectionString = builder.Configuration["ConnectionStrings:DefaultConnection"]
        ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
        ?? "Server=localhost;Database=PetShopDb;Trusted_Connection=True;TrustServerCertificate=True;";
}

builder.Services.AddDbContext<PetShopDbContext>(options =>
{
    options.UseSqlServer(connectionString);
});

// 2. Kỹ thuật tối ưu: Caching với IMemoryCache
builder.Services.AddMemoryCache();

// 3. Kỹ thuật tối ưu: Response Compression (Brotli & Gzip)
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

builder.Services.Configure<GzipCompressionProviderOptions>(options =>
{
    options.Level = CompressionLevel.Fastest;
});

// 4. Cấu hình Dependency Injection cho các Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IPetService, PetService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IChatService, ChatService>();

// Realtime SignalR
builder.Services.AddSignalR();

// 5. Cấu hình Xác thực JWT Authentication & OAuth Providers từ Environment Variables
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
{
    jwtKey = Environment.GetEnvironmentVariable("Jwt__Key") 
        ?? "PetShopSecretKey2026SuperSecureKeyWithLongEnoughEntropy!";
}
var issuer = builder.Configuration["Jwt:Issuer"] ?? "PetShopApi";
var audience = builder.Configuration["Jwt:Audience"] ?? "PetShopClient";

// Hàm xử lý lỗi khi người dùng từ chối/hủy cấp quyền ở trang OAuth bên thứ 3
Task HandleRemoteFailure(RemoteFailureContext context)
{
    var frontendOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
    var frontendBaseUrl = frontendOrigins?.FirstOrDefault() ?? "http://localhost:4200";

    var isLinkFlow = context.Properties?.Items.ContainsKey("link_token") == true;
    var targetUrl = isLinkFlow
        ? $"{frontendBaseUrl}/profile/settings?error={Uri.EscapeDataString("Bạn đã hủy hoặc từ chối liên kết tài khoản bên thứ 3.")}"
        : $"{frontendBaseUrl}/auth/login?error={Uri.EscapeDataString("Bạn đã hủy hoặc từ chối đăng nhập bằng tài khoản bên thứ 3.")}";

    context.Response.Redirect(targetUrl);
    context.HandleResponse();
    return Task.CompletedTask;
}

var authBuilder = builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddCookie("ExternalAuth", options =>
{
    options.Cookie.Name = ".PetShop.ExternalAuth";
    options.ExpireTimeSpan = TimeSpan.FromMinutes(10);
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Cookie.HttpOnly = true;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ClockSkew = TimeSpan.Zero
    };

    // Đọc JWT Token từ query string cho kết nối SignalR WebSocket/SSE
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs/chat"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

// Cấu hình Google OAuth
var googleClientId = builder.Configuration["Authentication:Google:ClientId"]
    ?? Environment.GetEnvironmentVariable("Authentication__Google__ClientId");
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]
    ?? Environment.GetEnvironmentVariable("Authentication__Google__ClientSecret");

if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
{
    authBuilder.AddGoogle("Google", options =>
    {
        options.SignInScheme = "ExternalAuth";
        options.ClientId = googleClientId;
        options.ClientSecret = googleClientSecret;
        options.CallbackPath = "/signin-google";
        options.SaveTokens = true;
        options.ClaimActions.MapJsonKey("picture", "picture");
        options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.Events.OnRemoteFailure = HandleRemoteFailure;
    });
}

// Cấu hình Facebook OAuth
var facebookAppId = builder.Configuration["Authentication:Facebook:AppId"]
    ?? Environment.GetEnvironmentVariable("Authentication__Facebook__AppId");
var facebookAppSecret = builder.Configuration["Authentication:Facebook:AppSecret"]
    ?? Environment.GetEnvironmentVariable("Authentication__Facebook__AppSecret");

if (!string.IsNullOrEmpty(facebookAppId) && !string.IsNullOrEmpty(facebookAppSecret))
{
    authBuilder.AddFacebook("Facebook", options =>
    {
        options.SignInScheme = "ExternalAuth";
        options.AppId = facebookAppId;
        options.AppSecret = facebookAppSecret;
        options.CallbackPath = "/signin-facebook";
        options.SaveTokens = true;
        options.Fields.Add("picture");
        options.ClaimActions.MapCustomJson("picture", user =>
        {
            if (user.TryGetProperty("picture", out var picture) &&
                picture.TryGetProperty("data", out var data) &&
                data.TryGetProperty("url", out var url))
            {
                return url.GetString();
            }
            return null;
        });
        options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.Events.OnRemoteFailure = HandleRemoteFailure;
    });
}

// Cấu hình GitHub OAuth
var githubClientId = builder.Configuration["Authentication:GitHub:ClientId"]
    ?? Environment.GetEnvironmentVariable("Authentication__GitHub__ClientId");
var githubClientSecret = builder.Configuration["Authentication:GitHub:ClientSecret"]
    ?? Environment.GetEnvironmentVariable("Authentication__GitHub__ClientSecret");

if (!string.IsNullOrEmpty(githubClientId) && !string.IsNullOrEmpty(githubClientSecret))
{
    authBuilder.AddGitHub("GitHub", options =>
    {
        options.SignInScheme = "ExternalAuth";
        options.ClientId = githubClientId;
        options.ClientSecret = githubClientSecret;
        options.CallbackPath = "/signin-github";
        options.SaveTokens = true;
        options.Scope.Add("user:email");
        options.ClaimActions.MapJsonKey("avatar_url", "avatar_url");
        options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.Events.OnRemoteFailure = HandleRemoteFailure;
    });
}

builder.Services.AddAuthorization();

// 6. Cấu hình CORS cho Angular 12 Client
builder.Services.AddCors(options =>
{
    options.AddPolicy("PetShopCorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:4200", "http://127.0.0.1:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// 7. Controllers & JSON Options
builder.Services.AddControllers();

// 8. Swagger / OpenAPI Documentation có hỗ trợ JWT Token test trực tiếp
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "PetShop API (.NET 10)", 
        Version = "v1",
        Description = "Hệ thống API RESTful bán thú cưng và phụ kiện cho website PetShop"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header sử dụng scheme Bearer. Ví dụ: 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecuritySchemeReference("Bearer"),
            new List<string>()
        }
    });
});

var app = builder.Build();

// Tự động khởi tạo Database và nạp dữ liệu mẫu phong phú khi khởi động
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<PetShopDbContext>();
        DbInitializer.Initialize(context);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Lỗi khi tự động khởi tạo cơ sở dữ liệu và nạp seed data.");
    }
}

// Pipeline Middleware
app.UseResponseCompression();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "PetShop API v1");
    });
}

app.UseCors("PetShopCorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
