using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;
using CitasMedicas.Api.Shared.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Bson;

namespace CitasMedicas.Api.Modules.Scheduling.Api;

[ApiController]
[Route("api/reportes")]
[Authorize(Roles = RolesReportes)]
public class ReportesController : ControllerBase
{
    /// <summary>RF7: el reporte lo generan médicos y terapistas; el administrador también lo consulta.</summary>
    public const string RolesReportes = $"{Roles.Medico},{Roles.Terapista},{Roles.Administrador}";

    private readonly IReporteCitasService _reporteService;

    public ReportesController(IReporteCitasService reporteService)
    {
        _reporteService = reporteService;
    }

    /// <summary>
    /// RF7: cantidad de citas por mes y por médico/terapista en un año.
    /// GET /api/reportes/citas-por-mes?anio=2026&amp;incluirCanceladas=false&amp;medicoId=
    /// </summary>
    [HttpGet("citas-por-mes")]
    public async Task<IActionResult> CitasPorMes(
        [FromQuery] int? anio,
        [FromQuery] bool incluirCanceladas = false,
        [FromQuery] string? medicoId = null)
    {
        if (!string.IsNullOrWhiteSpace(medicoId) && !ObjectId.TryParse(medicoId.Trim(), out _))
            return BadRequest(new { mensaje = "El médico seleccionado no es válido." });

        try
        {
            var reporte = await _reporteService.CitasPorMesAsync(
                anio ?? DateTime.UtcNow.Year,
                incluirCanceladas,
                medicoId);

            return reporte is null
                ? NotFound(new { mensaje = "No existe el médico o terapista seleccionado." })
                : Ok(reporte);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { mensaje = ex.Message });
        }
    }
}
