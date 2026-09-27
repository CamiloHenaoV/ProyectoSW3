using Microsoft.AspNetCore.Mvc;
using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;

namespace CitasMedicas.Api.Modules.Scheduling.Api;

[ApiController]
[Route("api/citas")]
public class CitasController : ControllerBase
{
    private readonly ICitaService _citaService;

    public CitasController(ICitaService citaService)
    {
        _citaService = citaService;
    }

    // RF1: GET /api/citas?medicoId=...&fecha=2026-10-05
    // Contexto: busqueda con filtros (medico + fecha) y resultados en tabla.
    [HttpGet]
    public async Task<ActionResult<List<CitaListadoDto>>> Listar(
        [FromQuery] string medicoId, [FromQuery] DateTime fecha)
    {
        if (string.IsNullOrWhiteSpace(medicoId))
            return BadRequest(new { mensaje = "medicoId es requerido." });

        var citas = await _citaService.ListarPorMedicoYFechaAsync(medicoId, fecha);
        return Ok(citas);
    }
}