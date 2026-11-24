using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;
using CitasMedicas.Api.Modules.Scheduling.Application.Services;
using CitasMedicas.Api.Modules.Scheduling.Application.Strategies;
using CitasMedicas.Api.Modules.Scheduling.Infrastructure;

namespace CitasMedicas.Api.Modules.Scheduling;

public static class SchedulingModule
{
    public static IServiceCollection AddSchedulingModule(this IServiceCollection services)
    {
        services.AddScoped<IMedicoRepository, MedicoRepository>();
        services.AddScoped<IMedicoService, MedicoService>();

        services.AddScoped<ICitaRepository, CitaRepository>();
        services.AddScoped<ICitaService, CitaService>();

        services.AddScoped<IGeneradorFranjasStrategy, FranjasFijasStrategy>();

        // RF7: reporte de citas por mes y médico
        services.AddScoped<IReporteCitasRepository, ReporteCitasRepository>();
        services.AddScoped<IReporteCitasService, ReporteCitasService>();

        return services;
    }
}