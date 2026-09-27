using CitasMedicas.Api.Modules.Configuration.Domain;
using CitasMedicas.Api.Shared.Infrastructure;

namespace CitasMedicas.Api.Modules.Configuration.Infrastructure;

public interface IConfiguracionMedicoRepository : IRepository<ConfiguracionMedico> { }

public class ConfiguracionMedicoRepository : MongoRepository<ConfiguracionMedico>, IConfiguracionMedicoRepository
{
    public ConfiguracionMedicoRepository(IMongoContext context) : base(context, "configuraciones_medico") { }
}