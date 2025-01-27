using web_panel_app.Models;

namespace web_panel_app.Services
{
    public interface ISystemInfoService
    {
        Task<SystemInfo> GetSystemInfoAsync();
    }
}