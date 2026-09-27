using CitasMedicas.Api.Modules.Configuration.Application.Dtos;

namespace CitasMedicas.Api.Modules.Configuration.Application.Interfaces;

// Puerto publico del modulo Configuration: es lo unico que otros modulos deben conocer (DIP)
public interface IConfiguracionService
{
    Task<ConfiguracionMedicoDto?> ObtenerPorMedicoAsync(string medicoId);
    Task<ConfiguracionMedicoDto> GuardarAsync(GuardarConfiguracionRequest request);
}