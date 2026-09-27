using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace CitasMedicas.Api.Modules.Patients.Domain;

public class Paciente
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    public string Nombre { get; set; } = string.Empty;
    public string DocumentoIdentidad { get; set; } = string.Empty;
    public string Telefono { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
}