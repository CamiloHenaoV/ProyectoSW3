using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;

namespace CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;

public interface ICitaService
{
    // RF1
    Task<List<CitaListadoDto>> ListarPorMedicoYFechaAsync(string medicoId, DateTime fecha);
    // Soporte de RF2: franjas segun configuracion (RF3) + citas ya agendadas
    Task<List<FranjaDisponibleDto>> ObtenerFranjasDisponiblesAsync(string medicoId, DateTime fecha);
}