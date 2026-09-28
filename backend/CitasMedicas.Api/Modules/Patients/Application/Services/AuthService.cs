using CitasMedicas.Api.Modules.Patients.Application.Dtos;
using CitasMedicas.Api.Modules.Patients.Domain;
using CitasMedicas.Api.Modules.Patients.Infrastructure;
using CitasMedicas.Api.Shared.Security;
using MongoDB.Driver;

namespace CitasMedicas.Api.Modules.Patients.Application.Services;

public class AuthService
{
    private readonly IPacienteRepository _repository;
    private readonly IJwtTokenService _tokenService;

    public AuthService(IPacienteRepository repository, IJwtTokenService tokenService)
    {
        _repository = repository;
        _tokenService = tokenService;
    }

    public async Task<AuthResult?> LoginAsync(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            return null;

        var email = request.Email.Trim();
        var paciente = await _repository.FindOneAsync(
            Builders<Paciente>.Filter.Eq(p => p.Email, email));

        if (paciente is null)
            return null;

        var passwordOk = BCrypt.Net.BCrypt.Verify(request.Password, paciente.PasswordHash);
        if (!passwordOk)
            return null;

        var (token, expiraEn) = _tokenService.Generar(
            paciente.Id,
            paciente.Email,
            paciente.Nombre,
            paciente.Rol);

        return new AuthResult(
            token,
            expiraEn,
            new UsuarioAutenticadoDto(paciente.Id, paciente.Nombre, paciente.Email, paciente.Rol));
    }
}
