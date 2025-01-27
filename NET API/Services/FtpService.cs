using Renci.SshNet;
using Renci.SshNet.Sftp;
using Microsoft.Extensions.Logging;
using web_panel_app.Models;
using System.IO;
using System.Threading.Tasks;

namespace web_panel_app.Services
{
    public class FtpService : IFtpService
    {
        private readonly ILogger<FtpService> _logger;
        private readonly string _host;
        private readonly string _username;
        private readonly string _password;
        private readonly ISshService _sshService;

        public FtpService(ILogger<FtpService> logger, IConfiguration configuration, ISshService sshService)
        {
            _logger = logger;
            _host = configuration["SSH:Host"] ?? "localhost";
            _username = configuration["SSH:Username"] ?? "";
            _password = configuration["SSH:Password"] ?? "";
            _sshService = sshService;
        }

        private SftpClient GetClient()
        {
            var client = new SftpClient(_host, _username, _password);
            client.Connect();
            return client;
        }

        public async Task<List<FtpFile>> ListDirectoryAsync(string path = "/")
        {
            try
            {
                using var client = GetClient();
                var items = client.ListDirectory(path);

                return items.Select(item => new FtpFile
                {
                    Name = item.Name,
                    Path = item.FullName,
                    Size = FormatSize(item.Length),
                    Type = item.IsDirectory ? "directory" : "file",
                    Modified = item.LastWriteTime,
                    Permissions = item.Attributes.ToString()
                }).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dizin listelenirken hata oluştu: {Path}", path);
                return new List<FtpFile>();
            }
        }

