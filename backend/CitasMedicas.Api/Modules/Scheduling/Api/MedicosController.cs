using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;

namespace CitasMedicas.Api.Modules.Scheduling.Api;

[ApiController]
[Route("api/medicos")]
[AllowAnonymous]
public class MedicosController : ControllerBase
{
    private readonly IMedicoService _medicoService;

    public MedicosController(IMedicoService medicoService)
    {
        _medicoService = medicoService;
    }

    [HttpGet]
    public async Task<ActionResult<List<MedicoDto>>> Listar()
    {
        return Ok(await _medicoService.ListarAsync());
    }
}
