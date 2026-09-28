using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;
using CitasMedicas.Api.Shared.Security;
using MongoDB.Bson;

namespace CitasMedicas.Api.Modules.Scheduling.Api;

[ApiController]
[Route("api/citas")]
[Authorize]
public class CitasController : ControllerBase
{
    private readonly ICitaService _citaService;

    public CitasController(ICitaService citaService)
    {
        _citaService = citaService;
    }

    [HttpGet]
    [Authorize(Roles = $"{Roles.Agendador},{Roles.Administrador}")]
    public async Task<ActionResult<List<CitaListadoDto>>> Listar(
        [FromQuery] string medicoId, [FromQuery] DateTime fecha)
    {
        if (string.IsNullOrWhiteSpace(medicoId))
            return BadRequest(new { mensaje = "medicoId es requerido." });

        if (!ObjectId.TryParse(medicoId, out _))
            return BadRequest(new { mensaje = "medicoId no es válido." });

        var citas = await _citaService.ListarPorMedicoYFechaAsync(medicoId, fecha);
        return Ok(citas);
    }

    [HttpGet("franjas-disponibles")]
    public async Task<ActionResult<List<FranjaDisponibleDto>>> FranjasDisponibles(
        [FromQuery] string medicoId, [FromQuery] DateTime fecha)
    {
        if (string.IsNullOrWhiteSpace(medicoId))
            return BadRequest(new { mensaje = "medicoId es requerido." });

        if (!ObjectId.TryParse(medicoId, out _))
            return BadRequest(new { mensaje = "medicoId no es válido." });

        var franjas = await _citaService.ObtenerFranjasDisponiblesAsync(medicoId, fecha);
        return Ok(franjas);
    }

    [HttpGet("mis-citas")]
    [Authorize(Roles = Roles.Paciente)]
    public async Task<ActionResult<List<CitaListadoDto>>> MisCitas()
    {
        var pacienteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(pacienteId))
            return Unauthorized();

        var citas = await _citaService.ListarPorPacienteAsync(pacienteId);
        return Ok(citas);
    }

    [HttpPost("agendar")]
    [Authorize(Roles = Roles.Paciente)]
    public async Task<ActionResult<CitaListadoDto>> Agendar([FromBody] AgendarCitaRequest request)
    {
        var pacienteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(pacienteId))
            return Unauthorized();

        try
        {
            var cita = await _citaService.AgendarAsync(pacienteId, request);
            return CreatedAtAction(nameof(FranjasDisponibles),
                new { medicoId = cita.MedicoId, fecha = cita.Fecha }, cita);
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
}
