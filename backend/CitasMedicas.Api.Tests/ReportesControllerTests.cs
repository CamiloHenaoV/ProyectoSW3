using System.Reflection;
using CitasMedicas.Api.Modules.Scheduling.Api;
using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;
using CitasMedicas.Api.Shared.Security;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace CitasMedicas.Api.Tests;

/// <summary>RF7: contrato HTTP y autorización del reporte de citas por mes.</summary>
public class ReportesControllerTests
{
    [Fact]
    public void Controlador_SoloPermiteMedicoTerapistaYAdministrador()
    {
        var atributo = typeof(ReportesController).GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(atributo);
        var roles = atributo!.Roles!.Split(',');
        Assert.Contains(Roles.Medico, roles);
        Assert.Contains(Roles.Terapista, roles);
        Assert.Contains(Roles.Administrador, roles);
        Assert.DoesNotContain(Roles.Paciente, roles);
    }

    [Fact]
    public async Task CitasPorMes_UsaElAnioActualSiNoSeEnvia()
    {
        var servicio = new FakeReporteService();
        var controller = new ReportesController(servicio);

        var resultado = await controller.CitasPorMes(anio: null);

        Assert.IsType<OkObjectResult>(resultado);
        Assert.Equal(DateTime.UtcNow.Year, servicio.AnioRecibido);
        Assert.False(servicio.IncluirCanceladasRecibido);
    }

    [Fact]
    public async Task CitasPorMes_RechazaMedicoConFormatoInvalido()
    {
        var servicio = new FakeReporteService();
        var controller = new ReportesController(servicio);

        var resultado = await controller.CitasPorMes(2026, medicoId: "no-es-un-id");

        Assert.IsType<BadRequestObjectResult>(resultado);
        Assert.Null(servicio.AnioRecibido);
    }

    [Fact]
    public async Task CitasPorMes_Devuelve400SiElAnioNoEsValido()
    {
        var controller = new ReportesController(new FakeReporteService { LanzarArgumento = true });

        var resultado = await controller.CitasPorMes(1500);

        Assert.IsType<BadRequestObjectResult>(resultado);
    }

    [Fact]
    public async Task CitasPorMes_Devuelve404SiElMedicoNoExiste()
    {
        var controller = new ReportesController(new FakeReporteService { DevolverNull = true });

        var resultado = await controller.CitasPorMes(2026, medicoId: "650000000000000000000099");

        Assert.IsType<NotFoundObjectResult>(resultado);
    }

    private sealed class FakeReporteService : IReporteCitasService
    {
        public bool LanzarArgumento { get; init; }
        public bool DevolverNull { get; init; }
        public int? AnioRecibido { get; private set; }
        public bool? IncluirCanceladasRecibido { get; private set; }

        public Task<ReporteCitasMensualDto?> CitasPorMesAsync(int anio, bool incluirCanceladas, string? medicoId = null)
        {
            AnioRecibido = anio;
            IncluirCanceladasRecibido = incluirCanceladas;
            if (LanzarArgumento)
                throw new ArgumentException("El año debe estar entre 2000 y 2027.");
            if (DevolverNull)
                return Task.FromResult<ReporteCitasMensualDto?>(null);

            return Task.FromResult<ReporteCitasMensualDto?>(new ReporteCitasMensualDto(
                anio, incluirCanceladas, Array.Empty<SerieCitasMedicoDto>(), new int[12], 0));
        }
    }
}
