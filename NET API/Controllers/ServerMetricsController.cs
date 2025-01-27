using Microsoft.AspNetCore.Mvc;
using web_panel_app.Models;
using web_panel_app.Services;

namespace web_panel_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServerMetricsController : ControllerBase
    {
        private readonly IServerMetricsService _metricsService;
        private readonly ILogger<ServerMetricsController> _logger;

        public ServerMetricsController(IServerMetricsService metricsService, ILogger<ServerMetricsController> logger)
        {
            _metricsService = metricsService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<ServerMetrics>> GetMetrics()
        {
            var metrics = await _metricsService.GetMetricsAsync();
            return Ok(metrics);
        }

        [HttpGet("cpu")]
        public async Task<ActionResult<CpuMetrics>> GetCpuMetrics()
        {
            var metrics = await _metricsService.GetCpuMetricsAsync();
            return Ok(metrics);
        }

        [HttpGet("memory")]
        public async Task<ActionResult<MemoryMetrics>> GetMemoryMetrics()
        {
            var metrics = await _metricsService.GetMemoryMetricsAsync();
            return Ok(metrics);
        }

        [HttpGet("network")]
        public async Task<ActionResult<NetworkMetrics>> GetNetworkMetrics()
        {
            var metrics = await _metricsService.GetNetworkMetricsAsync();
            return Ok(metrics);
        }

        [HttpGet("disk")]
        public async Task<ActionResult<List<DiskMetrics>>> GetDiskMetrics()
        {
            var metrics = await _metricsService.GetDiskMetricsAsync();
            return Ok(metrics);
        }
    }
}