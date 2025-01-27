using web_panel_app.Models;

namespace web_panel_app.Services
{
    public class SystemInfoService : ISystemInfoService
    {
        private readonly ISshService _sshService;
        private readonly IApache2Service _apache2Service;
        private readonly IMariaDbService _mariaDbService;
        private readonly ILogger<SystemInfoService> _logger;

        public SystemInfoService(
            ISshService sshService,
            IApache2Service apache2Service,
            IMariaDbService mariaDbService,
            ILogger<SystemInfoService> logger)
        {
            _sshService = sshService;
            _apache2Service = apache2Service;
            _mariaDbService = mariaDbService;
            _logger = logger;
        }

        public async Task<SystemInfo> GetSystemInfoAsync()
        {
            try
            {
                return new SystemInfo
                {
                    OperatingSystem = await GetOsInfoAsync(),
                    Services = await GetServiceCountsAsync()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sistem bilgileri alınırken hata oluştu");
                throw;
            }
        }

        private async Task<OsInfo> GetOsInfoAsync()
        {
            try
            {
                var osName = await _sshService.ExecuteCommandAsync("cat /etc/os-release | grep PRETTY_NAME | cut -d '\"' -f2");
                var kernel = await _sshService.ExecuteCommandAsync("uname -r");
                var arch = await _sshService.ExecuteCommandAsync("uname -m");
                var uptime = await _sshService.ExecuteCommandAsync(@"uptime -p | sed 's/up //g'");

                return new OsInfo
                {
                    Name = osName.Trim(),
                    Kernel = kernel.Trim(),
                    Architecture = arch.Trim(),
                    Uptime = uptime.Trim()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "İşletim sistemi bilgileri alınırken hata oluştu");
                throw;
            }
        }

        private async Task<ServiceCounts> GetServiceCountsAsync()
        {
            try
            {
                // Apache2 site sayısı - GetAvailableSitesAsync kullanarak
                var apache2Sites = (await _apache2Service.GetAvailableSitesAsync()).Count;

                // PM2 servis sayısı
                var pm2Services = (await _sshService.GetPM2ProcessesAsync()).Count;

                // MariaDB veritabanı sayısı
                var databases = await _mariaDbService.GetDatabasesAsync();
                var mariaDbCount = databases.Count;

                return new ServiceCounts
                {
                    Apache2Sites = apache2Sites,
                    Pm2Services = pm2Services,
                    MariaDbDatabases = mariaDbCount
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Servis sayıları alınırken hata oluştu");
                throw;
            }
        }
    }
}