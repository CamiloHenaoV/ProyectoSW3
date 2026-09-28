using CitasMedicas.Api.Modules.Patients.Application.Dtos;

namespace CitasMedicas.Api.Modules.Patients.Application.Interfaces;

public interface IAuthService
{
    // Devuelve null si las credenciales no son validas
    Task<AuthResponse?> LoginAsync(LoginRequest request);
}
