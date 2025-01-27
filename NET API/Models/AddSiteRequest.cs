using System.Text.Json.Serialization;

public class AddSiteRequest
{
    [JsonPropertyName("siteName")]
    public string SiteName { get; set; } = string.Empty;

    [JsonPropertyName("configContent")]
    public string ConfigContent { get; set; } = string.Empty;
}