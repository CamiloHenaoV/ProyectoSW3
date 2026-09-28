namespace CitasMedicas.Api.Modules.Scheduling.Application.Dtos;

public record AgendarCitaRequest(string MedicoId, DateTime Fecha, TimeSpan HoraInicio);

public record CitaListadoDto(
    string Id,
    string MedicoId,
    string NombreMedico,
    DateTime Fecha,
    TimeSpan HoraInicio,
    TimeSpan HoraFin,
    string Estado,
    string? PacienteId);

public record FranjaDisponibleDto(DateTime Fecha, TimeSpan HoraInicio, TimeSpan HoraFin);
