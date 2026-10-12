using CitasMedicas.Api.Modules.Patients.Application.Dtos;
using CitasMedicas.Api.Modules.Patients.Application.Interfaces;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CitasMedicas.Api.Modules.Patients.Api;

[ApiController]
[Route("api/pacientes")]
public class PacientesController : ControllerBase
{
    private readonly IPacienteService _pacienteService;

    public PacientesController(IPacienteService pacienteService)
    {
        _pacienteService = pacienteService;
    }

    [HttpPost("registro")]
    [AllowAnonymous]
    public async Task<ActionResult<PacienteDto>> Registrar([FromBody] RegistroPacienteRequest request)
    {
        if (request is null)
            return BadRequest(new { mensaje = "La solicitud es obligatoria." });

        try
        {
            var paciente = await _pacienteService.RegistrarAsync(request);
            return Ok(paciente);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { mensaje = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }

    [HttpGet("{id}")]
    [Authorize]
    public async Task<ActionResult<PacienteDto>> ObtenerPorId(string id)
    {
        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (User.IsInRole("Paciente") && usuarioId != id)
            return Forbid();

        var paciente = await _pacienteService.ObtenerPorIdAsync(id);
        return paciente is null ? NotFound() : Ok(paciente);
    }
}
