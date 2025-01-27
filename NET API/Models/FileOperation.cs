using System.Text.Json.Serialization;

namespace web_panel_app.Models
{
    public class FileOperation
    {
        [JsonPropertyName("sourcePaths")]
        public List<string> SourcePaths { get; set; } = new();

        [JsonPropertyName("destinationPath")]
        public string DestinationPath { get; set; } = string.Empty;

        [JsonPropertyName("operation")]
        public string Operation { get; set; } = string.Empty; // cut, copy, delete
    }

    public class CompressRequest
    {
        [JsonPropertyName("files")]
        public List<string> Files { get; set; } = new();

        [JsonPropertyName("format")]
        public string Format { get; set; } = "zip"; // zip, targz, tarbz2

        [JsonPropertyName("targetPath")]
        public string TargetPath { get; set; } = string.Empty;
    }

    public class ExtractOperation
    {
        [JsonPropertyName("archivePath")]
        public string ArchivePath { get; set; } = string.Empty;

        [JsonPropertyName("destinationPath")]
        public string DestinationPath { get; set; } = string.Empty;

        [JsonPropertyName("overwriteExisting")]
        public bool OverwriteExisting { get; set; } = false;

        [JsonPropertyName("keepBoth")]
        public bool KeepBoth { get; set; } = false;
    }
}