        public async Task<bool> UploadFileAsync(string path, IFormFile file)
        {
            try
            {
                var fileName = Path.GetFileName(file.FileName);
                var directory = path;
                var fullPath = Path.Combine(directory, fileName).Replace("\\", "/");

                // Hedef yolun benzersiz olmasını sağla
                fullPath = await GetUniquePathAsync(fullPath);

                // Geçici bir dosya oluştur
                var tempPath = Path.GetTempFileName();
                try
                {
                    // Önce dosyayı geçici konuma kaydet
                    using (var stream = new FileStream(tempPath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }

                    // Hedef dizini oluştur
                    await _sshService.ExecuteCommandAsync($"sudo mkdir -p {directory}");

                    // scp komutu ile dosyayı yükle
                    using var scp = new ScpClient(_host, _username, _password);
                    scp.Connect();

                    using (var fs = new FileStream(tempPath, FileMode.Open))
                    {
                        scp.Upload(fs, fullPath);
                    }

                    // Dosya izinlerini ayarla
                    await _sshService.ExecuteCommandAsync($"sudo chown root:root {fullPath}");
                    await _sshService.ExecuteCommandAsync($"sudo chmod 644 {fullPath}");

                    return true;
                }
                finally
                {
                    // Geçici dosyayı temizle
                    if (File.Exists(tempPath))
                    {
                        File.Delete(tempPath);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dosya yüklenirken hata oluştu: {Path}", path);
                return false;
            }
        }

        public async Task<byte[]> DownloadFileAsync(string path)
        {
            try
            {
                using var client = GetClient();
                using var stream = new MemoryStream();
                client.DownloadFile(path, stream);
                return stream.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dosya indirilirken hata oluştu: {Path}", path);
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string path)
        {
            try
            {
                using var client = GetClient();
                client.DeleteFile(path);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dosya silinirken hata oluştu: {Path}", path);
                return false;
            }
        }

        public async Task<bool> CreateDirectoryAsync(string path)
        {
            try
            {
                using var client = GetClient();
                client.CreateDirectory(path);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dizin oluşturulurken hata oluştu: {Path}", path);
                return false;
            }
        }

        public async Task<bool> DeleteDirectoryAsync(string path)
        {
            try
            {
                using var client = GetClient();
                client.DeleteDirectory(path);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dizin silinirken hata oluştu: {Path}", path);
                return false;
            }
        }

        public async Task<bool> RenameFileAsync(string oldPath, string newPath)
        {
            try
            {
                using var client = GetClient();
                client.RenameFile(oldPath, newPath);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dosya yeniden adlandırılırken hata oluştu: {OldPath} -> {NewPath}", oldPath, newPath);
                return false;
            }
        }

        public async Task<string> GetFileSizeAsync(string path)
        {
            try
            {
                // Hem dosya hem dizin boyutunu hesapla
                var command = $@"
                    if [ -d '{path}' ]; then
                        du -sb '{path}' | cut -f1
                    else
                        stat -f %z '{path}' 2>/dev/null || stat -c %s '{path}'
                    fi
                ";

                var result = await _sshService.ExecuteCommandAsync(command);
                var bytes = long.Parse(result.Trim());

                return FormatSize(bytes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dosya boyutu hesaplanırken hata oluştu: {Path}", path);
                return "0 B";
            }
        }

        public async Task<DateTime> GetLastModifiedAsync(string path)
        {
            try
            {
                using var client = GetClient();
                var fileInfo = client.Get(path);
                return fileInfo.LastWriteTime;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Son değişiklik tarihi alınırken hata oluştu: {Path}", path);
                return DateTime.MinValue;
            }
        }

        public async Task<bool> PasteFileAsync(FileOperation operation)
        {
            try
            {
                foreach (var sourcePath in operation.SourcePaths)
                {
                    var fileName = Path.GetFileName(sourcePath);
                    var destinationFullPath = Path.Combine(operation.DestinationPath, fileName).Replace("\\", "/");

                    // Hedef yolun benzersiz olmasını sağla
                    destinationFullPath = await GetUniquePathAsync(destinationFullPath);

                    if (operation.Operation == "cut")
                    {
                        await _sshService.ExecuteCommandAsync($"sudo mv {sourcePath} {destinationFullPath}");
                    }
                    else if (operation.Operation == "copy")
                    {
                        await _sshService.ExecuteCommandAsync($"sudo cp -r {sourcePath} {destinationFullPath}");
                    }
                    else if (operation.Operation == "delete")
                    {
                        // Dosyayı sil
                        if (await IsDirectoryAsync(sourcePath))
                        {
                            await _sshService.ExecuteCommandAsync($"sudo rm -rf {sourcePath}");
                        }
                        else
                        {
                            await _sshService.ExecuteCommandAsync($"sudo rm -f {sourcePath}");
                        }
                        continue; // Silme işleminde izin ayarlamaya gerek yok
                    }

                    // İzinleri ayarla
                    await _sshService.ExecuteCommandAsync($"sudo chown -R root:root {destinationFullPath}");
                    await _sshService.ExecuteCommandAsync($"sudo chmod -R 644 {destinationFullPath}");
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dosya işlemi sırasında hata oluştu");
                return false;
            }
        }

        public async Task<(bool Success, string? ArchivePath)> CompressFilesAsync(CompressRequest request)
        {
            try
            {
                // Hedef dizinin var olduğundan emin ol
                await _sshService.ExecuteCommandAsync($"mkdir -p {request.TargetPath}");

                // İlk dosyanın adını al (birden fazla dosya varsa ilkini kullan)
                var firstFileName = Path.GetFileNameWithoutExtension(request.Files.FirstOrDefault() ?? "archive");

                // Arşiv uzantısını belirle
                var archiveExt = request.Format switch
                {
                    "zip" => "zip",
                    "targz" => "tar.gz",
                    "tarbz2" => "tar.bz2",
                    _ => throw new ArgumentException("Desteklenmeyen arşiv formatı")
                };

                // Arşiv yolunu oluştur ve benzersiz yap
                var archivePath = Path.Combine(request.TargetPath, $"{firstFileName}.{archiveExt}").Replace("\\", "/");
                archivePath = await GetUniquePathAsync(archivePath);
                var archiveName = Path.GetFileName(archivePath);

                // Dosya listesini oluştur
                var fileList = string.Join(" ", request.Files.Select(f => $"'{f}'"));

                // Sıkıştırma komutunu oluştur
                var command = request.Format switch
                {
                    "zip" => $"cd {request.TargetPath} && zip -r9 '{archiveName}' {fileList}",  // -r: recursive, -9: en iyi sıkıştırma
                    "targz" => $"cd {request.TargetPath} && tar -czf '{archiveName}' {fileList}",
                    "tarbz2" => $"cd {request.TargetPath} && tar -cjf '{archiveName}' {fileList}",
                    _ => throw new ArgumentException("Desteklenmeyen arşiv formatı")
                };

                // Sıkıştırma işlemini gerçekleştir
                var result = await _sshService.ExecuteCommandAsync(command);

                if (result.Contains("error") || result.Contains("failed"))
                {
                    _logger.LogError("Sıkıştırma hatası: {Result}", result);
                    return (false, null);
                }

                // İzinleri ayarla
                await _sshService.ExecuteCommandAsync($"chmod 644 '{archivePath}'");

                return (true, archivePath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Dosyalar sıkıştırılırken hata oluştu");
                return (false, null);
            }
        }

        public async Task<(bool Success, string? Message)> ExtractFileAsync(ExtractOperation operation)
        {
            try
            {
                // Hedef dizini oluştur
                await _sshService.ExecuteCommandAsync($"mkdir -p '{operation.DestinationPath}'");

                // Arşiv dosyasının uzantısını kontrol et
                var extension = Path.GetExtension(operation.ArchivePath).ToLower();
                var isTarGz = operation.ArchivePath.EndsWith(".tar.gz", StringComparison.OrdinalIgnoreCase);
                var isTarBz2 = operation.ArchivePath.EndsWith(".tar.bz2", StringComparison.OrdinalIgnoreCase);

                // Çakışma kontrolü için önce içeriği listele
                var command = "";
                if (extension == ".zip")
                {
                    command = $"unzip -l '{operation.ArchivePath}' | tail -n +4 | head -n -2 | awk '{{print $4}}'";
                }
                else if (isTarGz || isTarBz2)
                {
                    command = $"tar -tf '{operation.ArchivePath}'";
                }
                else
                {
                    return (false, "Desteklenmeyen arşiv türü");
                }

                var fileList = await _sshService.ExecuteCommandAsync(command);
                var files = fileList.Split('\n', StringSplitOptions.RemoveEmptyEntries);

                // Çakışma kontrolü
                var conflicts = new List<string>();
                foreach (var file in files)
                {
                    var targetPath = Path.Combine(operation.DestinationPath, file).Replace("\\", "/");
                    if (await _sshService.ExecuteCommandAsync($"test -e '{targetPath}' && echo 'exists'") == "exists")
                    {
                        conflicts.Add(file);
                    }
                }

                if (conflicts.Any() && !operation.OverwriteExisting && !operation.KeepBoth)
                {
                    return (false, new { message = "Dosya çakışması tespit edildi", conflicts }.ToString());
                }

                // Çıkarma komutunu oluştur
                if (extension == ".zip")
                {
                    command = operation.OverwriteExisting
                        ? $"cd '{operation.DestinationPath}' && unzip -o '{operation.ArchivePath}'"  // -o: overwrite
                        : $"cd '{operation.DestinationPath}' && unzip -n '{operation.ArchivePath}'"; // -n: never overwrite
                }
                else if (isTarGz)
                {
                    command = $"cd '{operation.DestinationPath}' && tar -xzf '{operation.ArchivePath}'";
                }
                else if (isTarBz2)
                {
                    command = $"cd '{operation.DestinationPath}' && tar -xjf '{operation.ArchivePath}'";
                }

                // Eğer KeepBoth seçiliyse ve çakışma varsa, çakışan dosyaları yeniden adlandır
                if (operation.KeepBoth && conflicts.Any())
                {
                    foreach (var file in conflicts)
                    {
                        var targetPath = Path.Combine(operation.DestinationPath, file).Replace("\\", "/");
                        var counter = 1;
                        var newPath = targetPath;
                        var fileName = Path.GetFileNameWithoutExtension(targetPath);
                        var ext = Path.GetExtension(targetPath);

                        while (await _sshService.ExecuteCommandAsync($"test -e '{newPath}' && echo 'exists'") == "exists")
                        {
                            newPath = Path.Combine(
                                Path.GetDirectoryName(targetPath) ?? "",
                                $"{fileName}({counter}){ext}"
                            ).Replace("\\", "/");
                            counter++;
                        }

                        if (targetPath != newPath)
                        {
                            await _sshService.ExecuteCommandAsync($"mv '{targetPath}' '{newPath}'");
                        }
                    }
                }

                // Çıkarma işlemini gerçekleştir
                var result = await _sshService.ExecuteCommandAsync(command);

                if (result.Contains("error") || result.Contains("failed"))
                {
                    return (false, $"Arşiv çıkarma hatası: {result}");
                }

                // İzinleri ayarla
                await _sshService.ExecuteCommandAsync($"chmod -R 644 '{operation.DestinationPath}'");

                return (true, "Arşiv başarıyla çıkarıldı");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Arşiv açılırken hata oluştu");
                return (false, $"Hata: {ex.Message}");
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

        private async Task<bool> IsDirectoryAsync(string path)
        {
            try
            {
                var result = await _sshService.ExecuteCommandAsync($"test -d {path} && echo 'true' || echo 'false'");
                return result.Trim().ToLower() == "true";
            }
            catch
            {
                return false;
            }
        }

        private async Task<string> GetUniquePathAsync(string path)
        {
            try
            {
                var directory = Path.GetDirectoryName(path) ?? "";
                var fileName = Path.GetFileNameWithoutExtension(path);
                var extension = Path.GetExtension(path);
                var newPath = path;
                var counter = 1;

                // Dosya/dizin var mı kontrol et
                while (await _sshService.ExecuteCommandAsync($"test -e '{newPath}' && echo 'exists'") == "exists")
                {
                    newPath = Path.Combine(directory, $"{fileName}({counter}){extension}").Replace("\\", "/");
                    counter++;
                }

                return newPath;
            }
            catch
            {
                return path; // Hata durumunda orijinal path'i döndür
            }
        }
    }
}