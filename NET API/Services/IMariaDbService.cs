using web_panel_app.Models;

public interface IMariaDbService
{
    Task<List<Database>> GetDatabasesAsync();
    Task<bool> CreateDatabaseAsync(string name, string charset = "utf8mb4", string collation = "utf8mb4_general_ci");
    Task<bool> DeleteDatabaseAsync(string name);
    Task<List<string>> GetTablesAsync(string database);
    Task<List<DatabaseUser>> GetUsersAsync();
    Task<List<DatabaseUser>> GetDatabaseUsersAsync(string database);
    Task<bool> CreateUserAsync(CreateUserRequest request);
    Task<bool> DeleteUserAsync(string username, string host = "localhost");
    Task<bool> GrantPrivilegesAsync(string username, string database, List<string> privileges, string host = "localhost");
    Task<bool> RevokePrivilegesAsync(string username, string database, string host = "localhost");
}