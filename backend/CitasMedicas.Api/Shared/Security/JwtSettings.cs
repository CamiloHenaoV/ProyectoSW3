namespace CitasMedicas.Api.Shared.Security;

public class JwtSettings
{
    // La clave NO va en el repo: se inyecta con "dotnet user-secrets" o variable de entorno.
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "CitasMedicas.Api";
    public string Audience { get; set; } = "CitasMedicas.Frontend";
    public int ExpirationMinutes { get; set; } = 60;
}
