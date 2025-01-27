using Microsoft.Extensions.Logging;
using web_panel_app.Models;
using web_panel_app.Services;

namespace web_panel_app.Services
{
    public class MariaDbService : IMariaDbService
    {
        private readonly ISshService _sshService;
        private readonly ILogger<MariaDbService> _logger;

        public MariaDbService(ISshService sshService, ILogger<MariaDbService> logger)
        {
            _sshService = sshService;
            _logger = logger;
        }

        public async Task<List<Database>> GetDatabasesAsync()
        {
            try
            {
                // Önce tüm veritabanlarını alalım
                var dbListResult = await _sshService.ExecuteCommandAsync(
                    "mysql -N -e 'SHOW DATABASES;'"
                );

                var databases = new List<Database>();
                var dbNames = dbListResult.Split('\n', StringSplitOptions.RemoveEmptyEntries);

                // Sonra her veritabanı için tablo sayısı ve boyut bilgisini alalım
                foreach (var dbName in dbNames)
                {
                    var statsResult = await _sshService.ExecuteCommandAsync(
                        $"mysql -N -e 'SELECT COUNT(table_name), COALESCE(SUM(data_length + index_length), 0) " +
                        $"FROM information_schema.tables WHERE table_schema = \"{dbName}\";'"
                    );

                    var parts = statsResult.Split('\t');
                    var tableCount = parts.Length >= 1 && !string.IsNullOrEmpty(parts[0]) ? int.Parse(parts[0]) : 0;
                    var size = parts.Length >= 2 && !string.IsNullOrEmpty(parts[1]) ? long.Parse(parts[1]) : 0;

                    databases.Add(new Database
                    {
                        Name = dbName,
                        TableCount = tableCount,
                        Size = FormatSize(size)
                    });
                }

                return databases;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Veritabanları listelenirken hata oluştu");
                return new List<Database>();
            }
        }

        public async Task<bool> CreateDatabaseAsync(string name, string charset = "utf8mb4", string collation = "utf8mb4_general_ci")
        {
            try
            {
                // Önce veritabanının var olup olmadığını kontrol edelim
                var checkResult = await _sshService.ExecuteCommandAsync(
                    $"mysql -N -e 'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = \"{name}\";'"
                );

                if (!string.IsNullOrEmpty(checkResult))
                {
                    _logger.LogWarning("Veritabanı zaten mevcut: {Name}", name);
                    return false;
                }

                // Veritabanını oluştur
                var result = await _sshService.ExecuteCommandAsync(
                    $"mysql -e 'CREATE DATABASE IF NOT EXISTS `{name}` CHARACTER SET {charset} COLLATE {collation};'"
                );

                // Hata mesajını logla
                if (!string.IsNullOrEmpty(result))
                {
                    _logger.LogError("Veritabanı oluşturulurken hata: {Error}", result);
                    return false;
                }

                // Oluşturulduğunu kontrol et
                var verifyResult = await _sshService.ExecuteCommandAsync(
                    $"mysql -N -e 'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = \"{name}\";'"
                );

                var success = !string.IsNullOrEmpty(verifyResult);
                if (success)
                {
                    _logger.LogInformation("Veritabanı başarıyla oluşturuldu: {Name}", name);
                }
                else
                {
                    _logger.LogError("Veritabanı oluşturuldu ama doğrulanamadı: {Name}", name);
                }

                return success;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Veritabanı oluşturulurken hata oluştu: {Name}", name);
                return false;
            }
        }

