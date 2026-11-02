namespace CitasMedicas.Api.Shared.Security;

public interface IJwtTokenService
{
    (string Token, DateTime ExpiraEn) Generar(string usuarioId, string email, string nombre, string rol);
}
