using System.Security.Claims;
using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;
using CitasMedicas.Api.Shared.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
    public async Task<IActionResult> ListarPorMedicoYFecha(
        [FromQuery] string medicoId,
        [FromQuery] DateTime fecha)
    {
        if (string.IsNullOrWhiteSpace(medicoId))
            return BadRequest(new { mensaje = "Falta el id del médico." });

        return Ok(await _citaService.ListarPorMedicoYFechaAsync(medicoId, fecha));
    }

    [HttpGet("franjas-disponibles")]
    public async Task<IActionResult> ObtenerFranjasDisponibles(
        [FromQuery] string medicoId,
        [FromQuery] DateTime fecha)
    {
        if (string.IsNullOrWhiteSpace(medicoId))
            return BadRequest(new { mensaje = "Falta el id del médico." });

        return Ok(await _citaService.ObtenerFranjasDisponiblesAsync(medicoId, fecha));
    }

    [HttpPost("agendar")]
    [Authorize(Roles = Roles.Paciente)]
    public async Task<IActionResult> Agendar([FromBody] AgendarCitaRequest request)
    {
        var pacienteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(pacienteId))
            return Unauthorized();

        var cita = await _citaService.AgendarAsync(pacienteId, request);
        return Ok(cita);
    }

    [HttpGet("mis-citas")]
    [Authorize(Roles = Roles.Paciente)]
    public async Task<IActionResult> MisCitas()
    {
        var pacienteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(pacienteId))
            return Unauthorized();

        return Ok(await _citaService.ListarPorPacienteAsync(pacienteId));
    }

    [HttpPut("{id}/reagendar")]
    [Authorize(Roles = Roles.Paciente)]
    public async Task<IActionResult> Reagendar(string id, [FromBody] ReagendarCitaRequest request)
    {
        var pacienteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrWhiteSpace(pacienteId))
            return Unauthorized();

        var cita = await _citaService.ReagendarAsync(id, pacienteId, request);
        return cita is null ? NotFound() : Ok(cita);
    }

    [HttpPut("{id}/cancelar")]
    [Authorize(Roles = $"{Roles.Paciente},{Roles.Agendador},{Roles.Administrador}")]
    public async Task<IActionResult> Cancelar(string id)
    {
        var pacienteId = User.IsInRole(Roles.Paciente)
            ? User.FindFirstValue(ClaimTypes.NameIdentifier)
            : null;

        if (User.IsInRole(Roles.Paciente) && string.IsNullOrWhiteSpace(pacienteId))
            return Unauthorized();

        return await _citaService.CancelarAsync(id, pacienteId)
            ? NoContent()
            : NotFound();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = Roles.Administrador)]
    public async Task<IActionResult> Eliminar(string id)
    {
        return await _citaService.EliminarAsync(id)
            ? NoContent()
            : NotFound();
    }
}
