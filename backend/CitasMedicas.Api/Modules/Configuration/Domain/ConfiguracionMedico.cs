using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CitasMedicas.Api.Modules.Configuration.Domain;

// RF3: parametros de agendamiento autonomo por medico/terapista
public class ConfiguracionMedico
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string MedicoId { get; set; } = string.Empty;

    // Dias de la semana que atiende (0=Domingo .. 6=Sabado)
    public List<DayOfWeek> DiasAtencion { get; set; } = new();

    [BsonRepresentation(BsonType.String)]
    public TimeSpan HoraInicio { get; set; }

    [BsonRepresentation(BsonType.String)]
    public TimeSpan HoraFin { get; set; }

    public int IntervaloMinutos { get; set; } = 30;

    // Ventana de tiempo (en semanas) hacia el futuro donde se habilitan citas
    public int SemanasHabilitadas { get; set; } = 4;

    public DateTime FechaActualizacion { get; set; } = DateTime.UtcNow;
}