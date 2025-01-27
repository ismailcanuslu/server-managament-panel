using System.Text.Json.Serialization;

namespace web_panel_app.Models
{
    public class SystemInfo
    {
        [JsonPropertyName("osInfo")]
        public OsInfo OperatingSystem { get; set; } = new();

        [JsonPropertyName("services")]
        public ServiceCounts Services { get; set; } = new();
    }

    public class OsInfo
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty; // Ubuntu 22.04 LTS

        [JsonPropertyName("kernel")]
        public string Kernel { get; set; } = string.Empty; // Linux 5.15.0-91-generic

        [JsonPropertyName("architecture")]
        public string Architecture { get; set; } = string.Empty; // x86_64

        [JsonPropertyName("uptime")]
        public string Uptime { get; set; } = string.Empty; // 5 days, 3 hours
    }

    public class ServiceCounts
    {
        [JsonPropertyName("apache2Sites")]
        public int Apache2Sites { get; set; }

        [JsonPropertyName("pm2Services")]
        public int Pm2Services { get; set; }

        [JsonPropertyName("mariadbDatabases")]
        public int MariaDbDatabases { get; set; }
    }
}