        public async Task<List<DatabaseUser>> GetUsersAsync()
        {
            try
            {
                // Önce tüm kullanıcıları ve global yetkilerini alalım
                var usersResult = await _sshService.ExecuteCommandAsync(@"
                    mysql -N -e '
                    SELECT 
                        User, 
                        Host,
                        CONCAT_WS("","",
                            IF(Select_priv = ""Y"", ""SELECT"", NULL),
                            IF(Insert_priv = ""Y"", ""INSERT"", NULL),
                            IF(Update_priv = ""Y"", ""UPDATE"", NULL),
                            IF(Delete_priv = ""Y"", ""DELETE"", NULL),
                            IF(Create_priv = ""Y"", ""CREATE"", NULL),
                            IF(Drop_priv = ""Y"", ""DROP"", NULL),
                            IF(Reload_priv = ""Y"", ""RELOAD"", NULL),
                            IF(Shutdown_priv = ""Y"", ""SHUTDOWN"", NULL),
                            IF(Process_priv = ""Y"", ""PROCESS"", NULL),
                            IF(File_priv = ""Y"", ""FILE"", NULL),
                            IF(Grant_priv = ""Y"", ""GRANT OPTION"", NULL),
                            IF(References_priv = ""Y"", ""REFERENCES"", NULL),
                            IF(Index_priv = ""Y"", ""INDEX"", NULL),
                            IF(Alter_priv = ""Y"", ""ALTER"", NULL),
                            IF(Show_db_priv = ""Y"", ""SHOW DATABASES"", NULL),
                            IF(Super_priv = ""Y"", ""SUPER"", NULL),
                            IF(Create_tmp_table_priv = ""Y"", ""CREATE TEMPORARY TABLES"", NULL),
                            IF(Lock_tables_priv = ""Y"", ""LOCK TABLES"", NULL),
                            IF(Execute_priv = ""Y"", ""EXECUTE"", NULL),
                            IF(Repl_slave_priv = ""Y"", ""REPLICATION SLAVE"", NULL),
                            IF(Repl_client_priv = ""Y"", ""REPLICATION CLIENT"", NULL),
                            IF(Create_view_priv = ""Y"", ""CREATE VIEW"", NULL),
                            IF(Show_view_priv = ""Y"", ""SHOW VIEW"", NULL),
                            IF(Create_routine_priv = ""Y"", ""CREATE ROUTINE"", NULL),
                            IF(Alter_routine_priv = ""Y"", ""ALTER ROUTINE"", NULL),
                            IF(Create_user_priv = ""Y"", ""CREATE USER"", NULL),
                            IF(Event_priv = ""Y"", ""EVENT"", NULL),
                            IF(Trigger_priv = ""Y"", ""TRIGGER"", NULL)
                        ) as global_privileges,
                        (
                            SELECT GROUP_CONCAT(CONCAT(db, ""="", priv_list) SEPARATOR "";"")
                            FROM (
                                SELECT db,
                                CONCAT_WS("","",
                                    IF(Select_priv = ""Y"", ""SELECT"", NULL),
                                    IF(Insert_priv = ""Y"", ""INSERT"", NULL),
                                    IF(Update_priv = ""Y"", ""UPDATE"", NULL),
                                    IF(Delete_priv = ""Y"", ""DELETE"", NULL),
                                    IF(Create_priv = ""Y"", ""CREATE"", NULL),
                                    IF(Drop_priv = ""Y"", ""DROP"", NULL),
                                    IF(Grant_priv = ""Y"", ""GRANT"", NULL),
                                    IF(References_priv = ""Y"", ""REFERENCES"", NULL),
                                    IF(Index_priv = ""Y"", ""INDEX"", NULL),
                                    IF(Alter_priv = ""Y"", ""ALTER"", NULL),
                                    IF(Create_tmp_table_priv = ""Y"", ""CREATE TEMPORARY TABLES"", NULL),
                                    IF(Lock_tables_priv = ""Y"", ""LOCK TABLES"", NULL),
                                    IF(Create_view_priv = ""Y"", ""CREATE VIEW"", NULL),
                                    IF(Show_view_priv = ""Y"", ""SHOW VIEW"", NULL),
                                    IF(Create_routine_priv = ""Y"", ""CREATE ROUTINE"", NULL),
                                    IF(Alter_routine_priv = ""Y"", ""ALTER ROUTINE"", NULL),
                                    IF(Execute_priv = ""Y"", ""EXECUTE"", NULL),
                                    IF(Event_priv = ""Y"", ""EVENT"", NULL),
                                    IF(Trigger_priv = ""Y"", ""TRIGGER"", NULL)
                                ) as priv_list
                                FROM mysql.db
                                WHERE user = User AND host = Host
                            ) db_privs
                        ) as db_privileges
                    FROM mysql.user;'
                ");

                var users = new List<DatabaseUser>();
                foreach (var line in usersResult.Split('\n', StringSplitOptions.RemoveEmptyEntries))
                {
                    var parts = line.Split('\t');
                    if (parts.Length >= 4)
                    {
                        var username = parts[0];
                        var host = parts[1];
                        var globalPrivileges = !string.IsNullOrEmpty(parts[2])
                            ? parts[2].Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
                            : new List<string>();

                        var dbPrivileges = new Dictionary<string, List<string>>();
                        if (!string.IsNullOrEmpty(parts[3]))
                        {
                            foreach (var dbPriv in parts[3].Split(';', StringSplitOptions.RemoveEmptyEntries))
                            {
                                var dbParts = dbPriv.Split('=');
                                if (dbParts.Length == 2)
                                {
                                    dbPrivileges[dbParts[0]] = dbParts[1].Split(',', StringSplitOptions.RemoveEmptyEntries).ToList();
                                }
                            }
                        }

                        // Root ve SUPER yetkisi olan kullanıcılar için ALL PRIVILEGES göster
                        if (username == "root" || globalPrivileges.Contains("SUPER"))
                        {
                            globalPrivileges = new List<string> { "ALL PRIVILEGES" };
                        }

                        users.Add(new DatabaseUser
                        {
                            Username = username,
                            Host = host,
                            GlobalPrivileges = globalPrivileges,
                            DatabasePrivileges = dbPrivileges
                        });
                    }
                }
                return users;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kullanıcılar listelenirken hata oluştu");
                return new List<DatabaseUser>();
            }
        }

        public async Task<List<string>> GetTablesAsync(string database)
        {
            try
            {
                var result = await _sshService.ExecuteCommandAsync(
                    $"mysql -N -e 'SHOW TABLES FROM `{database}`;'"
                );
                return result.Split('\n', StringSplitOptions.RemoveEmptyEntries).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Tablolar listelenirken hata oluştu: {Database}", database);
                return new List<string>();
            }
        }

        public async Task<bool> DeleteDatabaseAsync(string name)
        {
            try
            {
                var result = await _sshService.ExecuteCommandAsync(
                    $"mysql -e 'DROP DATABASE `{name}`;'"
                );
                return string.IsNullOrEmpty(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Veritabanı silinirken hata oluştu: {Name}", name);
                return false;
            }
        }

        public async Task<List<DatabaseUser>> GetDatabaseUsersAsync(string database)
        {
            try
            {
                var result = await _sshService.ExecuteCommandAsync(
                    $"mysql -N -e 'SELECT user, host, GROUP_CONCAT(DISTINCT privilege_type) " +
                    $"FROM information_schema.schema_privileges " +
                    $"WHERE table_schema = \"{database}\" GROUP BY user, host;'"
                );

                var users = new List<DatabaseUser>();
                foreach (var line in result.Split('\n', StringSplitOptions.RemoveEmptyEntries))
                {
                    var parts = line.Split('\t');
                    if (parts.Length >= 3)
                    {
                        var dbPrivileges = new Dictionary<string, List<string>>
                        {
                            { database, parts[2].Split(',').ToList() }
                        };

                        users.Add(new DatabaseUser
                        {
                            Username = parts[0],
                            Host = parts[1],
                            GlobalPrivileges = new List<string>(), // Bu veritabanı özelinde yetkileri gösterdiğimiz için boş bırakıyoruz
                            DatabasePrivileges = dbPrivileges
                        });
                    }
                }
                return users;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Veritabanı kullanıcıları listelenirken hata oluştu: {Database}", database);
                return new List<DatabaseUser>();
            }
        }

        public async Task<bool> CreateUserAsync(CreateUserRequest request)
        {
            try
            {
                // 1. Kullanıcı kontrolü
                var checkUser = await _sshService.ExecuteCommandAsync(
                    $"mysql -N -e 'SELECT User FROM mysql.user WHERE User = \"{request.Username}\" AND Host = \"{request.Host}\";'"
                );

                if (!string.IsNullOrEmpty(checkUser))
                {
                    _logger.LogWarning("Kullanıcı zaten mevcut: {Username}@{Host}", request.Username, request.Host);
                    return false;
                }

                // 2. Kullanıcı oluştur
                var createResult = await _sshService.ExecuteCommandAsync(
                    $"mysql -e 'CREATE USER \"{request.Username}\"@\"{request.Host}\" IDENTIFIED BY \"{request.Password}\";'"
                );

                if (!string.IsNullOrEmpty(createResult))
                {
                    _logger.LogError("Kullanıcı oluşturulurken hata: {Error}", createResult);
                    return false;
                }

                // 3. İstenen veritabanı için yetkileri ver
                if (!string.IsNullOrEmpty(request.Database) && request.Privileges.Any())
                {
                    var privilegeString = string.Join(", ", request.Privileges);

                    var grantResult = await _sshService.ExecuteCommandAsync(
                        $"mysql -e 'GRANT {privilegeString} ON `{request.Database}`.* TO \"{request.Username}\"@\"{request.Host}\'; " +
                        $"FLUSH PRIVILEGES;'"
                    );

                    if (!string.IsNullOrEmpty(grantResult))
                    {
                        _logger.LogError("Yetkiler verilirken hata: {Error}", grantResult);
                        return false;
                    }

                    // 4. Diğer tüm veritabanlarının yetkilerini kaldır
                    var revokeOthersResult = await _sshService.ExecuteCommandAsync(
                        $"mysql -e '" +
                        $"REVOKE ALL PRIVILEGES ON *.* FROM \"{request.Username}\"@\"{request.Host}\"; " + // Global yetkileri kaldır
                        $"GRANT {privilegeString} ON `{request.Database}`.* TO \"{request.Username}\"@\"{request.Host}\"; " + // İstenen yetkileri tekrar ver
                        $"FLUSH PRIVILEGES;'"
                    );

                    if (!string.IsNullOrEmpty(revokeOthersResult))
                    {
                        _logger.LogError("Diğer yetkiler kaldırılırken hata: {Error}", revokeOthersResult);
                        return false;
                    }

                    // 5. Son durumu kontrol et
                    var verifyResult = await _sshService.ExecuteCommandAsync(
                        $"mysql -N -e 'SHOW GRANTS FOR \"{request.Username}\"@\"{request.Host}\";'"
                    );

                    _logger.LogInformation("Kullanıcı yetkileri: {Grants}", verifyResult);
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kullanıcı oluşturulurken hata oluştu: {Username}", request.Username);
                return false;
            }
        }

        public async Task<bool> DeleteUserAsync(string username, string host = "localhost")
        {
            try
            {
                var result = await _sshService.ExecuteCommandAsync(
                    $"mysql -e 'DROP USER \"{username}\"@\"{host}\";'"
                );
                return string.IsNullOrEmpty(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Kullanıcı silinirken hata oluştu: {Username}", username);
                return false;
            }
        }

        public async Task<bool> GrantPrivilegesAsync(string username, string database, List<string> privileges, string host = "localhost")
        {
            try
            {
                // Önce sadece bu veritabanı için olan yetkileri kaldır
                var revokeResult = await _sshService.ExecuteCommandAsync(
                    $"mysql -e 'REVOKE ALL PRIVILEGES ON `{database}`.* FROM \"{username}\"@\"{host}\"; " +
                    $"FLUSH PRIVILEGES;'"
                );

                // Frontend'den gelen yetkileri direkt kullan
                var privilegeString = string.Join(", ", privileges);

                // Sadece belirtilen veritabanı için yetki ver
                var grantResult = await _sshService.ExecuteCommandAsync(
                    $"mysql -e 'GRANT {privilegeString} ON `{database}`.* TO \"{username}\"@\"{host}\"; " +
                    $"FLUSH PRIVILEGES;'"
                );

                if (!string.IsNullOrEmpty(grantResult))
                {
                    _logger.LogError("Yetkiler verilirken hata: {Error}", grantResult);
                    return false;
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Yetkiler verilirken hata oluştu: {Username}", username);
                return false;
            }
        }

        public async Task<bool> RevokePrivilegesAsync(string username, string database, string host = "localhost")
        {
            try
            {
                var result = await _sshService.ExecuteCommandAsync(
                    $"mysql -e 'REVOKE ALL PRIVILEGES ON `{database}`.* FROM \"{username}\"@\"{host}\";'"
                );
                return string.IsNullOrEmpty(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Yetkiler alınırken hata oluştu: {Username}", username);
                return false;
            }
        }

        private string FormatSize(long bytes)
        {
            string[] sizes = { "B", "KB", "MB", "GB", "TB" };
            int order = 0;
            double size = bytes;

            while (size >= 1024 && order < sizes.Length - 1)
            {
                order++;
                size = size / 1024;
            }

            return $"{size:0.##} {sizes[order]}";
        }

        // ... Diğer metodlar
    }
}