using CitasMedicas.Api.Modules.Patients.Application.Dtos;
using CitasMedicas.Api.Modules.Patients.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CitasMedicas.Api.Modules.Patients.Api;

[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResult>> Login([FromBody] LoginRequest request)
    {
        if (request is null)
            return BadRequest(new { mensaje = "La solicitud es obligatoria." });

        var result = await _authService.LoginAsync(request);
        if (result is null)
            return Unauthorized(new { mensaje = "Credenciales inválidas." });

        return Ok(result);
    }
}
