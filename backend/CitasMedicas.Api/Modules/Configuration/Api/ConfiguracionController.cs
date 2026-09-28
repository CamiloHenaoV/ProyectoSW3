using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CitasMedicas.Api.Modules.Configuration.Application.Dtos;
using CitasMedicas.Api.Modules.Configuration.Application.Interfaces;
using CitasMedicas.Api.Shared.Security;

namespace CitasMedicas.Api.Modules.Configuration.Api;

// RF3: solo el administrador configura los parametros de agendamiento
[ApiController]
[Route("api/configuracion")]
[Authorize(Roles = Roles.Administrador)]
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
