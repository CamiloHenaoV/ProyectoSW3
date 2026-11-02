namespace CitasMedicas.Api.Shared.Security;

public class JwtSettings
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "CitasMedicas";
    public string Audience { get; set; } = "CitasMedicasClient";
    public int ExpirationMinutes { get; set; } = 60;
}
