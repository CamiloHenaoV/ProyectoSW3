using MongoDB.Driver;
using CitasMedicas.Api.Modules.Patients.Application.Dtos;
using CitasMedicas.Api.Modules.Patients.Application.Interfaces;
using CitasMedicas.Api.Modules.Patients.Domain;
using CitasMedicas.Api.Modules.Patients.Infrastructure;
using CitasMedicas.Api.Shared.Security;

namespace CitasMedicas.Api.Modules.Patients.Application.Services;

public class AuthService : IAuthService
{
    private readonly IPacienteRepository _repository;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthService(IPacienteRepository repository, IJwtTokenService jwtTokenService)
    {
        _repository = repository;
        _jwtTokenService = jwtTokenService;
    }

    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return null;

        var email = request.Email.Trim().ToLowerInvariant();
        var paciente = await _repository.FindOneAsync(Builders<Paciente>.Filter.Eq(p => p.Email, email));

        // Mismo resultado (null) si el usuario no existe o la clave es incorrecta:
        // no revelamos cual de los dos falló.
        if (paciente is null || !VerificarPassword(request.Password, paciente.PasswordHash))
            return null;

        var (token, expiraEn) = _jwtTokenService.Generar(paciente.Id, paciente.Email, paciente.Nombre, paciente.Rol);

        return new AuthResponse(
            token,
            expiraEn,
            new UsuarioAutenticadoDto(paciente.Id, paciente.Nombre, paciente.Email, paciente.Rol));
    }

    private static bool VerificarPassword(string password, string hash)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            // Hash con formato antiguo (no BCrypt): se trata como credencial invalida
            return false;
        }
    }
}
