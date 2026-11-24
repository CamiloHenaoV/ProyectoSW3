namespace CitasMedicas.Api.Modules.Scheduling.Domain;

/// <summary>
/// Modelo de lectura (RF7): cuántas citas tuvo un médico/terapista en un mes,
/// discriminado por estado. Lo produce la agregación de MongoDB, no se persiste.
/// </summary>
public record ConteoCitasMes(string MedicoId, int Mes, EstadoCita Estado, int Cantidad);
