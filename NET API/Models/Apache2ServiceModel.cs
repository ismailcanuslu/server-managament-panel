using System.Text.Json.Serialization;

namespace web_panel_app.Models
{
    public class Apache2ServiceModel
    {
        public string Name { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public string Ports { get; set; } = string.Empty;
        public string ConfigPath { get; set; } = string.Empty;
        public List<VirtualHost> VirtualHosts { get; set; } = new();
    }

    public class VirtualHost
    {
        [JsonPropertyName("serverName")]
        public string ServerName { get; set; } = string.Empty;

        [JsonPropertyName("documentRoot")]
        public string DocumentRoot { get; set; } = string.Empty;

        [JsonPropertyName("port")]
        public string Port { get; set; } = string.Empty;

        [JsonPropertyName("ssl")]
        public bool SSL { get; set; }

        [JsonPropertyName("isActive")]
        public bool IsActive { get; set; }
    }
}