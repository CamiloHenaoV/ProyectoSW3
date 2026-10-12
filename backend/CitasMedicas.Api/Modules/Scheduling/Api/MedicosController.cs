using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;
using CitasMedicas.Api.Shared.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CitasMedicas.Api.Modules.Scheduling.Api;

[ApiController]
[Route("api/medicos")]
[Authorize]
public class MedicosController : ControllerBase
{
    private readonly IMedicoService _medicoService;

    public MedicosController(IMedicoService medicoService)
    {
        _medicoService = medicoService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] bool incluirInactivos = false)
    {
        if (incluirInactivos && !User.IsInRole(Roles.Administrador))
            return Forbid();

        return Ok(await _medicoService.ListarAsync(incluirInactivos));
    }

    [HttpPut("{medicoId}/estado")]
    [Authorize(Roles = Roles.Administrador)]
    public async Task<IActionResult> ActualizarEstado(
        string medicoId,
        [FromBody] ActualizarEstadoMedicoRequest request)
    {
        var medico = await _medicoService.ActualizarEstadoAsync(medicoId, request.Activo);
        return medico is null ? NotFound() : Ok(medico);
    }
}
