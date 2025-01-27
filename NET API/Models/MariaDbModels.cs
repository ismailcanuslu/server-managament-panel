using System.Text.Json.Serialization;

namespace web_panel_app.Models
{
    public class Database
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("tables")]
        public int TableCount { get; set; }

        [JsonPropertyName("size")]
        public string Size { get; set; } = string.Empty;
    }

    public class DatabaseUser
    {
        [JsonPropertyName("username")]
        public string Username { get; set; } = string.Empty;

        [JsonPropertyName("host")]
        public string Host { get; set; } = string.Empty;

        [JsonPropertyName("globalPrivileges")]
        public List<string> GlobalPrivileges { get; set; } = new();

        [JsonPropertyName("databasePrivileges")]
        public Dictionary<string, List<string>> DatabasePrivileges { get; set; } = new();
    }

    public class CreateDatabaseRequest
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("charset")]
        public string Charset { get; set; } = "utf8mb4";

        [JsonPropertyName("collation")]
        public string Collation { get; set; } = "utf8mb4_general_ci";
    }

    public class CreateUserRequest
    {
        [JsonPropertyName("username")]
        public string Username { get; set; } = string.Empty;

        [JsonPropertyName("password")]
        public string Password { get; set; } = string.Empty;

        [JsonPropertyName("host")]
        public string Host { get; set; } = "localhost";

        [JsonPropertyName("privileges")]
        public List<string> Privileges { get; set; } = new();

        [JsonPropertyName("database")]
        public string Database { get; set; } = string.Empty;
    }

    public class GrantPrivilegesRequest
    {
        [JsonPropertyName("database")]
        public string Database { get; set; } = string.Empty;

        [JsonPropertyName("privileges")]
        public List<string> Privileges { get; set; } = new();

        [JsonPropertyName("host")]
        public string Host { get; set; } = "localhost";
    }

    public class RevokePrivilegesRequest
    {
        [JsonPropertyName("database")]
        public string Database { get; set; } = string.Empty;

        [JsonPropertyName("host")]
        public string Host { get; set; } = "localhost";
    }
}