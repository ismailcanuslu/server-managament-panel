using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Text;
using System;
using Microsoft.AspNetCore.Authorization;

namespace Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly JwtService _jwtService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            JwtService jwtService,
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _jwtService = jwtService;
            _configuration = configuration;
            _logger = logger;
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public ActionResult<LoginResponse> Login([FromBody] LoginRequest request)
        {
            try
            {
                // Basit doğrulama - gerçek uygulamada veritabanından kontrol edilmeli
                var configUsername = _configuration["Auth:Username"] ?? "admin";
                var configPassword = _configuration["Auth:Password"] ?? "admin";

                if (request.Username != configUsername || request.Password != configPassword)
                {
                    return Unauthorized(new { error = "Geçersiz kullanıcı adı veya şifre" });
                }

                var token = _jwtService.GenerateToken(request.Username);

                // JWT'yi cookie olarak ayarla
                Response.Cookies.Append("jwt", token, new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.Strict,
                    Expires = DateTime.Now.AddDays(1)
                });

                return Ok(new LoginResponse { Token = token });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Login işlemi sırasında hata oluştu");
                return BadRequest(new { error = "Giriş yapılamadı" });
            }
        }

        [Authorize]
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("jwt");
            return Ok(new { message = "Çıkış yapıldı" });
        }
    }
}