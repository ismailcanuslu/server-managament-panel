using Microsoft.AspNetCore.Mvc;
using web_panel_app.Models;
using web_panel_app.Services;

namespace web_panel_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class Apache2Controller : ControllerBase
    {
        private readonly IApache2Service _apache2Service;
        private readonly ILogger<Apache2Controller> _logger;

        public Apache2Controller(IApache2Service apache2Service, ILogger<Apache2Controller> logger)
        {
            _apache2Service = apache2Service;
            _logger = logger;
        }

        [HttpGet("status")]
        public async Task<ActionResult<Apache2ServiceModel>> GetStatus()
        {
            try
            {
                var status = await _apache2Service.GetStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Apache2 durumu alınırken hata oluştu");
                return StatusCode(500, "İşlem sırasında bir hata oluştu");
            }
        }

        [HttpPost("start")]
        public async Task<IActionResult> Start()
        {
            var result = await _apache2Service.StartServiceAsync();
            return result ? Ok() : BadRequest("Servis başlatılamadı");
        }

        [HttpPost("stop")]
        public async Task<IActionResult> Stop()
        {
            var result = await _apache2Service.StopServiceAsync();
            return result ? Ok() : BadRequest("Servis durdurulamadı");
        }

        [HttpPost("restart")]
        public async Task<IActionResult> Restart()
        {
            var result = await _apache2Service.RestartServiceAsync();
            return result ? Ok() : BadRequest("Servis yeniden başlatılamadı");
        }

        [HttpPost("reload")]
        public async Task<IActionResult> Reload()
        {
            var result = await _apache2Service.ReloadConfigAsync();
            return result ? Ok() : BadRequest("Yapılandırma yeniden yüklenemedi");
        }

        [HttpGet("vhosts")]
        public async Task<ActionResult<List<VirtualHost>>> GetVirtualHosts()
        {
            try
            {
                var vhosts = await _apache2Service.GetVirtualHostsAsync();
                _logger.LogInformation("Retrieved {Count} virtual hosts", vhosts.Count);
                return Ok(vhosts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Virtual host'lar alınırken hata oluştu");
                return StatusCode(500, "Virtual host'lar alınırken bir hata oluştu");
            }
        }

        [HttpGet("error-log")]
        public async Task<ActionResult<string>> GetErrorLog([FromQuery] int lines = 100)
        {
            var log = await _apache2Service.GetErrorLogAsync(lines);
            return Ok(log);
        }

        [HttpPost("test-config")]
        public async Task<IActionResult> TestConfig()
        {
            var result = await _apache2Service.TestConfigAsync();
            return result ? Ok("Yapılandırma geçerli") : BadRequest("Yapılandırma hatalı");
        }

        [HttpPost("sites")]
        public async Task<IActionResult> AddSite([FromBody] AddSiteRequest request)
        {
            var result = await _apache2Service.AddSiteConfigAsync(request.SiteName, request.ConfigContent);
            return result ? Ok() : BadRequest("Site yapılandırması eklenemedi");
        }

        [HttpDelete("sites/{siteName}")]
        public async Task<IActionResult> DeleteSite(string siteName)
        {
            var result = await _apache2Service.DeleteSiteConfigAsync(siteName);
            return result ? Ok() : BadRequest("Site yapılandırması silinemedi");
        }

        [HttpPost("sites/{siteName}/enable")]
        public async Task<IActionResult> EnableSite(string siteName)
        {
            var result = await _apache2Service.EnableSiteAsync(siteName);
            return result ? Ok() : BadRequest("Site etkinleştirilemedi");
        }

        [HttpPost("sites/{siteName}/disable")]
        public async Task<IActionResult> DisableSite(string siteName)
        {
            var result = await _apache2Service.DisableSiteAsync(siteName);
            return result ? Ok() : BadRequest("Site devre dışı bırakılamadı");
        }

        [HttpGet("sites/{siteName}/config")]
        public async Task<ActionResult<string>> GetSiteConfig(string siteName)
        {
            var config = await _apache2Service.GetSiteConfigAsync(siteName);
            return !string.IsNullOrEmpty(config) ? Ok(config) : NotFound("Site yapılandırması bulunamadı");
        }

        [HttpGet("sites")]
        public async Task<ActionResult<List<string>>> GetAvailableSites()
        {
            var sites = await _apache2Service.GetAvailableSitesAsync();
            return Ok(sites);
        }
    }
}