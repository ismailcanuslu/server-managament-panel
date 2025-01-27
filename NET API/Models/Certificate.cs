namespace web_panel_app.Models
{
    public class Certificate
    {
        public string Domain { get; set; } = string.Empty;
        public string Issuer { get; set; } = string.Empty;  // Let's Encrypt, Sectigo vb.
        public DateTime ExpiryDate { get; set; }
        public string Status { get; set; } = string.Empty;  // Valid, Expired, Revoked
        public string Type { get; set; } = string.Empty;    // SSL/TLS
        public string Path { get; set; } = string.Empty;    // Sertifika dosya yolu
        public bool IsAutoRenew { get; set; }              // Otomatik yenileme aktif mi
    }

    public class CertificateRequest
    {
        public string Domain { get; set; } = string.Empty;
        public bool EnableWww { get; set; } = true;        // www. subdomainini de ekle
        public bool EnableAutoRenew { get; set; } = true;  // Otomatik yenileme
    }
}