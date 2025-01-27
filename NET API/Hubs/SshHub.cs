using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace WebSSH.Hubs
{
    [Authorize]
    public class SshHub : Hub
    {
        private readonly SshConnectionManager _sshManager;
        private readonly ILogger<SshHub> _logger;

        public SshHub(SshConnectionManager sshManager, ILogger<SshHub> logger)
        {
            _sshManager = sshManager;
            _logger = logger;
        }

        public async Task JoinSession(string connectionId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, connectionId);
        }

        public async Task ExecuteCommand(string connectionId, string command)
        {
            try
            {
                var client = _sshManager.GetConnection(connectionId);
                using var cmd = client.CreateCommand(command);
                var result = await Task.Run(() => cmd.Execute());
                await Clients.Group(connectionId).SendAsync("ReceiveOutput", result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Komut çalıştırılamadı");
                await Clients.Group(connectionId).SendAsync("ReceiveError", ex.Message);
            }
        }
    }
}