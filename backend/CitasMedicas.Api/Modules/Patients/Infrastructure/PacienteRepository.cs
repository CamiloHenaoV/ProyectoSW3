using CitasMedicas.Api.Modules.Patients.Domain;
using CitasMedicas.Api.Shared.Infrastructure;
using MongoDB.Driver;
using System.Text.RegularExpressions;

namespace CitasMedicas.Api.Modules.Patients.Infrastructure;

public interface IPacienteRepository : IRepository<Paciente>
{
    Task<List<Paciente>> BuscarPorDocumentoAsync(string prefijo, int limite);
    Task<Paciente?> BuscarPorEmailAsync(string email);
    Task<Paciente?> BuscarPorDocumentoExactoAsync(string documento);
    Task<Paciente?> BuscarPorSubjectKeycloakAsync(string subjectId);
    Task<bool> VincularIdentidadKeycloakAsync(string pacienteId, string subjectId);
}

public class PacienteRepository : MongoRepository<Paciente>, IPacienteRepository
{
    public PacienteRepository(IMongoContext context) : base(context, "pacientes") { }

    public Task<List<Paciente>> BuscarPorDocumentoAsync(string prefijo, int limite)
    {
        var regex = new MongoDB.Bson.BsonRegularExpression($"^{Regex.Escape(prefijo)}");
        var filtro = Builders<Paciente>.Filter.Regex(p => p.DocumentoIdentidad, regex);
        return Collection.Find(filtro)
            .SortBy(p => p.DocumentoIdentidad)
            .Limit(limite)
            .ToListAsync();
    }

    public async Task<Paciente?> BuscarPorEmailAsync(string email)
        => await Collection.Find(Builders<Paciente>.Filter.Eq(p => p.Email, email))
            .FirstOrDefaultAsync();

    public async Task<Paciente?> BuscarPorDocumentoExactoAsync(string documento)
        => await Collection.Find(Builders<Paciente>.Filter.Eq(p => p.DocumentoIdentidad, documento))
            .FirstOrDefaultAsync();

    public async Task<Paciente?> BuscarPorSubjectKeycloakAsync(string subjectId)
        => await Collection.Find(Builders<Paciente>.Filter.Eq(p => p.KeycloakSubjectId, subjectId))
            .FirstOrDefaultAsync();

    public async Task<bool> VincularIdentidadKeycloakAsync(string pacienteId, string subjectId)
    {
        var filtro = Builders<Paciente>.Filter.And(
            Builders<Paciente>.Filter.Eq(p => p.Id, pacienteId),
            Builders<Paciente>.Filter.Or(
                Builders<Paciente>.Filter.Eq(p => p.KeycloakSubjectId, subjectId),
                Builders<Paciente>.Filter.Exists(p => p.KeycloakSubjectId, false),
                Builders<Paciente>.Filter.Eq(p => p.KeycloakSubjectId, null),
                Builders<Paciente>.Filter.Eq(p => p.KeycloakSubjectId, string.Empty)));
        var actualizacion = Builders<Paciente>.Update.Set(p => p.KeycloakSubjectId, subjectId);
        var resultado = await Collection.UpdateOneAsync(filtro, actualizacion);
        return resultado.MatchedCount > 0;
    }
}