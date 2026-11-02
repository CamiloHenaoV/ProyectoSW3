using System.Security.Claims;
using CitasMedicas.Api.Modules.Scheduling.Api;
using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;
using CitasMedicas.Api.Modules.Patients.Application.Dtos;
using CitasMedicas.Api.Modules.Patients.Application.Interfaces;
using CitasMedicas.Api.Shared.Security;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace CitasMedicas.Api.Tests;

public class CitasControllerTests
{
    [Fact]
    public async Task ListarPorMedicoYFecha_BloqueaAgendaDeOtroMedico()
    {
        var servicio = new FakeCitaService();
        var controller = CrearController(servicio, new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.Role, Roles.Medico),
            new Claim("medico_id", "medico-propio")
        ], "test")));

        var resultado = await controller.ListarPorMedicoYFecha("medico-ajeno", DateTime.Today);

        Assert.IsType<ForbidResult>(resultado);
        Assert.False(servicio.ListadoInvocado);
    }

    [Fact]
    public async Task ListarPorMedicoYFecha_PermiteAgendaPropia()
    {
        var servicio = new FakeCitaService();
        var controller = CrearController(servicio, new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.Role, Roles.Terapista),
            new Claim("medico_id", "medico-propio")
        ], "test")));

        var resultado = await controller.ListarPorMedicoYFecha("medico-propio", DateTime.Today);

        Assert.IsType<OkObjectResult>(resultado);
        Assert.True(servicio.ListadoInvocado);
    }

    private static CitasController CrearController(ICitaService servicio, ClaimsPrincipal usuario)
    {
        var controller = new CitasController(servicio, new FakePacienteService())
        {
            ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = usuario }
            }
        };
        return controller;
    }

    private sealed class FakeCitaService : ICitaService
    {
        public bool ListadoInvocado { get; private set; }

        public Task<List<CitaListadoDto>> ListarPorMedicoYFechaAsync(string medicoId, DateTime fecha)
        {
            ListadoInvocado = true;
            return Task.FromResult(new List<CitaListadoDto>());
        }

        public Task<List<CitaListadoDto>> ListarPorPacienteAsync(string pacienteId, string? identidadExternaId = null)
            => Task.FromResult(new List<CitaListadoDto>());

        public Task<List<CitaListadoDto>?> ListarPorDocumentoAsync(string documento)
            => Task.FromResult<List<CitaListadoDto>?>(new List<CitaListadoDto>());

        public Task<List<FranjaDisponibleDto>> ObtenerFranjasDisponiblesAsync(string medicoId, DateTime fecha)
            => Task.FromResult(new List<FranjaDisponibleDto>());

        public Task<CitaListadoDto> AgendarAsync(string pacienteId, AgendarCitaRequest request)
            => Task.FromResult(new CitaListadoDto(
                "cita-test",
                "medico-test",
                "Médico de prueba",
                DateTime.MinValue,
                TimeSpan.Zero,
                TimeSpan.Zero,
                "Agendada",
                pacienteId));

        public Task<bool> CancelarAsync(string citaId, string? pacienteId, string? identidadExternaId = null)
            => Task.FromResult(false);

        public Task<bool> EliminarAsync(string citaId)
            => Task.FromResult(false);

        public Task<CitaListadoDto?> ReagendarAsync(
            string citaId,
            string pacienteId,
            ReagendarCitaRequest request,
            string? identidadExternaId = null)
            => Task.FromResult<CitaListadoDto?>(null);
    }

    private sealed class FakePacienteService : IPacienteService
    {
        public Task<PacienteDto> RegistrarAsync(RegistroPacienteRequest request)
            => Task.FromResult(new PacienteDto("", "", "", "", ""));

        public Task<PacienteDto?> ObtenerPorIdAsync(string id)
            => Task.FromResult<PacienteDto?>(null);

        public Task<PacienteDto?> ResolverIdentidadKeycloakAsync(string documento, string subjectId)
            => Task.FromResult<PacienteDto?>(null);

        public Task<List<PacienteResumenDto>> BuscarPorDocumentoAsync(string prefijo, int limite)
            => Task.FromResult(new List<PacienteResumenDto>());
    }
}
