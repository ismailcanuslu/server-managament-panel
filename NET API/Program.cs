using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using web_panel_app.Services;
using web_panel_app.Models;
using WebSSH.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement()
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                },
                Scheme = "oauth2",
                Name = "Bearer",
                In = ParameterLocation.Header,
            },
            new List<string>()
        }
    });
});

// SSH bağlantı yöneticisini singleton olarak kaydet
builder.Services.AddSingleton<SshConnectionManager>();

// SSH servisini scoped olarak kaydet
builder.Services.AddScoped<ISshService, SshService>();

// Diğer servis kayıtları...
builder.Services.AddScoped<IApache2Service, Apache2Service>();
builder.Services.AddScoped<ICertificateService, CertificateService>();
builder.Services.AddScoped<IFtpService, FtpService>();
builder.Services.AddScoped<IMariaDbService, MariaDbService>();
builder.Services.AddScoped<IPM2Service, PM2Service>();
builder.Services.AddScoped<IServerMetricsService, ServerMetricsService>();
builder.Services.AddScoped<ISystemInfoService, SystemInfoService>();

// SignalR'ı ekle
builder.Services.AddSignalR();

// Options'ları kaydet
builder.Services.Configure<FileUploadOptions>(
    builder.Configuration.GetSection("FileUpload")
);

// Upload limitlerini ayarla
var fileUploadOptions = builder.Configuration
    .GetSection("FileUpload")
    .Get<FileUploadOptions>();

var maxFileSize = fileUploadOptions?.MaxFileSize ?? 1073741824; // 1GB default

builder.Services.Configure<IISServerOptions>(options =>
{
    options.MaxRequestBodySize = maxFileSize;
});

builder.Services.Configure<KestrelServerOptions>(options =>
{
    options.Limits.MaxRequestBodySize = maxFileSize;
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = Convert.ToInt32(Math.Min(maxFileSize, int.MaxValue));
    options.ValueLengthLimit = int.MaxValue;
    options.MemoryBufferThreshold = int.MaxValue;
});

// JWT servisini ekle
builder.Services.AddSingleton<JwtService>();

// JWT kimlik doğrulamayı ekle
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "defaultSecretKey123!"))
        };

        // JWT'yi cookie'den al
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token = context.Request.Cookies["jwt"];
                return Task.CompletedTask;
            }
        };
    });

// Global authorization policy ekle
builder.Services.AddAuthorization(options =>
{
    options.FallbackPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
    {
        var forecast = Enumerable.Range(1, 5).Select(index =>
                new WeatherForecast
                (
                    DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
                    Random.Shared.Next(-20, 55),
                    summaries[Random.Shared.Next(summaries.Length)]
                ))
            .ToArray();
        return forecast;
    })
    .WithName("GetWeatherForecast");

// Uygulama kapatılırken SSH bağlantısını kapat
app.Lifetime.ApplicationStopping.Register(() =>
{
    var sshManager = app.Services.GetRequiredService<SshConnectionManager>();
    sshManager.Dispose();
});

// SignalR endpoint'ini ekle
app.MapHub<SshHub>("/sshHub");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}