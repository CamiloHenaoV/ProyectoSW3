namespace CitasMedicas.Api.Modules.Patients.Application.Dtos;

public record LoginRequest(string Email, string Password);

public record UsuarioAutenticadoDto(string Id, string Nombre, string Email, string Rol);

public record AuthResult(string Token, DateTime ExpiraEn, UsuarioAutenticadoDto Usuario);
