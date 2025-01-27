using System.Text.RegularExpressions;
using web_panel_app.Models;

namespace web_panel_app.Services
{
    public class Apache2Service : IApache2Service
    {
        private readonly ISshService _sshService;
        private readonly ILogger<Apache2Service> _logger;

        public Apache2Service(ISshService sshService, ILogger<Apache2Service> logger)
        {
            _sshService = sshService;
            _logger = logger;
        }

        public async Task<Apache2ServiceModel> GetStatusAsync()
        {
            try
            {
                var statusOutput = await _sshService.ExecuteCommandAsync("systemctl status apache2");
                var portsOutput = await _sshService.ExecuteCommandAsync("netstat -tlpn | grep apache2");

                var service = new Apache2ServiceModel()
                {
                    Name = "Apache2",
                    IsActive = statusOutput.Contains("active (running)"),
                    Status = ParseStatus(statusOutput),
                    Ports = ParsePorts(portsOutput)
                };

                service.VirtualHosts = await GetVirtualHostsAsync();
                return service;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Apache2 durumu alınırken hata oluştu");
                throw;
            }
        }

        public async Task<bool> StartServiceAsync()
        {
            try
            {
                await _sshService.ExecuteCommandAsync("systemctl start apache2");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Apache2 başlatılırken hata oluştu");
                return false;
            }
        }

        public async Task<bool> StopServiceAsync()
        {
            try
            {
                await _sshService.ExecuteCommandAsync("systemctl stop apache2");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Apache2 durdurulurken hata oluştu");
                return false;
            }
        }

        public async Task<bool> RestartServiceAsync()
        {
            try
            {
                await _sshService.ExecuteCommandAsync("systemctl restart apache2");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Apache2 yeniden başlatılırken hata oluştu");
                return false;
            }
        }

        public async Task<bool> ReloadConfigAsync()
        {
            try
            {
                await _sshService.ExecuteCommandAsync("systemctl reload apache2");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Apache2 yapılandırması yeniden yüklenirken hata oluştu");
                return false;
            }
        }

