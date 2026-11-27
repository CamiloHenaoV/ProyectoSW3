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

    [Fact]
    public async Task Cancelar_Paciente_EnviaElMotivoAlServicio()
    {
        var servicio = new FakeCitaService { CancelarResultado = true };
        var controller = CrearController(servicio, UsuarioPaciente(), new FakePacienteService(PacienteConocido));

        var resultado = await controller.Cancelar("cita-1", new CancelarCitaRequest("No puedo asistir"));

        Assert.IsType<NoContentResult>(resultado);
        Assert.Equal("cita-1", servicio.CitaCancelada);
        Assert.Equal("paciente-1", servicio.PacienteQueCancela);
        Assert.Equal("sub-1", servicio.IdentidadExternaRecibida);
        Assert.Equal("No puedo asistir", servicio.MotivoRecibido);
    }

    [Fact]
    public async Task Cancelar_Paciente_SinCuerpoLlegaAlServicioSinMotivo()
    {
        var servicio = new FakeCitaService { CancelarResultado = true };
        var controller = CrearController(servicio, UsuarioPaciente(), new FakePacienteService(PacienteConocido));

        await controller.Cancelar("cita-1", null);

        Assert.Null(servicio.MotivoRecibido);
    }

    [Fact]
    public async Task Cancelar_Personal_NoNecesitaCuerpoNiIdentidadDePaciente()
    {
        var servicio = new FakeCitaService { CancelarResultado = true };
        var controller = CrearController(servicio, new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.Role, Roles.Agendador)
        ], "test")));

        var resultado = await controller.Cancelar("cita-1");

        Assert.IsType<NoContentResult>(resultado);
        Assert.Null(servicio.PacienteQueCancela);
        Assert.Null(servicio.IdentidadExternaRecibida);
        Assert.Null(servicio.MotivoRecibido);
    }

    [Fact]
    public async Task Cancelar_CitaInexistente_Devuelve404()
    {
        var servicio = new FakeCitaService { CancelarResultado = false };
        var controller = CrearController(servicio, UsuarioPaciente(), new FakePacienteService(PacienteConocido));

        var resultado = await controller.Cancelar("no-existe", new CancelarCitaRequest("Motivo"));

        Assert.IsType<NotFoundResult>(resultado);
    }

    private static readonly PacienteDto PacienteConocido = new("paciente-1", "Paciente Uno", "123", "300", "p@example.com");

    private static ClaimsPrincipal UsuarioPaciente()
        => new(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.Role, Roles.Paciente),
            new Claim("sub", "sub-1"),
            new Claim("documento", "123")
        ], "test"));

    private static CitasController CrearController(
        ICitaService servicio,
        ClaimsPrincipal usuario,
        IPacienteService? pacientes = null)
    {
        var controller = new CitasController(servicio, pacientes ?? new FakePacienteService())
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
        public bool CancelarResultado { get; set; }
        public string? CitaCancelada { get; private set; }
        public string? PacienteQueCancela { get; private set; }
        public string? IdentidadExternaRecibida { get; private set; }
        public string? MotivoRecibido { get; private set; }

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

        public Task<bool> CancelarAsync(
            string citaId,
            string? pacienteId,
            string? identidadExternaId = null,
            string? motivo = null)
        {
            CitaCancelada = citaId;
            PacienteQueCancela = pacienteId;
            IdentidadExternaRecibida = identidadExternaId;
            MotivoRecibido = motivo;
            return Task.FromResult(CancelarResultado);
        }

        public Task<bool> EliminarAsync(string citaId)
            => Task.FromResult(false);

        public Task<CitaListadoDto?> ReagendarAsync(
            string citaId,
            string pacienteId,
            ReagendarCitaRequest request,
            string? identidadExternaId = null)
            => Task.FromResult<CitaListadoDto?>(null);
    }

    private sealed class FakePacienteService(PacienteDto? pacienteResuelto = null) : IPacienteService
    {
        public Task<PacienteDto> RegistrarAsync(RegistroPacienteRequest request)
            => Task.FromResult(new PacienteDto("", "", "", "", ""));

        public Task<PacienteDto?> ObtenerPorIdAsync(string id)
            => Task.FromResult<PacienteDto?>(null);

        public Task<PacienteDto?> ResolverIdentidadKeycloakAsync(string documento, string subjectId)
            => Task.FromResult(pacienteResuelto);

        public Task<List<PacienteResumenDto>> BuscarPorDocumentoAsync(string prefijo, int limite)
            => Task.FromResult(new List<PacienteResumenDto>());
    }
}
