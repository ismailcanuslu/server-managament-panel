using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Renci.SshNet;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;

public class SshConnectionManager : IDisposable
{
    private readonly Dictionary<string, SshClient> _connections = new();
    private readonly object _lock = new object();
    private readonly ILogger<SshConnectionManager> _logger;
    private readonly IConfiguration _configuration;
    private bool _disposed;
    private Timer? _healthCheckTimer;

    public SshConnectionManager(IConfiguration configuration, ILogger<SshConnectionManager> logger)
    {
        _configuration = configuration;
        _logger = logger;
        InitializeDefaultConnection();
        StartHealthCheck();
    }

    private void InitializeDefaultConnection()
    {
        try
        {
            var defaultConnection = new SshConnectionRequest
            {
                Name = "Localhost",
                Host = _configuration["SSH:Host"] ?? "localhost",
                Username = _configuration["SSH:Username"] ?? "root",
                Password = _configuration["SSH:Password"]
            };

            var client = CreateSshClient(new SshConnection
            {
                Id = "default",
                Name = defaultConnection.Name,
                Host = defaultConnection.Host,
                Username = defaultConnection.Username,
                Password = defaultConnection.Password
            });

            client.Connect();
            _connections["default"] = client;
            _logger.LogInformation("Varsayılan SSH bağlantısı kuruldu");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Varsayılan SSH bağlantısı oluşturulamadı");
            throw;
        }
    }

    private void StartHealthCheck()
    {
        // Her 30 saniyede bir bağlantıları kontrol et
        _healthCheckTimer = new Timer(CheckConnections, null, TimeSpan.Zero, TimeSpan.FromSeconds(30));
    }

    private void CheckConnections(object? state)
    {
        try
        {
            lock (_lock)
            {
                if (_connections.TryGetValue("default", out var client))
                {
                    if (!client.IsConnected)
                    {
                        _logger.LogWarning("Varsayılan SSH bağlantısı kopmuş, yeniden bağlanılıyor...");
                        try
                        {
                            ReconnectDefault();
                            _logger.LogInformation("Varsayılan SSH bağlantısı başarıyla yeniden kuruldu");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Varsayılan SSH bağlantısı yeniden kurulamadı");
                        }
                    }
                }
                else
                {
                    _logger.LogWarning("Varsayılan SSH bağlantısı bulunamadı, yeniden oluşturuluyor...");
                    try
                    {
                        InitializeDefaultConnection();
                        _logger.LogInformation("Varsayılan SSH bağlantısı başarıyla oluşturuldu");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Varsayılan SSH bağlantısı oluşturulamadı");
                    }
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Bağlantı kontrolü sırasında hata oluştu");
        }
    }

    public SshClient GetConnection(string connectionId = "default")
    {
        lock (_lock)
        {
            if (!_connections.TryGetValue(connectionId, out var client) || !client.IsConnected)
            {
                throw new InvalidOperationException($"Bağlantı bulunamadı veya kopuk: {connectionId}");
            }
            return client;
        }
    }

    public string CreateConnection(SshConnectionRequest request)
    {
        var connection = new SshConnection
        {
            Name = request.Name,
            Host = request.Host,
            Port = request.Port,
            Username = request.Username,
            Password = request.Password,
            PrivateKey = request.PrivateKey,
            Passphrase = request.Passphrase
        };

        lock (_lock)
        {
            var client = CreateSshClient(connection);
            client.Connect();

            _connections[connection.Id] = client;
            return connection.Id;
        }
    }

    private SshClient CreateSshClient(SshConnection connection)
    {
        if (!string.IsNullOrEmpty(connection.PrivateKey))
        {
            var privateKeyFile = new PrivateKeyFile(
                new MemoryStream(Encoding.UTF8.GetBytes(connection.PrivateKey)),
                connection.Passphrase
            );

            return new SshClient(
                connection.Host,
                connection.Port,
                connection.Username,
                privateKeyFile
            );
        }

        return new SshClient(
            connection.Host,
            connection.Port,
            connection.Username,
            connection.Password
        );
    }

    public void CloseConnection(string connectionId)
    {
        lock (_lock)
        {
            if (_connections.TryGetValue(connectionId, out var client))
            {
                client.Disconnect();
                client.Dispose();
                _connections.Remove(connectionId);
            }
        }
    }

    public List<SshConnection> GetActiveConnections()
    {
        lock (_lock)
        {
            return _connections.Select(c => new SshConnection
            {
                Id = c.Key,
                IsConnected = c.Value.IsConnected,
                LastActivity = DateTime.Now
                // Diğer özellikleri de ekle
            }).ToList();
        }
    }

    public void ReconnectDefault()
    {
        lock (_lock)
        {
            if (_connections.TryGetValue("default", out var client))
            {
                if (!client.IsConnected)
                {
                    try
                    {
                        client.Connect();
                        _logger.LogInformation("Varsayılan SSH bağlantısı yeniden kuruldu");
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Varsayılan SSH bağlantısı yeniden kurulamadı");
                        throw;
                    }
                }
            }
            else
            {
                InitializeDefaultConnection();
            }
        }
    }

    public void Dispose()
    {
        Dispose(true);
        GC.SuppressFinalize(this);
    }

    protected virtual void Dispose(bool disposing)
    {
        if (!_disposed)
        {
            if (disposing)
            {
                _healthCheckTimer?.Dispose();
                lock (_lock)
                {
                    foreach (var client in _connections.Values)
                    {
                        client.Dispose();
                    }
                    _connections.Clear();
                }
            }
            _disposed = true;
        }
    }

    ~SshConnectionManager()
    {
        Dispose(false);
    }
}