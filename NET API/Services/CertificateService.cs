using web_panel_app.Models;

namespace web_panel_app.Services
{
    public class CertificateService : ICertificateService
    {
        private readonly ISshService _sshService;
        private readonly ILogger<CertificateService> _logger;

        public CertificateService(ISshService sshService, ILogger<CertificateService> logger)
        {
            _sshService = sshService;
            _logger = logger;
        }

        public async Task<List<Certificate>> ListCertificatesAsync()
        {
            var certificates = new List<Certificate>();

            try
            {
                // 1. Certbot sertifikalarını listele
                var certbotOutput = await _sshService.ExecuteCommandAsync("certbot certificates");
                certificates.AddRange(ParseCertbotOutput(certbotOutput));

                // 2. Apache SSL konfigürasyonlarını kontrol et
                var apacheConfOutput = await _sshService.ExecuteCommandAsync("find /etc/apache2/sites-enabled -type f -exec grep -l 'SSLCertificateFile' {} \\;");
                foreach (var confFile in apacheConfOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries))
                {
                    var confContent = await _sshService.ExecuteCommandAsync($"cat {confFile}");
                    certificates.AddRange(ParseApacheConfForCertificates(confContent));
                }

                // 3. Sistem sertifikalarını kontrol et
                var systemCertsOutput = await _sshService.ExecuteCommandAsync("find /etc/ssl/certs -type f -name '*.pem' -o -name '*.crt'");
                foreach (var certPath in systemCertsOutput.Split('\n', StringSplitOptions.RemoveEmptyEntries))
                {
                    var certInfo = await _sshService.ExecuteCommandAsync($"openssl x509 -in {certPath} -text -noout");
                    certificates.AddRange(ParseOpenSSLOutput(certInfo, certPath));
                }

                return certificates.DistinctBy(c => c.Domain).ToList();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sertifikalar listelenirken hata oluştu");
                return certificates;
            }
        }

        public async Task<bool> RequestCertificateAsync(CertificateRequest request)
        {
            try
            {
                var domains = request.EnableWww
                    ? $"-d {request.Domain} -d www.{request.Domain}"
                    : $"-d {request.Domain}";

                var command = $"certbot --apache {domains} --non-interactive --agree-tos --email admin@{request.Domain}";

                if (request.EnableAutoRenew)
                {
                    command += " --keep-until-expiring --expand";
                }

                var result = await _sshService.ExecuteCommandAsync(command);

                return !result.Contains("error") && !result.Contains("failed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sertifika alınırken hata oluştu: {Domain}", request.Domain);
                return false;
            }
        }

        public async Task<bool> RevokeCertificateAsync(string domain)
        {
            try
            {
                var result = await _sshService.ExecuteCommandAsync($"certbot revoke --cert-name {domain} --non-interactive");
                return !result.Contains("error") && !result.Contains("failed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sertifika iptal edilirken hata oluştu: {Domain}", domain);
                return false;
            }
        }

        public async Task<bool> RenewCertificateAsync(string domain)
        {
            try
            {
                var result = await _sshService.ExecuteCommandAsync($"certbot renew --cert-name {domain} --force-renewal");
                return !result.Contains("error") && !result.Contains("failed");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Sertifika yenilenirken hata oluştu: {Domain}", domain);
                return false;
            }
        }

        private List<Certificate> ParseCertbotOutput(string output)
        {
            var certificates = new List<Certificate>();
            var lines = output.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            Certificate? current = null;

            foreach (var line in lines.Select(l => l.Trim()))
            {
                if (line.StartsWith("Certificate Name:"))
                {
                    if (current != null) certificates.Add(current);
                    current = new Certificate
                    {
                        Issuer = "Let's Encrypt",
                        Type = "SSL/TLS",
                        IsAutoRenew = true // Let's Encrypt sertifikaları otomatik yenilenir
                    };
                    current.Domain = line.Split(':')[1].Trim();
                }
                else if (current != null)
                {
                    if (line.StartsWith("Expiry Date:"))
                    {
                        var dateStr = line.Split(':', 2)[1].Trim();
                        // "(VALID: XX days)" kısmını kaldır
                        dateStr = dateStr.Split('(')[0].Trim();
                        if (DateTime.TryParse(dateStr, out var expiryDate))
                        {
                            current.ExpiryDate = expiryDate;
                            // Status'u güncelle
                            current.Status = expiryDate > DateTime.UtcNow ? "Valid" : "Expired";
                        }
                    }
                    else if (line.StartsWith("Certificate Path:"))
                    {
                        current.Path = line.Split(':')[1].Trim();
                    }
                    else if (line.StartsWith("Domains:"))
                    {
                        // Birden fazla domain varsa ilkini al
                        var domains = line.Split(':')[1].Trim().Split(' ');
                        if (!string.IsNullOrEmpty(current.Domain) && domains.Length > 0)
                        {
                            current.Domain = domains[0];
                        }
                    }
                }
            }

            if (current != null) certificates.Add(current);
            return certificates;
        }

        private List<Certificate> ParseApacheConfForCertificates(string confContent)
        {
            var certificates = new List<Certificate>();
            var lines = confContent.Split('\n');

            string? currentDomain = null;
            string? certPath = null;

            foreach (var line in lines)
            {
                if (line.Contains("ServerName"))
                {
                    currentDomain = line.Split(' ')[1].Trim();
                }
                else if (line.Contains("SSLCertificateFile"))
                {
                    certPath = line.Split(' ')[1].Trim();
                    if (currentDomain != null && certPath != null)
                    {
                        certificates.Add(new Certificate
                        {
                            Domain = currentDomain,
                            Path = certPath,
                            Type = "SSL/TLS"
                        });
                    }
                }
            }

            return certificates;
        }

        private List<Certificate> ParseOpenSSLOutput(string certInfo, string certPath)
        {
            var certificates = new List<Certificate>();
            var lines = certInfo.Split('\n');

            var cert = new Certificate
            {
                Path = certPath,
                Type = "SSL/TLS"
            };

            foreach (var line in lines)
            {
                if (line.Contains("Issuer:"))
                {
                    cert.Issuer = line.Split(':', 2)[1].Trim();
                }
                else if (line.Contains("Not After :"))
                {
                    var dateStr = line.Split(':', 2)[1].Trim();
                    DateTime.TryParse(dateStr, out var expiryDate);
                    cert.ExpiryDate = expiryDate;
                }
                else if (line.Contains("Subject:") && line.Contains("CN="))
                {
                    cert.Domain = line.Split("CN=")[1].Split(',')[0].Trim();
                }
            }

            if (!string.IsNullOrEmpty(cert.Domain))
            {
                cert.Status = cert.ExpiryDate > DateTime.UtcNow ? "Valid" : "Expired";
                certificates.Add(cert);
            }

            return certificates;
        }
    }
}