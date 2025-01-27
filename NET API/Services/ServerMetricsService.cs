using System.Text.RegularExpressions;
using web_panel_app.Models;

namespace web_panel_app.Services
{
    public class ServerMetricsService : IServerMetricsService
    {
        private readonly ISshService _sshService;
        private readonly ILogger<ServerMetricsService> _logger;

        public ServerMetricsService(ISshService sshService, ILogger<ServerMetricsService> logger)
        {
            _sshService = sshService;
            _logger = logger;
        }

        public async Task<ServerMetrics> GetMetricsAsync()
        {
            return new ServerMetrics
            {
                Cpu = await GetCpuMetricsAsync(),
                Memory = await GetMemoryMetricsAsync(),
                Network = await GetNetworkMetricsAsync(),
                Disks = await GetDiskMetricsAsync()
            };
        }

        public async Task<CpuMetrics> GetCpuMetricsAsync()
        {
            try
            {
                var model = await _sshService.ExecuteCommandAsync("lscpu | grep 'Model name' | cut -d ':' -f2 | xargs");
                var cores = int.Parse(await _sshService.ExecuteCommandAsync("nproc"));
                var threads = int.Parse(await _sshService.ExecuteCommandAsync("lscpu | grep 'CPU(s):' | head -1 | cut -d ':' -f2 | xargs"));
                var freq = await _sshService.ExecuteCommandAsync("lscpu | grep 'CPU MHz' | cut -d ':' -f2 | xargs");
                var usage = await GetCpuUsageAsync();
                var temp = await GetCpuTemperatureAsync();

                return new CpuMetrics
                {
                    Model = model,
                    Cores = cores,
                    Threads = threads,
                    Frequency = $"{freq} MHz",
                    Usage = usage,
                    Temperature = temp
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CPU metrikleri alınırken hata oluştu");
                throw;
            }
        }

        public async Task<MemoryMetrics> GetMemoryMetricsAsync()
        {
            try
            {
                var memInfo = await _sshService.ExecuteCommandAsync("free -b");
                var lines = memInfo.Split('\n');
                var memLine = lines[1].Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);

                var total = long.Parse(memLine[1]);
                var used = long.Parse(memLine[2]);
                var free = long.Parse(memLine[3]);

                // RAM tipi ve hızı için dmidecode kullanılır (root yetkisi gerekir)
                var memType = await _sshService.ExecuteCommandAsync("sudo dmidecode -t memory | grep -m 1 'Type:' | cut -d ':' -f2 | xargs");
                var memSpeed = await _sshService.ExecuteCommandAsync("sudo dmidecode -t memory | grep -m 1 'Speed:' | cut -d ':' -f2 | xargs");

                return new MemoryMetrics
                {
                    Total = FormatBytes(total),
                    Used = FormatBytes(used),
                    Free = FormatBytes(free),
                    Type = memType,
                    Speed = memSpeed,
                    UsagePercentage = (double)used / total * 100
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Bellek metrikleri alınırken hata oluştu");
                throw;
            }
        }

        public class NetworkSpeed
        {
            public string Current { get; set; } = "0 B/s";  // Toplam hız
            public string Download { get; set; } = "0 B/s";  // İndirme hızı
            public string Upload { get; set; } = "0 B/s";   // Yükleme hızı
        }

        public async Task<NetworkMetrics> GetNetworkMetricsAsync()
        {
            try
            {
                var interfaces = new List<NetworkInterface>();
                var netInfo = await _sshService.ExecuteCommandAsync("ip -s link");
                var lines = netInfo.Split('\n');

                for (int i = 0; i < lines.Length; i++)
                {
                    if (lines[i].Contains(": "))
                    {
                        var nameParts = lines[i].Split(": ");
                        if (nameParts.Length < 2) continue;

                        var name = nameParts[1].Trim();
                        if (name == "lo") continue; // loopback interface'i atla

                        var ipAddress = await GetInterfaceIpAddress(name);

                        // RX ve TX bilgileri için sonraki satırları kontrol et
                        if (i + 3 < lines.Length && i + 5 < lines.Length) // Dizin sınırlarını kontrol et
                        {
                            var rxLine = lines[i + 3].Trim();
                            var txLine = lines[i + 5].Trim();

                            if (!string.IsNullOrWhiteSpace(rxLine) && !string.IsNullOrWhiteSpace(txLine))
                            {
                                var rxStats = rxLine.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                                var txStats = txLine.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);

                                if (rxStats.Length > 0 && txStats.Length > 0)
                                {
                                    // IP adresi geçerli ise ekle
                                    if (!string.IsNullOrWhiteSpace(ipAddress) && IsValidIpAddress(ipAddress))
                                    {
                                        interfaces.Add(new NetworkInterface
                                        {
                                            Name = name,
                                            IpAddress = ipAddress,
                                            ReceivedBytes = FormatBytes(SafeParseBytes(rxStats[0])),
                                            TransmittedBytes = FormatBytes(SafeParseBytes(txStats[0]))
                                        });
                                    }
                                }
                            }
                        }
                    }
                }

                // Toplam bant genişliği hesaplama
                var totalRx = await _sshService.ExecuteCommandAsync("cat /sys/class/net/[^lo]*/statistics/rx_bytes 2>/dev/null | awk '{sum+=$1} END {print sum}'");
                var totalTx = await _sshService.ExecuteCommandAsync("cat /sys/class/net/[^lo]*/statistics/tx_bytes 2>/dev/null | awk '{sum+=$1} END {print sum}'");

                // Anlık network hızı için nethogs kullanıyoruz
                var speeds = await GetNetworkSpeedsAsync();

                return new NetworkMetrics
                {
                    Interfaces = interfaces,
                    CurrentSpeed = speeds.Current,
                    DownloadSpeed = speeds.Download,
                    UploadSpeed = speeds.Upload,
                    TotalReceived = FormatBytes(SafeParseBytes(totalRx)),
                    TotalTransmitted = FormatBytes(SafeParseBytes(totalTx))
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Network metrikleri alınırken hata oluştu");
                throw;
            }
        }

        private bool IsValidIpAddress(string ipAddress)
        {
            // IPv4 ve IPv6 için regex pattern
            var ipv4Pattern = @"^(\d{1,3}\.){3}\d{1,3}$";
            var ipv6Pattern = @"^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$";

            if (Regex.IsMatch(ipAddress, ipv4Pattern))
            {
                // IPv4 için sayısal kontrol
                var parts = ipAddress.Split('.');
                return parts.All(p => byte.TryParse(p, out _));
            }

            return Regex.IsMatch(ipAddress, ipv6Pattern);
        }

        private async Task<string> GetInterfaceIpAddress(string interfaceName)
        {
            try
            {
                var ipInfo = await _sshService.ExecuteCommandAsync($"ip addr show {interfaceName} | grep 'inet ' | awk '{{print $2}}' | cut -d/ -f1");

                if (string.IsNullOrWhiteSpace(ipInfo))
                    return "N/A";

                ipInfo = ipInfo.Trim();
                return IsValidIpAddress(ipInfo) ? ipInfo : "N/A";
            }
            catch
            {
                return "N/A";
            }
        }

        private long SafeParseBytes(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return 0;

            return long.TryParse(input.Trim(), out long result) ? result : 0;
        }

        public async Task<List<DiskMetrics>> GetDiskMetricsAsync()
        {
            try
            {
                var disks = new List<DiskMetrics>();
                var dfOutput = await _sshService.ExecuteCommandAsync("df -B1");
                var lines = dfOutput.Split('\n').Skip(1); // Header'ı atla

                foreach (var line in lines)
                {
                    var parts = line.Split(new[] { ' ' }, StringSplitOptions.RemoveEmptyEntries);
                    if (parts.Length < 6) continue;

                    var total = long.Parse(parts[1]);
                    var used = long.Parse(parts[2]);
                    var free = long.Parse(parts[3]);

                    disks.Add(new DiskMetrics
                    {
                        Device = parts[0],
                        MountPoint = parts[5],
                        Total = FormatBytes(total),
                        Used = FormatBytes(used),
                        Free = FormatBytes(free),
                        UsagePercentage = (double)used / total * 100
                    });
                }

                return disks;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Disk metrikleri alınırken hata oluştu");
                throw;
            }
        }

        private async Task<double> GetCpuUsageAsync()
        {
            var usage = await _sshService.ExecuteCommandAsync("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'");
            return double.Parse(usage.Replace(",", "."));
        }

        private async Task<double> GetCpuTemperatureAsync()
        {
            try
            {
                var temp = await _sshService.ExecuteCommandAsync("sensors | grep 'Core 0' | awk '{print $3}' | cut -c2-5");
                return double.Parse(temp.Replace(",", "."));
            }
            catch
            {
                return 0; // Sensör bilgisi alınamazsa
            }
        }

        private string FormatBytes(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            int order = 0;
            double size = bytes;

            while (size >= 1024 && order < sizes.Length - 1)
            {
                order++;
                size = size / 1024;
            }

            return $"{size:0.##} {sizes[order]}";
        }

        private long ParseBytes(string formattedSize)
        {
            var match = Regex.Match(formattedSize, @"([\d.]+)\s*([KMGT]?B)");
            if (!match.Success) return 0;

            var size = double.Parse(match.Groups[1].Value);
            var unit = match.Groups[2].Value;

            return unit switch
            {
                "KB" => (long)(size * 1024),
                "MB" => (long)(size * 1024 * 1024),
                "GB" => (long)(size * 1024 * 1024 * 1024),
                "TB" => (long)(size * 1024 * 1024 * 1024 * 1024),
                _ => (long)size
            };
        }

        private async Task<NetworkSpeed> GetNetworkSpeedsAsync()
        {
            try
            {
                // İlk ölçüm
                var rx1 = await _sshService.ExecuteCommandAsync("cat /sys/class/net/[^lo]*/statistics/rx_bytes 2>/dev/null | awk '{sum+=$1} END {print sum}'");
                var tx1 = await _sshService.ExecuteCommandAsync("cat /sys/class/net/[^lo]*/statistics/tx_bytes 2>/dev/null | awk '{sum+=$1} END {print sum}'");

                // 1 saniye bekle
                await Task.Delay(1000);

                // İkinci ölçüm
                var rx2 = await _sshService.ExecuteCommandAsync("cat /sys/class/net/[^lo]*/statistics/rx_bytes 2>/dev/null | awk '{sum+=$1} END {print sum}'");
                var tx2 = await _sshService.ExecuteCommandAsync("cat /sys/class/net/[^lo]*/statistics/tx_bytes 2>/dev/null | awk '{sum+=$1} END {print sum}'");

                // Hız hesaplama (byte/saniye)
                var rxSpeed = SafeParseBytes(rx2) - SafeParseBytes(rx1);
                var txSpeed = SafeParseBytes(tx2) - SafeParseBytes(tx1);
                var totalSpeed = rxSpeed + txSpeed;

                return new NetworkSpeed
                {
                    Current = $"{FormatBytes(totalSpeed)}/s",
                    Download = $"{FormatBytes(rxSpeed)}/s",
                    Upload = $"{FormatBytes(txSpeed)}/s"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Network hızı alınırken hata oluştu");
                return new NetworkSpeed();
            }
        }
    }
}