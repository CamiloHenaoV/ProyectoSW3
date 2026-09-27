namespace CitasMedicas.Api.Modules.Configuration.Application.Dtos;

public record ConfiguracionMedicoDto(
    string Id,
    string MedicoId,
    List<DayOfWeek> DiasAtencion,
    TimeSpan HoraInicio,
    TimeSpan HoraFin,
    int IntervaloMinutos,
    int SemanasHabilitadas
);

public record GuardarConfiguracionRequest(
    string MedicoId,
    List<DayOfWeek> DiasAtencion,
    TimeSpan HoraInicio,
    TimeSpan HoraFin,
    int IntervaloMinutos,
    int SemanasHabilitadas
);