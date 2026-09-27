namespace CitasMedicas.Api.Modules.Scheduling.Application.Dtos;

// RF1: lo que se muestra en la tabla del agendador
public record CitaListadoDto(
    string Id,
    string MedicoId,
    string MedicoNombre,
    DateTime Fecha,
    TimeSpan HoraInicio,
    TimeSpan HoraFin,
    string Estado,
    string? PacienteId
);
public record AgendarCitaRequest(
    string MedicoId,
    string PacienteId,
    DateTime Fecha,
    TimeSpan HoraInicio
);
public record FranjaDisponibleDto(DateTime Fecha, TimeSpan HoraInicio, TimeSpan HoraFin);