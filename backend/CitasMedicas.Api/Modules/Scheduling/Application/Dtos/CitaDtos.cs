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

public record FranjaDisponibleDto(DateTime Fecha, TimeSpan HoraInicio, TimeSpan HoraFin);

// El paciente NO viaja en el body: se toma del token JWT (evita agendar a nombre de otro)
public record AgendarCitaRequest(
    string MedicoId,
    DateTime Fecha,
    TimeSpan HoraInicio
);
