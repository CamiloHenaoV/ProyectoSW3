using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CitasMedicas.Api.Modules.Scheduling.Domain;

public class Medico
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonElement("_id")]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("Nombre")]
    public string Nombre { get; set; } = string.Empty;

    [BsonElement("Especialidad")]
    public string Especialidad { get; set; } = string.Empty; // ej: Medicina General, Terapia Fisica
}