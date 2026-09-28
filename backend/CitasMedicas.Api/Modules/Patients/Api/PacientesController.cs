using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CitasMedicas.Api.Modules.Patients.Application.Dtos;
using CitasMedicas.Api.Modules.Patients.Application.Interfaces;
using CitasMedicas.Api.Shared.Security;

namespace CitasMedicas.Api.Modules.Patients.Api;

[ApiController]
[Route("api/pacientes")]
public class PacientesController : ControllerBase
{
    private readonly IPacienteService _service;

    public PacientesController(IPacienteService service)
    {
        _service = service;
    }

    [HttpPost("registro")]
    [AllowAnonymous]
    public async Task<ActionResult<PacienteDto>> Registrar([FromBody] RegistroPacienteRequest request)
    {
        try
        {
            var paciente = await _service.RegistrarAsync(request);
            return CreatedAtAction(nameof(ObtenerPorId), new { id = paciente.Id }, paciente);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
    }

    // Un paciente solo puede ver su propio perfil; el administrador puede ver cualquiera.
    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<PacienteDto>> ObtenerPorId(string id)
    {
        var esPropio = User.FindFirstValue(ClaimTypes.NameIdentifier) == id;
        if (!esPropio && !User.IsInRole(Roles.Administrador))
            return Forbid();

        var paciente = await _service.ObtenerPorIdAsync(id);
        return paciente is null ? NotFound() : Ok(paciente);
    }
}
