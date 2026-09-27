using CitasMedicas.Api.Modules.Patients.Domain;
using CitasMedicas.Api.Shared.Infrastructure;

namespace CitasMedicas.Api.Modules.Patients.Infrastructure;

public interface IPacienteRepository : IRepository<Paciente> { }

public class PacienteRepository : MongoRepository<Paciente>, IPacienteRepository
{
    public PacienteRepository(IMongoContext context) : base(context, "pacientes") { }
}