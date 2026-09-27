using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CitasMedicas.Api.Modules.Scheduling.Domain;

public class Medico
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string Nombre { get; set; } = string.Empty;
    public string Especialidad { get; set; } = string.Empty; // ej: Medicina General, Terapia Fisica
}