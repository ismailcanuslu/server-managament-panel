using System.Text.Json.Serialization;

namespace web_panel_app.Models
{
    public class PM2Operation
    {
        [JsonPropertyName("command")]
        public string Command { get; set; } = string.Empty;

        [JsonPropertyName("appName")]
        public string AppName { get; set; } = string.Empty;
    }

    public class PM2Logs
    {
        [JsonPropertyName("appName")]
        public string AppName { get; set; } = string.Empty;

        [JsonPropertyName("logs")]
        public List<string> Logs { get; set; } = new();
    }
}