namespace web_panel_app.Models
{
    public class FileUploadOptions
    {
        public long MaxFileSize { get; set; } = 1073741824; // 1GB default
        public string[] AllowedExtensions { get; set; } = new[] { "*" };
    }
}