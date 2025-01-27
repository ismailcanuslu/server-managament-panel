using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using web_panel_app.Models;
using web_panel_app.Services;

namespace web_panel_app.Services
{
    public class PM2Service : IPM2Service
    {
        private readonly ISshService _sshService;
        private readonly ILogger<PM2Service> _logger;

        public PM2Service(ISshService sshService, ILogger<PM2Service> logger)
        {
            _sshService = sshService;
            _logger = logger;
        }

        public async Task<(bool Success, PM2Error? Error)> ExecutePM2CommandAsync(string command)
        {
            try
            {
                var result = await _sshService.ExecuteCommandAsync(command);

                // Çıktıyı debug için logla
                _logger.LogDebug("PM2 Command Output: {Result}", result);

                // Hata durumlarını kontrol et
                if (result.ToLower().Contains("error") ||
                    result.Contains("[PM2][ERROR]") ||
                    result.Contains("not found") ||
                    result.Contains("unknown option"))
                {
                    string errorMessage;
                    int statusCode = 400;

                    // Spesifik hata durumlarını kontrol et
                    if (result.Contains("unknown option"))
                    {
                        errorMessage = $"Geçersiz PM2 parametresi kullanıldı: {result.Trim()}";
                    }
                    else if (result.Contains("Script not found"))
                    {
                        statusCode = 404;
                        errorMessage = $"Script dosyası bulunamadı: {result.Trim()}";
                    }
                    else if (result.Contains("[PM2][ERROR]"))
                    {
                        errorMessage = $"PM2 hatası: {result.Trim()}";
                    }
                    else if (result.Contains("ENOENT"))
                    {
                        statusCode = 404;
                        errorMessage = $"Dosya veya dizin bulunamadı: {result.Trim()}";
                    }
                    else
                    {
                        errorMessage = $"PM2 komutu başarısız oldu: {result.Trim()}";
                    }

                    return (false, new PM2Error
                    {
                        StatusCode = statusCode,
                        Message = errorMessage,
                        Command = command,
                        Output = result.Trim()
                    });
                }

                // Başarılı durumda
                return (true, new PM2Error
                {
                    StatusCode = 200,
                    Message = "Komut başarıyla çalıştırıldı",
                    Command = command,
                    Output = result.Trim()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PM2 komutu çalıştırılırken hata oluştu: {Command}", command);
                return (false, new PM2Error
                {
                    StatusCode = 500,
                    Message = $"PM2 komutu çalıştırılırken bir hata oluştu: {ex.Message}",
                    Command = command,
                    Output = ex.ToString()
                });
            }
        }

        public async Task<PM2Logs> GetApplicationLogsAsync(string appName)
        {
            try
            {
                // Son 100 log satırını al
                var logs = await _sshService.ExecuteCommandAsync($"pm2 logs {appName} --lines 100 --nostream");

                return new PM2Logs
                {
                    AppName = appName,
                    Logs = logs.Split('\n')
                              .Where(line => !string.IsNullOrWhiteSpace(line))
                              .ToList()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "PM2 logları alınırken hata oluştu: {AppName}", appName);
                return new PM2Logs { AppName = appName };
            }
        }

        public async Task<List<PM2Process>> GetProcessesAsync()
        {
            return await _sshService.GetPM2ProcessesAsync();
        }

        public async Task<bool> StartProcessAsync(string processName)
        {
            return await _sshService.StartPM2ProcessAsync(processName);
        }

        public async Task<bool> StopProcessAsync(string processName)
        {
            return await _sshService.StopPM2ProcessAsync(processName);
        }
    }
}