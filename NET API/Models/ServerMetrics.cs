using System.Text.Json.Serialization;

namespace web_panel_app.Models
{
    public class ServerMetrics
    {
        [JsonPropertyName("cpu")]
        public CpuMetrics Cpu { get; set; } = new();

        [JsonPropertyName("memory")]
        public MemoryMetrics Memory { get; set; } = new();

        [JsonPropertyName("network")]
        public NetworkMetrics Network { get; set; } = new();

        [JsonPropertyName("disk")]
        public List<DiskMetrics> Disks { get; set; } = new();
    }

    public class CpuMetrics
    {
        [JsonPropertyName("model")]
        public string Model { get; set; } = string.Empty;

        [JsonPropertyName("cores")]
        public int Cores { get; set; }

        [JsonPropertyName("threads")]
        public int Threads { get; set; }

        [JsonPropertyName("frequency")]
        public string Frequency { get; set; } = string.Empty;

        [JsonPropertyName("usage")]
        public double Usage { get; set; }

        [JsonPropertyName("temperature")]
        public double Temperature { get; set; }
    }

    public class MemoryMetrics
    {
        [JsonPropertyName("total")]
        public string Total { get; set; } = string.Empty;

        [JsonPropertyName("used")]
        public string Used { get; set; } = string.Empty;

        [JsonPropertyName("free")]
        public string Free { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty; // DDR4, DDR3 etc.

        [JsonPropertyName("speed")]
        public string Speed { get; set; } = string.Empty; // 2666MHz etc.

        [JsonPropertyName("usagePercentage")]
        public double UsagePercentage { get; set; }
    }

    public class NetworkMetrics
    {
        [JsonPropertyName("interfaces")]
        public List<NetworkInterface> Interfaces { get; set; } = new();

        [JsonPropertyName("currentSpeed")]
        public string CurrentSpeed { get; set; } = "0 B/s";

        [JsonPropertyName("downloadSpeed")]
        public string DownloadSpeed { get; set; } = "0 B/s";

        [JsonPropertyName("uploadSpeed")]
        public string UploadSpeed { get; set; } = "0 B/s";

        [JsonPropertyName("totalReceived")]
        public string TotalReceived { get; set; } = string.Empty;

        [JsonPropertyName("totalTransmitted")]
        public string TotalTransmitted { get; set; } = string.Empty;
    }

    public class NetworkInterface
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("ipAddress")]
        public string IpAddress { get; set; } = string.Empty;

        [JsonPropertyName("rxBytes")]
        public string ReceivedBytes { get; set; } = string.Empty;

        [JsonPropertyName("txBytes")]
        public string TransmittedBytes { get; set; } = string.Empty;
    }

    public class DiskMetrics
    {
        [JsonPropertyName("device")]
        public string Device { get; set; } = string.Empty;

        [JsonPropertyName("mountPoint")]
        public string MountPoint { get; set; } = string.Empty;

        [JsonPropertyName("total")]
        public string Total { get; set; } = string.Empty;

        [JsonPropertyName("used")]
        public string Used { get; set; } = string.Empty;

        [JsonPropertyName("free")]
        public string Free { get; set; } = string.Empty;

        [JsonPropertyName("usagePercentage")]
        public double UsagePercentage { get; set; }
    }
}