using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace CitasMedicas.Api.Shared.Security;

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtSettings _settings;

    public JwtTokenService(IConfiguration configuration)
    {
        _settings = configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings();
    }

    public (string Token, DateTime ExpiraEn) Generar(string usuarioId, string email, string nombre, string rol)
    {
        var expiresAt = DateTime.UtcNow.AddMinutes(_settings.ExpirationMinutes);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, usuarioId),
            new(ClaimTypes.NameIdentifier, usuarioId),
            new(ClaimTypes.Email, email),
            new(ClaimTypes.Name, nombre),
            new(ClaimTypes.Role, rol)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_settings.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
