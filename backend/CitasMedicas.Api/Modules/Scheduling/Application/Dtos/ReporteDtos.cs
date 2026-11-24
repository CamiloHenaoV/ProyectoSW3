namespace CitasMedicas.Api.Modules.Scheduling.Application.Dtos;

/// <summary>
/// RF7: cantidad de citas por mes y por médico/terapista en un año.
/// Cada arreglo mensual tiene siempre 12 posiciones (índice 0 = enero).
/// </summary>
public record ReporteCitasMensualDto(
    int Anio,
    bool IncluyeCanceladas,
    IReadOnlyList<SerieCitasMedicoDto> Medicos,
    IReadOnlyList<int> TotalesPorMes,
    int Total);

public record SerieCitasMedicoDto(
    string MedicoId,
    string NombreMedico,
    string Especialidad,
    IReadOnlyList<int> CitasPorMes,
    int Total);
