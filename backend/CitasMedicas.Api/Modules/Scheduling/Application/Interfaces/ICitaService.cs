using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;

namespace CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;

public interface ICitaService
{
    // RF1
    Task<List<CitaListadoDto>> ListarPorMedicoYFechaAsync(string medicoId, DateTime fecha);

    // RF2: paciente consulta sus citas
    Task<List<CitaListadoDto>> ListarPorPacienteAsync(string pacienteId);

    // Soporte de RF2: franjas segun configuracion (RF3) + citas ya agendadas
    Task<List<FranjaDisponibleDto>> ObtenerFranjasDisponiblesAsync(string medicoId, DateTime fecha);

    // RF2
    Task<CitaListadoDto> AgendarAsync(string pacienteId, AgendarCitaRequest request);
}
