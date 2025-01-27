using web_panel_app.Models;
using Microsoft.AspNetCore.Http;

namespace web_panel_app.Services
{
    public interface IFtpService
    {
        Task<List<FtpFile>> ListDirectoryAsync(string path = "/");
        Task<bool> UploadFileAsync(string path, IFormFile file);
        Task<bool> DeleteFileAsync(string path);
        Task<byte[]> DownloadFileAsync(string path);
        Task<bool> CreateDirectoryAsync(string path);
        Task<bool> DeleteDirectoryAsync(string path);
        Task<bool> RenameFileAsync(string oldPath, string newPath);
        Task<string> GetFileSizeAsync(string path);
        Task<DateTime> GetLastModifiedAsync(string path);
        Task<bool> PasteFileAsync(FileOperation operation);
        Task<(bool Success, string? ArchivePath)> CompressFilesAsync(CompressRequest request);
        Task<(bool Success, string? Message)> ExtractFileAsync(ExtractOperation operation);
    }
}