using CitasMedicas.Api.Modules.Scheduling.Domain;
using CitasMedicas.Api.Shared.Infrastructure;

namespace CitasMedicas.Api.Modules.Scheduling.Infrastructure;

public interface IMedicoRepository : IRepository<Medico> { }

public class MedicoRepository : MongoRepository<Medico>, IMedicoRepository
{
    public MedicoRepository(IMongoContext context) : base(context, "medicos") { }
}