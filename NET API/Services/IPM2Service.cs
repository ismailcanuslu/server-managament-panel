using web_panel_app.Models;

namespace web_panel_app.Services
{
    public interface IPM2Service
    {
        Task<(bool Success, PM2Error? Error)> ExecutePM2CommandAsync(string command);
        Task<PM2Logs> GetApplicationLogsAsync(string appName);
        Task<List<PM2Process>> GetProcessesAsync();
    }
}