        public async Task<List<VirtualHost>> GetVirtualHostsAsync()
        {
            try
            {
                var vhosts = new List<VirtualHost>();

                // Önce aktif siteleri belirlemek için apache2ctl -S çıktısını al
                var activeConfigs = await _sshService.ExecuteCommandAsync("apache2ctl -S 2>&1");
                var activeVhosts = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

                // Aktif siteleri belirle
                foreach (var line in activeConfigs.Split('\n'))
                {
                    if (line.Contains("namevhost") || line.Contains("default server"))
                    {
                        var match = Regex.Match(line, @"(?:port \d+ namevhost|default server)\s+([^\s]+)");
                        if (match.Success)
                        {
                            activeVhosts.Add(match.Groups[1].Value.Trim());
                        }
                    }
                }

                // Tüm mevcut site konfigürasyonlarını oku
                var configs = await _sshService.ExecuteCommandAsync("ls -1 /etc/apache2/sites-available/");
                foreach (var config in configs.Split('\n', StringSplitOptions.RemoveEmptyEntries))
                {
                    if (config == "default-ssl.conf") continue;

                    var configContent = await _sshService.ExecuteCommandAsync($"cat /etc/apache2/sites-available/{config}");
                    var virtualHostBlocks = Regex.Matches(configContent, @"<VirtualHost\s*\*:(\d+)>(.*?)</VirtualHost>", RegexOptions.Singleline);

                    foreach (Match block in virtualHostBlocks)
                    {
                        var port = block.Groups[1].Value;
                        var content = block.Groups[2].Value;

                        var serverNameMatch = Regex.Match(content, @"ServerName\s+([^\s]+)");
                        if (!serverNameMatch.Success) continue;

                        var serverName = serverNameMatch.Groups[1].Value.Trim();
                        var documentRootMatch = Regex.Match(content, @"DocumentRoot\s+([^\s]+)");
                        var documentRoot = documentRootMatch.Success ? documentRootMatch.Groups[1].Value.Trim() : "Servise Yönlendirilmiş";

                        var hasSSL = content.Contains("SSLEngine on") || content.Contains("SSLCertificateFile");

                        var vhost = new VirtualHost
                        {
                            ServerName = serverName,
                            DocumentRoot = documentRoot,
                            Port = port,
                            SSL = hasSSL,
                            IsActive = activeVhosts.Contains(serverName)
                        };

                        _logger.LogInformation("Found VirtualHost: {ServerName} Port: {Port} SSL: {SSL} Active: {IsActive}",
                            vhost.ServerName, vhost.Port, vhost.SSL, vhost.IsActive);

                        vhosts.Add(vhost);
                    }
                }

                return vhosts.DistinctBy(v => new { v.ServerName, v.Port }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Virtual host'lar alınırken hata oluştu");
                return new List<VirtualHost>();
            }
        }

        public async Task<string> GetErrorLogAsync(int lines = 100)
        {
            try
            {
                return await _sshService.ExecuteCommandAsync($"tail -n {lines} /var/log/apache2/error.log");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Hata günlüğü alınırken hata oluştu");
                return string.Empty;
            }
        }

        private string ParseStatus(string statusOutput)
        {
            var match = Regex.Match(statusOutput, @"Active:\s*(.*?)\s*since");
            return match.Success ? match.Groups[1].Value.Trim() : "Unknown";
        }

        private string ParsePorts(string portsOutput)
        {
            var ports = Regex.Matches(portsOutput, @":(\d+)")
                .Select(m => m.Groups[1].Value)
                .Distinct();
            return string.Join(", ", ports);
        }

        public async Task<bool> TestConfigAsync()
        {
            try
            {
                // 2>&1 ile stderr'i stdout'a yönlendiriyoruz
                var result = await _sshService.ExecuteCommandAsync("apache2ctl configtest 2>&1");
                _logger.LogInformation("Config test result: {Result}", result);
                return result.Contains("Syntax OK");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Yapılandırma testi sırasında hata oluştu");
                return false;
            }
        }

        public async Task<bool> AddSiteConfigAsync(string siteName, string configContent)
        {
            try
            {
                // Güvenlik kontrolü
                if (string.IsNullOrWhiteSpace(siteName) || !Regex.IsMatch(siteName, @"^[a-zA-Z0-9\-_.]+$"))
                {
                    throw new ArgumentException("Geçersiz site adı");
                }

                var configPath = $"/etc/apache2/sites-available/{siteName}.conf";

                // Config dosyasını oluştur
                var createFileCmd = $"echo '{configContent}' > {configPath}";
                await _sshService.ExecuteCommandAsync(createFileCmd);

                // Dosya oluşturuldu mu kontrol et
                var checkFile = await _sshService.ExecuteCommandAsync($"test -f {configPath} && echo 'true' || echo 'false'");
                return checkFile.Trim() == "true";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Site yapılandırması eklenirken hata oluştu: {SiteName}", siteName);
                return false;
            }
        }

        public async Task<bool> DeleteSiteConfigAsync(string siteName)
        {
            try
            {
                // Önce siteyi devre dışı bırak
                await DisableSiteAsync(siteName);

                // Dosyayı sil
                var configPath = $"/etc/apache2/sites-available/{siteName}.conf";
                await _sshService.ExecuteCommandAsync($"rm -f {configPath}");

                // Dosya silindi mi kontrol et
                var checkFile = await _sshService.ExecuteCommandAsync($"test -f {configPath} && echo 'false' || echo 'true'");
                return checkFile.Trim() == "true";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Site yapılandırması silinirken hata oluştu: {SiteName}", siteName);
                return false;
            }
        }

        public async Task<bool> EnableSiteAsync(string siteName)
        {
            try
            {
                await _sshService.ExecuteCommandAsync($"a2ensite {siteName}");
                await _sshService.ExecuteCommandAsync("systemctl reload apache2");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Site etkinleştirilirken hata oluştu: {SiteName}", siteName);
                return false;
            }
        }

        public async Task<bool> DisableSiteAsync(string siteName)
        {
            try
            {
                await _sshService.ExecuteCommandAsync($"a2dissite {siteName}");
                await _sshService.ExecuteCommandAsync("systemctl reload apache2");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Site devre dışı bırakılırken hata oluştu: {SiteName}", siteName);
                return false;
            }
        }

        public async Task<string> GetSiteConfigAsync(string siteName)
        {
            try
            {
                var configPath = $"/etc/apache2/sites-available/{siteName}.conf";
                return await _sshService.ExecuteCommandAsync($"cat {configPath}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Site yapılandırması okunurken hata oluştu: {SiteName}", siteName);
                return string.Empty;
            }
        }

        public async Task<List<string>> GetAvailableSitesAsync()
        {
            try
            {
                var result = await _sshService.ExecuteCommandAsync("ls -1 /etc/apache2/sites-available/ | sed 's/.conf$//'");
                return result.Split('\n', StringSplitOptions.RemoveEmptyEntries).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kullanılabilir siteler listelenirken hata oluştu");
                return new List<string>();
            }
        }
    }
}