using Microsoft.AspNetCore.Mvc;
using web_panel_app.Models;
using web_panel_app.Services;

namespace web_panel_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CertificateController : ControllerBase
    {
        private readonly ICertificateService _certificateService;
        private readonly ILogger<CertificateController> _logger;

        public CertificateController(ICertificateService certificateService, ILogger<CertificateController> logger)
        {
            _certificateService = certificateService;
            _logger = logger;
        }

        [HttpGet("list")]
        public async Task<ActionResult<List<Certificate>>> ListCertificates()
        {
            var certificates = await _certificateService.ListCertificatesAsync();
            return Ok(certificates);
        }

        [HttpPost("request")]
        public async Task<IActionResult> RequestCertificate([FromBody] CertificateRequest request)
        {
            var result = await _certificateService.RequestCertificateAsync(request);
            return result ? Ok() : BadRequest("Sertifika alınamadı");
        }

        [HttpPost("revoke/{domain}")]
        public async Task<IActionResult> RevokeCertificate(string domain)
        {
            var result = await _certificateService.RevokeCertificateAsync(domain);
            return result ? Ok() : BadRequest("Sertifika iptal edilemedi");
        }

        [HttpPost("renew/{domain}")]
        public async Task<IActionResult> RenewCertificate(string domain)
        {
            var result = await _certificateService.RenewCertificateAsync(domain);
            return result ? Ok() : BadRequest("Sertifika yenilenemedi");
        }
    }
}