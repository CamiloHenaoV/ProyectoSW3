using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using CitasMedicas.Api.Shared.Security;

namespace CitasMedicas.Api.Modules.Patients.Domain;

public class Paciente
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    [BsonElement("_id")]
    public string Id { get; set; } = ObjectId.GenerateNewId().ToString();

    [BsonElement("Nombre")]
    public string Nombre { get; set; } = string.Empty;

    [BsonElement("DocumentoIdentidad")]
    public string DocumentoIdentidad { get; set; } = string.Empty;

    [BsonElement("Telefono")]
    public string Telefono { get; set; } = string.Empty;

    [BsonElement("Email")]
    public string Email { get; set; } = string.Empty;

    [BsonElement("PasswordHash")]
    public string PasswordHash { get; set; } = string.Empty;

    // Rol del usuario: Paciente (por defecto), Agendador o Administrador
    [BsonElement("Rol")]
    public string Rol { get; set; } = Roles.Paciente;

    [BsonElement("FechaRegistro")]
    public DateTime FechaRegistro { get; set; } = DateTime.UtcNow;
}
