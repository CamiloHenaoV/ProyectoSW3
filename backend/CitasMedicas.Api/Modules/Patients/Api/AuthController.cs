using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CitasMedicas.Api.Modules.Patients.Application.Dtos;
using CitasMedicas.Api.Modules.Patients.Application.Interfaces;

namespace CitasMedicas.Api.Modules.Patients.Api;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var respuesta = await _authService.LoginAsync(request);
        return respuesta is null
            ? Unauthorized(new { mensaje = "Correo o contraseña incorrectos." })
            : Ok(respuesta);
    }
}
