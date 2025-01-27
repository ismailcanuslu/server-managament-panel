using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class WebSshController : ControllerBase
    {
        private readonly SshConnectionManager _sshManager;
        private readonly ILogger<WebSshController> _logger;

        public WebSshController(
            SshConnectionManager sshManager,
            ILogger<WebSshController> logger)
        {
            _sshManager = sshManager;
            _logger = logger;
        }

        [HttpGet("connections")]
        public ActionResult<List<SshConnection>> GetConnections()
        {
            return _sshManager.GetActiveConnections();
        }

        [HttpPost("connect")]
        public ActionResult<string> Connect(SshConnectionRequest request)
        {
            try
            {
                var connectionId = _sshManager.CreateConnection(request);
                return Ok(new { connectionId });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SSH bağlantısı oluşturulamadı");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("disconnect/{connectionId}")]
        public IActionResult Disconnect(string connectionId)
        {
            try
            {
                _sshManager.CloseConnection(connectionId);
                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SSH bağlantısı kapatılamadı");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("{connectionId}/execute")]
        public async Task<ActionResult<string>> ExecuteCommand(string connectionId, [FromBody] string command)
        {
            try
            {
                var client = _sshManager.GetConnection(connectionId);
                using var cmd = client.CreateCommand(command);
                var result = await Task.Run(() => cmd.Execute());
                return Ok(new { output = result });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Komut çalıştırılamadı");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpGet("default-connection")]
        public ActionResult<SshConnection> GetDefaultConnection()
        {
            try
            {
                // Varsayılan bağlantıyı al
                var client = _sshManager.GetConnection("default");

                return Ok(new SshConnection
                {
                    Id = "default",
                    Name = "Localhost",
                    Host = "localhost",
                    IsConnected = client.IsConnected,
                    LastActivity = DateTime.Now
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Varsayılan SSH bağlantısı alınamadı");
                return BadRequest(new { error = ex.Message });
            }
        }

        [HttpPost("use-default")]
        public ActionResult<string> UseDefaultConnection()
        {
            try
            {
                // Varsayılan bağlantıyı kontrol et ve bağlantı ID'sini döndür
                var client = _sshManager.GetConnection("default");
                if (client.IsConnected)
                {
                    return Ok(new { connectionId = "default" });
                }

                // Eğer bağlantı kopuksa yeniden bağlan
                _sshManager.ReconnectDefault();
                return Ok(new { connectionId = "default" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Varsayılan SSH bağlantısı kullanılamadı");
                return BadRequest(new { error = ex.Message });
            }
        }
    }
}