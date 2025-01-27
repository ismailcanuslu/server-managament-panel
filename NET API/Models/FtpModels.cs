using System.Text.Json.Serialization;

namespace web_panel_app.Models
{
    public class FtpFile
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("path")]
        public string Path { get; set; } = string.Empty;

        [JsonPropertyName("size")]
        public string Size { get; set; } = string.Empty;

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty; // file veya directory

        [JsonPropertyName("modified")]
        public DateTime Modified { get; set; }

        [JsonPropertyName("permissions")]
        public string Permissions { get; set; } = string.Empty;
    }

    public class UploadFileRequest
    {
        [JsonPropertyName("path")]
        public string Path { get; set; } = string.Empty;

        [JsonPropertyName("file")]
        public IFormFile File { get; set; } = null!;
    }
}