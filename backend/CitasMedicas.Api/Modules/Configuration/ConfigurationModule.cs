using CitasMedicas.Api.Modules.Configuration.Application.Interfaces;
using CitasMedicas.Api.Modules.Configuration.Application.Services;
using CitasMedicas.Api.Modules.Configuration.Infrastructure;

namespace CitasMedicas.Api.Modules.Configuration;

public static class ConfigurationModule
{
    public static IServiceCollection AddConfigurationModule(this IServiceCollection services)
    {
        services.AddScoped<IConfiguracionMedicoRepository, ConfiguracionMedicoRepository>();
        services.AddScoped<IConfiguracionService, ConfiguracionService>();
        return services;
    }
}