using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CitasMedicas.Api.Modules.Scheduling.Domain;

public enum EstadoCita { Disponible, Agendada, Cancelada, Atendida }

public class Cita
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonElement("_id")]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("MedicoId")]
    public string MedicoId { get; set; } = string.Empty;

    [BsonElement("Fecha")]
    public DateTime Fecha { get; set; }

    [BsonRepresentation(BsonType.String)]
    [BsonElement("HoraInicio")]
    public TimeSpan HoraInicio { get; set; }

    [BsonRepresentation(BsonType.String)]
    [BsonElement("HoraFin")]
    public TimeSpan HoraFin { get; set; }

    [BsonElement("Estado")]
    public EstadoCita Estado { get; set; } = EstadoCita.Disponible;

    [BsonElement("PacienteId")]
    public string? PacienteId { get; set; }

    [BsonElement("FechaCreacion")]
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;
}