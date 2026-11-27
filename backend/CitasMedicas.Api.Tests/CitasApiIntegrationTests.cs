using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Encodings.Web;
using CitasMedicas.Api.Modules.Patients.Application.Dtos;
using CitasMedicas.Api.Modules.Patients.Application.Interfaces;
using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;
using CitasMedicas.Api.Shared.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Xunit;

namespace CitasMedicas.Api.Tests;

public sealed class CitasApiIntegrationTests : IClassFixture<CitasApiFactory>
{
    private readonly CitasApiFactory _factory;

    public CitasApiIntegrationTests(CitasApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Health_EsPublicoYDevuelveOk()
    {
        using var client = _factory.CreateClient();

        using var response = await client.GetAsync("/health");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ListarPorMedicoYFecha_RecorreApiAutorizacionYServicio()
    {
        using var client = _factory.CreateClient();
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            "/api/citas?medicoId=medico-1&fecha=2026-11-03");
        request.Headers.Add(IntegrationTestAuthHandler.RoleHeader, Roles.Agendador);

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var citas = await response.Content.ReadFromJsonAsync<List<CitaListadoDto>>();
        var cita = Assert.Single(citas!);
        Assert.Equal("cita-1", cita.Id);
        Assert.Equal("medico-1", _factory.CitaService.UltimoMedicoId);
        Assert.Equal(new DateTime(2026, 11, 3), _factory.CitaService.UltimaFecha?.Date);
    }

    [Fact]
    public async Task ListarPorMedicoYFecha_SinAutenticacionDevuelve401()
    {
        using var client = _factory.CreateClient();

        using var response = await client.GetAsync(
            "/api/citas?medicoId=medico-1&fecha=2026-11-03");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}

public sealed class CitasApiFactory : WebApplicationFactory<Program>
{
    private readonly string? _originalJwtKey;

    public RecordingCitaService CitaService { get; } = new();

    public CitasApiFactory()
    {
        _originalJwtKey = Environment.GetEnvironmentVariable("JwtSettings__Key");
        Environment.SetEnvironmentVariable(
            "JwtSettings__Key",
            "integration-test-key-with-at-least-32-characters");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureTestServices(services =>
        {
            services.RemoveAll<ICitaService>();
            services.AddSingleton<ICitaService>(CitaService);
            services.RemoveAll<IPacienteService>();
            services.AddSingleton<IPacienteService, FakePacienteService>();
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = IntegrationTestAuthHandler.SchemeName;
                options.DefaultChallengeScheme = IntegrationTestAuthHandler.SchemeName;
                options.DefaultScheme = IntegrationTestAuthHandler.SchemeName;
            }).AddScheme<AuthenticationSchemeOptions, IntegrationTestAuthHandler>(
                IntegrationTestAuthHandler.SchemeName,
                _ => { });
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing)
            Environment.SetEnvironmentVariable("JwtSettings__Key", _originalJwtKey);
    }
}

public sealed class RecordingCitaService : ICitaService
{
    public string? UltimoMedicoId { get; private set; }
    public DateTime? UltimaFecha { get; private set; }

    public Task<List<CitaListadoDto>> ListarPorMedicoYFechaAsync(string medicoId, DateTime fecha)
    {
        UltimoMedicoId = medicoId;
        UltimaFecha = fecha;
        return Task.FromResult(new List<CitaListadoDto>
        {
            new(
                "cita-1",
                medicoId,
                "Dra. Ana Restrepo",
                new DateTime(2026, 11, 3, 0, 0, 0, DateTimeKind.Utc),
                new TimeSpan(8, 0, 0),
                new TimeSpan(8, 30, 0),
                "Agendada",
                "paciente-1")
        });
    }

    public Task<List<CitaListadoDto>> ListarPorPacienteAsync(
        string pacienteId,
        string? identidadExternaId = null)
        => Task.FromResult(new List<CitaListadoDto>());

    public Task<List<CitaListadoDto>?> ListarPorDocumentoAsync(string documento)
        => Task.FromResult<List<CitaListadoDto>?>(null);

    public Task<List<FranjaDisponibleDto>> ObtenerFranjasDisponiblesAsync(string medicoId, DateTime fecha)
        => Task.FromResult(new List<FranjaDisponibleDto>());

    public Task<CitaListadoDto> AgendarAsync(string pacienteId, AgendarCitaRequest request)
        => throw new NotSupportedException();

    public Task<bool> CancelarAsync(
        string citaId,
        string? pacienteId,
        string? identidadExternaId = null,
        string? motivo = null)
        => throw new NotSupportedException();

    public Task<bool> EliminarAsync(string citaId)
        => throw new NotSupportedException();

    public Task<CitaListadoDto?> ReagendarAsync(
        string citaId,
        string pacienteId,
        ReagendarCitaRequest request,
        string? identidadExternaId = null)
        => throw new NotSupportedException();
}

public sealed class FakePacienteService : IPacienteService
{
    public Task<PacienteDto> RegistrarAsync(RegistroPacienteRequest request)
        => throw new NotSupportedException();

    public Task<PacienteDto?> ObtenerPorIdAsync(string id)
        => Task.FromResult<PacienteDto?>(null);

    public Task<PacienteDto?> ResolverIdentidadKeycloakAsync(string documento, string subjectId)
        => Task.FromResult<PacienteDto?>(null);

    public Task<List<PacienteResumenDto>> BuscarPorDocumentoAsync(string prefijo, int limite)
        => Task.FromResult(new List<PacienteResumenDto>());
}

public sealed class IntegrationTestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public const string SchemeName = "IntegrationTest";
    public const string RoleHeader = "X-Test-Role";

    public IntegrationTestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.TryGetValue(RoleHeader, out var roleHeader))
            return Task.FromResult(AuthenticateResult.NoResult());

        var claims = roleHeader
            .SelectMany(value => value?.Split(',', StringSplitOptions.RemoveEmptyEntries) ?? [])
            .Select(role => new Claim(ClaimTypes.Role, role.Trim()))
            .ToList();
        claims.Add(new Claim(ClaimTypes.NameIdentifier, "integration-user"));

        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, SchemeName));
        var ticket = new AuthenticationTicket(principal, SchemeName);
        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
