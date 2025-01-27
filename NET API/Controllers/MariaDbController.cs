using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using web_panel_app.Models;
using web_panel_app.Services;

namespace web_panel_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MariaDbController : ControllerBase
    {
        private readonly IMariaDbService _mariaDbService;
        private readonly ILogger<MariaDbController> _logger;

        public MariaDbController(IMariaDbService mariaDbService, ILogger<MariaDbController> logger)
        {
            _mariaDbService = mariaDbService;
            _logger = logger;
        }

        [HttpGet("databases")]
        public async Task<ActionResult<List<Database>>> GetDatabases()
        {
            var databases = await _mariaDbService.GetDatabasesAsync();
            return Ok(databases);
        }

        [HttpGet("databases/{name}/tables")]
        public async Task<ActionResult<List<string>>> GetTables(string name)
        {
            var tables = await _mariaDbService.GetTablesAsync(name);
            return Ok(tables);
        }

        [HttpPost("databases")]
        public async Task<IActionResult> CreateDatabase([FromBody] CreateDatabaseRequest request)
        {
            var result = await _mariaDbService.CreateDatabaseAsync(request.Name, request.Charset, request.Collation);
            return result ? Ok() : BadRequest("Veritabanı oluşturulamadı");
        }

        [HttpDelete("databases/{name}")]
        public async Task<IActionResult> DeleteDatabase(string name)
        {
            var result = await _mariaDbService.DeleteDatabaseAsync(name);
            return result ? Ok() : BadRequest("Veritabanı silinemedi");
        }

        [HttpGet("users")]
        public async Task<ActionResult<List<DatabaseUser>>> GetUsers()
        {
            var users = await _mariaDbService.GetUsersAsync();
            return Ok(users);
        }

        [HttpGet("databases/{name}/users")]
        public async Task<ActionResult<List<DatabaseUser>>> GetDatabaseUsers(string name)
        {
            var users = await _mariaDbService.GetDatabaseUsersAsync(name);
            return Ok(users);
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            var result = await _mariaDbService.CreateUserAsync(request);
            return result ? Ok() : BadRequest("Kullanıcı oluşturulamadı");
        }

        [HttpDelete("users/{username}")]
        public async Task<IActionResult> DeleteUser(string username, [FromQuery] string host = "localhost")
        {
            var result = await _mariaDbService.DeleteUserAsync(username, host);
            return result ? Ok() : BadRequest("Kullanıcı silinemedi");
        }

        [HttpPost("users/{username}/grant")]
        public async Task<IActionResult> GrantPrivileges(string username, [FromBody] GrantPrivilegesRequest request)
        {
            var result = await _mariaDbService.GrantPrivilegesAsync(username, request.Database, request.Privileges, request.Host);
            return result ? Ok() : BadRequest("Yetkiler verilemedi");
        }

        [HttpPost("users/{username}/revoke")]
        public async Task<IActionResult> RevokePrivileges(string username, [FromBody] RevokePrivilegesRequest request)
        {
            var result = await _mariaDbService.RevokePrivilegesAsync(username, request.Database, request.Host);
            return result ? Ok() : BadRequest("Yetkiler alınamadı");
        }
    }
}