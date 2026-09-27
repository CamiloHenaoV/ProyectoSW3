using CitasMedicas.Api.Modules.Patients.Application.Interfaces;
using CitasMedicas.Api.Modules.Patients.Application.Services;
using CitasMedicas.Api.Modules.Patients.Infrastructure;

namespace CitasMedicas.Api.Modules.Patients;

public static class PatientsModule
{
    public static IServiceCollection AddPatientsModule(this IServiceCollection services)
    {
        services.AddScoped<IPacienteRepository, PacienteRepository>();
        services.AddScoped<IPacienteService, PacienteService>();
        return services;
    }
}