using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;

namespace CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;

public interface ICitaService
{
    Task<List<CitaListadoDto>> ListarPorMedicoYFechaAsync(string medicoId, DateTime fecha);
    Task<List<CitaListadoDto>> ListarPorPacienteAsync(string pacienteId);
    Task<List<FranjaDisponibleDto>> ObtenerFranjasDisponiblesAsync(string medicoId, DateTime fecha);
    Task<CitaListadoDto> AgendarAsync(string pacienteId, AgendarCitaRequest request);
    Task<bool> CancelarAsync(string citaId, string? pacienteId);
    Task<bool> EliminarAsync(string citaId);
    Task<CitaListadoDto?> ReagendarAsync(string citaId, string pacienteId, ReagendarCitaRequest request);
}
