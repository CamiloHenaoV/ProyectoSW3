namespace CitasMedicas.Api.Modules.Scheduling.Application.Dtos;

public record AgendarCitaRequest(string MedicoId, DateTime Fecha, TimeSpan HoraInicio);

public record ReagendarCitaRequest(DateTime Fecha, TimeSpan HoraInicio);

public record CitaListadoDto(
    string Id,
    string MedicoId,
    string NombreMedico,
    DateTime Fecha,
    TimeSpan HoraInicio,
    TimeSpan HoraFin,
    string Estado,
    string? PacienteId,
    string? PacienteNombre = null);

public record FranjaDisponibleDto(DateTime Fecha, TimeSpan HoraInicio, TimeSpan HoraFin);
