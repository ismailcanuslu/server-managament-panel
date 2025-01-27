using web_panel_app.Models;

namespace web_panel_app.Services
{
    public interface ICertificateService
    {
        Task<List<Certificate>> ListCertificatesAsync();
        Task<bool> RequestCertificateAsync(CertificateRequest request);
        Task<bool> RevokeCertificateAsync(string domain);
        Task<bool> RenewCertificateAsync(string domain);
    }
}