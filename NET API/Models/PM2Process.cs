using System.Text.Json.Serialization;

namespace web_panel_app.Models
{
    public class PM2Process
    {
        [JsonPropertyName("pm_id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("pm2_env")]
        public PM2Environment? Environment { get; set; }

        [JsonPropertyName("monit")]
        public PM2Monitoring? Monitoring { get; set; }
    }

    public class PM2Environment
    {
        [JsonPropertyName("namespace")]
        public string Namespace { get; set; } = string.Empty;

        [JsonPropertyName("version")]
        public string Version { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = string.Empty;

        [JsonPropertyName("pm_uptime")]
        public long Uptime { get; set; }

        [JsonPropertyName("username")]
        public string Username { get; set; } = string.Empty;
    }

    public class PM2Monitoring
    {
        [JsonPropertyName("memory")]
        public long Memory { get; set; }

        [JsonPropertyName("cpu")]
        public double Cpu { get; set; }
    }
}