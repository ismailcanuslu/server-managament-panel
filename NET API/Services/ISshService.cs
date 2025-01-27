using web_panel_app.Models;

namespace web_panel_app.Services
{
    public interface ISshService
    {
        Task<string> ExecuteCommandAsync(string command);
        Task<List<PM2Process>> GetPM2ProcessesAsync();
        Task<bool> StartPM2ProcessAsync(string processName);
        Task<bool> StopPM2ProcessAsync(string processName);
        Task<bool> RestartPM2ProcessAsync(string processName);
    }
}