using System.Security.Claims;
using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;
using CitasMedicas.Api.Modules.Patients.Application.Interfaces;
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
    private readonly IPacienteService _pacienteService;

    public CitasController(ICitaService citaService, IPacienteService pacienteService)
    {
        _citaService = citaService;
        _pacienteService = pacienteService;
    }

    [HttpGet]
    [Authorize(Roles = $"{Roles.Agendador},{Roles.Administrador},{Roles.Medico},{Roles.Terapista}")]
    public async Task<IActionResult> ListarPorMedicoYFecha(
        [FromQuery] string medicoId,
        [FromQuery] DateTime fecha)
    {
        if (string.IsNullOrWhiteSpace(medicoId))
            return BadRequest(new { mensaje = "Falta el id del médico." });

        if (!User.IsInRole(Roles.Agendador) && !User.IsInRole(Roles.Administrador))
        {
            var medicoPropio = User.FindFirst("medico_id")?.Value;
            if (string.IsNullOrWhiteSpace(medicoPropio) ||
                !string.Equals(medicoPropio, medicoId, StringComparison.Ordinal))
            {
                return Forbid();
            }
        }

        return Ok(await _citaService.ListarPorMedicoYFechaAsync(medicoId, fecha));
    }

    [HttpGet("historial")]
    [Authorize(Roles = $"{Roles.Agendador},{Roles.Administrador},{Roles.Medico},{Roles.Terapista}")]
    public async Task<IActionResult> HistorialPorDocumento([FromQuery] string documento)
    {
        if (string.IsNullOrWhiteSpace(documento) ||
            documento.Trim().Length is < 3 or > 32 ||
            !documento.Trim().All(c => char.IsLetterOrDigit(c) || c == '-'))
        {
            return BadRequest(new { mensaje = "La cédula debe tener entre 3 y 32 caracteres alfanuméricos." });
        }

        var historial = await _citaService.ListarPorDocumentoAsync(documento.Trim());
        return historial is null
            ? NotFound(new { mensaje = "No existe un paciente registrado con esa cédula." })
            : Ok(historial);
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
        var paciente = await ResolverPacienteAutenticadoAsync();
        if (paciente is null)
            return Unauthorized();

        var cita = await _citaService.AgendarAsync(paciente.Id, request);
        return Ok(cita);
    }

    [HttpGet("mis-citas")]
    [Authorize(Roles = Roles.Paciente)]
    public async Task<IActionResult> MisCitas()
    {
        var paciente = await ResolverPacienteAutenticadoAsync();
        if (paciente is null)
            return Unauthorized();

        return Ok(await _citaService.ListarPorPacienteAsync(
            paciente.Id,
            ObtenerSubjectId()));
    }

    [HttpPut("{id}/reagendar")]
    [Authorize(Roles = Roles.Paciente)]
    public async Task<IActionResult> Reagendar(string id, [FromBody] ReagendarCitaRequest request)
    {
        var paciente = await ResolverPacienteAutenticadoAsync();
        if (paciente is null)
            return Unauthorized();

        var cita = await _citaService.ReagendarAsync(
            id,
            paciente.Id,
            request,
            ObtenerSubjectId());
        return cita is null ? NotFound() : Ok(cita);
    }

    [HttpPut("{id}/cancelar")]
    [Authorize(Roles = $"{Roles.Paciente},{Roles.Agendador},{Roles.Administrador}")]
    public async Task<IActionResult> Cancelar(string id)
    {
        var paciente = User.IsInRole(Roles.Paciente)
            ? await ResolverPacienteAutenticadoAsync()
            : null;

        if (User.IsInRole(Roles.Paciente) && paciente is null)
            return Unauthorized();

        return await _citaService.CancelarAsync(
            id,
            paciente?.Id,
            User.IsInRole(Roles.Paciente) ? ObtenerSubjectId() : null)
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

    private Task<CitasMedicas.Api.Modules.Patients.Application.Dtos.PacienteDto?> ResolverPacienteAutenticadoAsync()
    {
        var subjectId = ObtenerSubjectId();
        var documento = User.FindFirstValue("documento");
        return string.IsNullOrWhiteSpace(subjectId) || string.IsNullOrWhiteSpace(documento)
            ? Task.FromResult<CitasMedicas.Api.Modules.Patients.Application.Dtos.PacienteDto?>(null)
            : _pacienteService.ResolverIdentidadKeycloakAsync(documento, subjectId);
    }

    private string? ObtenerSubjectId()
        => User.FindFirstValue("sub") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
}
