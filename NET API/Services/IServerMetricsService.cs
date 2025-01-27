using web_panel_app.Models;

namespace web_panel_app.Services
{
    public interface IServerMetricsService
    {
        Task<ServerMetrics> GetMetricsAsync();
        Task<CpuMetrics> GetCpuMetricsAsync();
        Task<MemoryMetrics> GetMemoryMetricsAsync();
        Task<NetworkMetrics> GetNetworkMetricsAsync();
        Task<List<DiskMetrics>> GetDiskMetricsAsync();
    }
}