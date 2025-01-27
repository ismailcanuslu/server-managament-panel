using web_panel_app.Models;

namespace web_panel_app.Services
{
    public interface IApache2Service
    {
        Task<Apache2ServiceModel> GetStatusAsync();
        Task<bool> StartServiceAsync();
        Task<bool> StopServiceAsync();
        Task<bool> RestartServiceAsync();
        Task<bool> ReloadConfigAsync();
        Task<List<VirtualHost>> GetVirtualHostsAsync();
        Task<string> GetErrorLogAsync(int lines = 100);
        Task<bool> TestConfigAsync();
        Task<bool> AddSiteConfigAsync(string siteName, string configContent);
        Task<bool> DeleteSiteConfigAsync(string siteName);
        Task<bool> EnableSiteAsync(string siteName);
        Task<bool> DisableSiteAsync(string siteName);
        Task<string> GetSiteConfigAsync(string siteName);
        Task<List<string>> GetAvailableSitesAsync();
    }
}