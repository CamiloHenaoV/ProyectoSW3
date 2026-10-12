using CitasMedicas.Api.Modules.Configuration.Application.Dtos;
using CitasMedicas.Api.Modules.Configuration.Application.Interfaces;
using CitasMedicas.Api.Shared.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CitasMedicas.Api.Modules.Configuration.Api;

[ApiController]
[Route("api/configuracion")]
[Authorize(Roles = Roles.Administrador)]
public class ConfiguracionController : ControllerBase
{
    private readonly IConfiguracionService _configuracionService;

    public ConfiguracionController(IConfiguracionService configuracionService)
    {
        _configuracionService = configuracionService;
    }

    [HttpGet]
    public async Task<IActionResult> Listar()
        => Ok(await _configuracionService.ListarAsync());

    [HttpGet("{medicoId}")]
    public async Task<IActionResult> ObtenerPorMedico(string medicoId)
    {
        var configuracion = await _configuracionService.ObtenerPorMedicoAsync(medicoId);
        return configuracion is null ? NotFound() : Ok(configuracion);
    }

    [HttpPut]
    public async Task<IActionResult> Guardar([FromBody] GuardarConfiguracionRequest request)
        => Ok(await _configuracionService.GuardarAsync(request));

    [HttpDelete("{medicoId}")]
    public async Task<IActionResult> Eliminar(string medicoId)
    {
        return await _configuracionService.EliminarAsync(medicoId)
            ? NoContent()
            : NotFound();
    }
}
