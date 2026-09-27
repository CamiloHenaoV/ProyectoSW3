using CitasMedicas.Api.Modules.Scheduling.Domain;
using CitasMedicas.Api.Shared.Infrastructure;

namespace CitasMedicas.Api.Modules.Scheduling.Infrastructure;

public interface ICitaRepository : IRepository<Cita> { }

public class CitaRepository : MongoRepository<Cita>, ICitaRepository
{
    public CitaRepository(IMongoContext context) : base(context, "citas") { }
}