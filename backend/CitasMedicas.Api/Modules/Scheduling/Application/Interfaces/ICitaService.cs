using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;

namespace CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;

public interface ICitaService
{    
    Task<List<CitaListadoDto>> ListarPorMedicoYFechaAsync(string medicoId, DateTime fecha);
    Task<List<FranjaDisponibleDto>> ObtenerFranjasDisponiblesAsync(string medicoId, DateTime fecha);
    Task<CitaListadoDto> AgendarAsync(AgendarCitaRequest request);
}