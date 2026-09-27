using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CitasMedicas.Api.Modules.Scheduling.Domain;

public enum EstadoCita { Disponible, Agendada, Cancelada, Atendida }

public class Cita
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string MedicoId { get; set; } = string.Empty;
    public DateTime Fecha { get; set; }

    [BsonRepresentation(BsonType.String)]
    public TimeSpan HoraInicio { get; set; }

    [BsonRepresentation(BsonType.String)]
    public TimeSpan HoraFin { get; set; }

    public EstadoCita Estado { get; set; } = EstadoCita.Disponible;
    public string? PacienteId { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}