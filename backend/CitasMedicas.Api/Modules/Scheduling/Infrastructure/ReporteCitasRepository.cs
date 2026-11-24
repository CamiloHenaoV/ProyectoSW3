using CitasMedicas.Api.Modules.Scheduling.Domain;
using CitasMedicas.Api.Shared.Infrastructure;
using MongoDB.Bson;
using MongoDB.Driver;

namespace CitasMedicas.Api.Modules.Scheduling.Infrastructure;

/// <summary>
/// Consultas de solo lectura para reportes (RF7). Se separa de <see cref="ICitaRepository"/>
/// para no obligar a los repositorios de escritura (ni a sus dobles de prueba) a conocer
/// las agregaciones de reporte (principio de segregación de interfaces).
/// </summary>
public interface IReporteCitasRepository
{
    /// <summary>Cuenta las citas del año agrupadas por médico, mes (1-12) y estado.</summary>
    Task<List<ConteoCitasMes>> ContarPorMesAsync(int anio, string? medicoId = null);
}

public class ReporteCitasRepository : IReporteCitasRepository
{
    private readonly IMongoCollection<Cita> _citas;

    public ReporteCitasRepository(IMongoContext context)
    {
        _citas = context.GetCollection<Cita>("citas");
    }

    public async Task<List<ConteoCitasMes>> ContarPorMesAsync(int anio, string? medicoId = null)
    {
        var desde = new DateTime(anio, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var hasta = desde.AddYears(1);

        var filtro = Builders<Cita>.Filter.Gte(c => c.Fecha, desde) &
                     Builders<Cita>.Filter.Lt(c => c.Fecha, hasta);
        if (!string.IsNullOrWhiteSpace(medicoId))
            filtro &= Builders<Cita>.Filter.Eq(c => c.MedicoId, medicoId);

        // La agregación se hace en MongoDB: al API solo llegan, como máximo,
        // médicos × 12 meses × estados documentos, no todas las citas del año.
        var grupos = await _citas.Aggregate()
            .Match(filtro)
            .Group(new BsonDocument
            {
                {
                    "_id", new BsonDocument
                    {
                        { "medicoId", "$MedicoId" },
                        { "mes", new BsonDocument("$month", "$Fecha") },
                        { "estado", "$Estado" }
                    }
                },
                { "cantidad", new BsonDocument("$sum", 1) }
            })
            .ToListAsync();

        var conteos = new List<ConteoCitasMes>(grupos.Count);
        foreach (var grupo in grupos)
        {
            var clave = grupo["_id"].AsBsonDocument;
            if (!clave.TryGetValue("medicoId", out var medico) || !medico.IsString)
                continue;
            if (!TryLeerEstado(clave.GetValue("estado", BsonNull.Value), out var estado))
                continue;

            conteos.Add(new ConteoCitasMes(
                medico.AsString,
                clave["mes"].ToInt32(),
                estado,
                grupo["cantidad"].ToInt32()));
        }

        return conteos;
    }

    /// <summary>
    /// El estado puede venir como entero (serialización por defecto del enum en .NET)
    /// o como texto (citas creadas por los scripts de mongo-init).
    /// </summary>
    private static bool TryLeerEstado(BsonValue valor, out EstadoCita estado)
    {
        if (valor.IsInt32 && Enum.IsDefined(typeof(EstadoCita), valor.AsInt32))
        {
            estado = (EstadoCita)valor.AsInt32;
            return true;
        }

        if (valor.IsString && Enum.TryParse(valor.AsString, ignoreCase: true, out estado))
            return true;

        estado = default;
        return false;
    }
}
