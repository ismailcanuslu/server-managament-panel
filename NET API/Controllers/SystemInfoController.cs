using Microsoft.AspNetCore.Mvc;
using web_panel_app.Models;
using web_panel_app.Services;

namespace web_panel_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SystemInfoController : ControllerBase
    {
        private readonly ISystemInfoService _systemInfoService;
        private readonly ILogger<SystemInfoController> _logger;

        public SystemInfoController(ISystemInfoService systemInfoService, ILogger<SystemInfoController> logger)
        {
            _systemInfoService = systemInfoService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<SystemInfo>> GetSystemInfo()
        {
            var info = await _systemInfoService.GetSystemInfoAsync();
            return Ok(info);
        }
    }
}