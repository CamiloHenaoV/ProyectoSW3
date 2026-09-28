using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CitasMedicas.Api.Modules.Configuration.Domain;

// RF3: parametros de agendamiento autonomo por medico/terapista
public class ConfiguracionMedico
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonElement("_id")]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("MedicoId")]
    public string MedicoId { get; set; } = string.Empty;

    // Dias de la semana que atiende (0=Domingo .. 6=Sabado)
    [BsonElement("DiasAtencion")]
    public List<DayOfWeek> DiasAtencion { get; set; } = new();

    [BsonRepresentation(BsonType.String)]
    [BsonElement("HoraInicio")]
    public TimeSpan HoraInicio { get; set; }

    [BsonRepresentation(BsonType.String)]
    [BsonElement("HoraFin")]
    public TimeSpan HoraFin { get; set; }

    [BsonElement("IntervaloMinutos")]
    public int IntervaloMinutos { get; set; } = 30;

    // Ventana de tiempo (en semanas) hacia el futuro donde se habilitan citas
    [BsonElement("SemanasHabilitadas")]
    public int SemanasHabilitadas { get; set; } = 4;

    [BsonElement("FechaActualizacion")]
    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;
}