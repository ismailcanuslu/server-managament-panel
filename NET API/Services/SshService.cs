using System.Text.Json;
using System.Text.Json.Serialization;
using Renci.SshNet;
using web_panel_app.Models;

namespace web_panel_app.Services
{
    public class SshService : ISshService, IDisposable
    {
        private readonly SshConnectionManager _connectionManager;
        private readonly ILogger<SshService> _logger;
        private bool _disposed;

        public SshService(SshConnectionManager connectionManager, ILogger<SshService> logger)
        {
            _connectionManager = connectionManager;
            _logger = logger;
        }

        public async Task<string> ExecuteCommandAsync(string command)
        {
            try
            {
                var sshClient = _connectionManager.GetConnection();
                if (!sshClient.IsConnected)
                {
                    _logger.LogWarning("SSH bağlantısı kopmuş, yeniden bağlanmayı deniyorum...");
                    _connectionManager.ReconnectDefault();
                    sshClient = _connectionManager.GetConnection();
                }

                using var cmd = sshClient.CreateCommand(command);
                var result = await Task.Run(() => cmd.Execute());

                // Hem standart çıktıyı hem de hata çıktısını al
                var output = result;
                var error = cmd.Error;

                // İkisini birleştir
                var fullOutput = string.Join("\n", new[] { output, error }
                    .Where(s => !string.IsNullOrWhiteSpace(s)));

                return fullOutput;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "SSH komutu yürütülürken hata oluştu: {Command}", command);
                throw;
            }
        }

        public async Task<List<PM2Process>> GetPM2ProcessesAsync()
        {
            try
            {
                var result = await ExecuteCommandAsync("pm2 jlist");

                // Debug seviyesine düşürelim
                _logger.LogDebug("Raw PM2 Output: {Result}", result);

                result = result.Trim();

                if (string.IsNullOrEmpty(result))
                {
                    _logger.LogDebug("PM2 boş çıktı döndü");
                    return new List<PM2Process>();
                }

                try
                {
                    var processes = JsonSerializer.Deserialize<List<PM2Process>>(result, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        NumberHandling = JsonNumberHandling.AllowReadingFromString
                    });

                    _logger.LogDebug("Başarıyla deserialize edildi. Process sayısı: {Count}", processes?.Count ?? 0);
                    return processes ?? new List<PM2Process>();
                }
                catch (JsonException jsonEx)
                {
                    _logger.LogError(jsonEx, "JSON parse hatası");

                    // Alternatif komut deneyelim
                    result = await ExecuteCommandAsync("pm2 prettylist");
                    _logger.LogDebug("Alternative PM2 Output: {Result}", result);

                    return JsonSerializer.Deserialize<List<PM2Process>>(result, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        NumberHandling = JsonNumberHandling.AllowReadingFromString
                    }) ?? new List<PM2Process>();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PM2 process listesi alınırken hata oluştu");
                throw;
            }
        }

        public async Task<bool> StartPM2ProcessAsync(string processName)
        {
            try
            {
                await ExecuteCommandAsync($"pm2 start {processName}");
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> StopPM2ProcessAsync(string processName)
        {
            try
            {
                await ExecuteCommandAsync($"pm2 stop {processName}");
                return true;
            }
            catch
            {
                return false;
            }
        }

        public async Task<bool> RestartPM2ProcessAsync(string processName)
        {
            try
            {
                await ExecuteCommandAsync($"pm2 restart {processName}");
                return true;
            }
            catch
            {
                return false;
            }
        }

        private List<PM2Process> ParsePM2Output(string json)
        {
            try
            {
                _logger.LogDebug("Parsing PM2 Output: {Json}", json);

                return JsonSerializer.Deserialize<List<PM2Process>>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    NumberHandling = JsonNumberHandling.AllowReadingFromString
                }) ?? new List<PM2Process>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PM2 çıktısı parse edilirken hata oluştu");
                return new List<PM2Process>();
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                _disposed = true;
            }
        }
    }
}