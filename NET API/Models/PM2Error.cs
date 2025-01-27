namespace web_panel_app.Models
{
    public class PM2Error
    {
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;
        public string Command { get; set; } = string.Empty;
        public string Output { get; set; } = string.Empty;
    }
}