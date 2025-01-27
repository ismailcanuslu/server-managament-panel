using Microsoft.AspNetCore.Mvc;
using web_panel_app.Models;
using web_panel_app.Services;
using Microsoft.Extensions.Options;

namespace web_panel_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FtpController : ControllerBase
    {
        private readonly IFtpService _ftpService;
        private readonly ILogger<FtpController> _logger;
        private readonly FileUploadOptions _fileUploadOptions;

        public FtpController(
            IFtpService ftpService,
            ILogger<FtpController> logger,
            IOptions<FileUploadOptions> fileUploadOptions)
        {
            _ftpService = ftpService;
            _logger = logger;
            _fileUploadOptions = fileUploadOptions.Value;
        }

        [HttpGet("list")]
        public async Task<ActionResult<List<FtpFile>>> ListDirectory([FromQuery] string path = "/")
        {
            var files = await _ftpService.ListDirectoryAsync(path);
            return Ok(files);
        }

        [HttpPost("upload")]
        [RequestSizeLimit(1073741824)] // 1GB
        [RequestFormLimits(MultipartBodyLengthLimit = 1073741824)]
        public async Task<IActionResult> UploadFile([FromForm] UploadFileRequest request)
        {
            if (request.File.Length > _fileUploadOptions.MaxFileSize)
            {
                return BadRequest($"Dosya boyutu {_fileUploadOptions.MaxFileSize / 1024 / 1024}MB'dan büyük olamaz");
            }

            var result = await _ftpService.UploadFileAsync(request.Path, request.File);
            return result ? Ok() : BadRequest("Dosya yüklenemedi");
        }

        [HttpGet("download")]
        public async Task<IActionResult> DownloadFile([FromQuery] string path)
        {
            var fileBytes = await _ftpService.DownloadFileAsync(path);
            return File(fileBytes, "application/octet-stream", Path.GetFileName(path));
        }

        [HttpDelete("file")]
        public async Task<IActionResult> DeleteFile([FromQuery] string path)
        {
            var result = await _ftpService.DeleteFileAsync(path);
            return result ? Ok() : BadRequest("Dosya silinemedi");
        }

        [HttpPost("directory")]
        public async Task<IActionResult> CreateDirectory([FromQuery] string path)
        {
            var result = await _ftpService.CreateDirectoryAsync(path);
            return result ? Ok() : BadRequest("Dizin oluşturulamadı");
        }

        [HttpDelete("directory")]
        public async Task<IActionResult> DeleteDirectory([FromQuery] string path)
        {
            var result = await _ftpService.DeleteDirectoryAsync(path);
            return result ? Ok() : BadRequest("Dizin silinemedi");
        }

        [HttpPost("rename")]
        public async Task<IActionResult> RenameFile([FromQuery] string oldPath, [FromQuery] string newPath)
        {
            var result = await _ftpService.RenameFileAsync(oldPath, newPath);
            return result ? Ok() : BadRequest("Dosya yeniden adlandırılamadı");
        }

        [HttpGet("size")]
        public async Task<ActionResult<string>> GetFileSize([FromQuery] string path)
        {
            var size = await _ftpService.GetFileSizeAsync(path);
            return Ok(size);
        }

        [HttpGet("modified")]
        public async Task<ActionResult<DateTime>> GetLastModified([FromQuery] string path)
        {
            var modified = await _ftpService.GetLastModifiedAsync(path);
            return Ok(modified);
        }

        [HttpPost("paste")]
        public async Task<IActionResult> PasteFile([FromBody] FileOperation operation)
        {
            var result = await _ftpService.PasteFileAsync(operation);
            return result ? Ok() : BadRequest();
        }

        [HttpPost("compress")]
        public async Task<IActionResult> CompressFiles([FromBody] CompressRequest request)
        {
            var (success, archivePath) = await _ftpService.CompressFilesAsync(request);

            if (!success)
            {
                return BadRequest("Dosyalar sıkıştırılırken bir hata oluştu");
            }

            return Ok(new { archivePath });
        }

        [HttpPost("extract")]
        public async Task<IActionResult> ExtractFile([FromBody] ExtractOperation operation)
        {
            var (success, message) = await _ftpService.ExtractFileAsync(operation);

            if (!success)
            {
                // Eğer mesaj bir JSON string ise (çakışma durumu) direkt olarak döndür
                if (message?.StartsWith("{") == true)
                {
                    return BadRequest(message);
                }
                return BadRequest(new { message });
            }

            return Ok(new { message });
        }

        // Diğer endpoint'ler...
    }
}