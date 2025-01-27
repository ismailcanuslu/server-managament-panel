using Microsoft.AspNetCore.Mvc;
using web_panel_app.Models;
using web_panel_app.Services;

namespace web_panel_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PM2Controller : ControllerBase
    {
        private readonly IPM2Service _pm2Service;
        private readonly ILogger<PM2Controller> _logger;

        public PM2Controller(IPM2Service pm2Service, ILogger<PM2Controller> logger)
        {
            _pm2Service = pm2Service;
            _logger = logger;
        }

        [HttpGet("list")]
        public async Task<ActionResult<List<PM2Process>>> GetProcesses()
        {
            var processes = await _pm2Service.GetProcessesAsync();
            return Ok(processes);
        }

        [HttpPost("execute")]
        public async Task<IActionResult> ExecuteCommand([FromBody] string command)
        {
            try
            {
                var (success, response) = await _pm2Service.ExecutePM2CommandAsync(command);

                if (response == null)
                {
                    return StatusCode(500, new PM2Error
                    {
                        StatusCode = 500,
                        Message = "Beklenmeyen bir yanıt alındı",
                        Command = command
                    });
                }

                return StatusCode(response.StatusCode, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PM2 komutu çalıştırılırken hata oluştu");
                return StatusCode(500, new PM2Error
                {
                    StatusCode = 500,
                    Message = "Beklenmeyen bir hata oluştu",
                    Command = command,
                    Output = ex.ToString()
                });
            }
        }

        [HttpGet("logs/{appName}")]
        public async Task<ActionResult<PM2Logs>> GetLogs(string appName)
        {
            var logs = await _pm2Service.GetApplicationLogsAsync(appName);
            return Ok(logs);
        }
    }
}