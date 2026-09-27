using Microsoft.AspNetCore.Mvc;
using CitasMedicas.Api.Modules.Configuration.Application.Dtos;
using CitasMedicas.Api.Modules.Configuration.Application.Interfaces;

namespace CitasMedicas.Api.Modules.Configuration.Api;

[ApiController]
[Route("api/configuracion")]
public class ConfiguracionController : ControllerBase
{
    private readonly IConfiguracionService _service;

    public ConfiguracionController(IConfiguracionService service)
    {
        _service = service;
    }

    [HttpGet("{medicoId}")]
    public async Task<ActionResult<ConfiguracionMedicoDto>> ObtenerPorMedico(string medicoId)
    {
        var config = await _service.ObtenerPorMedicoAsync(medicoId);
        return config is null ? NotFound() : Ok(config);
    }

    [HttpPut]
    public async Task<ActionResult<ConfiguracionMedicoDto>> Guardar([FromBody] GuardarConfiguracionRequest request)
    {
        var resultado = await _service.GuardarAsync(request);
        return Ok(resultado);
    }
}