using CitasMedicas.Api.Modules.Patients.Application.Services;
using CitasMedicas.Api.Modules.Patients.Application.Dtos;
using CitasMedicas.Api.Modules.Patients.Application.Interfaces;
using CitasMedicas.Api.Modules.Patients.Domain;
using CitasMedicas.Api.Modules.Patients.Infrastructure;
using CitasMedicas.Api.Shared.Infrastructure;
using MongoDB.Driver;
using Xunit;

namespace CitasMedicas.Api.Tests;

public class PacienteServiceTests
{
    [Fact]
    public async Task BuscarPorDocumentoAsync_DevuelveSoloElResumenYLimitaResultados()
    {
        var repository = new FakePacienteRepository
        {
            Resultados =
            [
                new Paciente
                {
                    Id = "paciente-1",
                    Nombre = "Ana López",
                    DocumentoIdentidad = "1234567890",
                    Email = "ana@example.com",
                    PasswordHash = "no-debe-exponerse"
                }
            ]
        };
        var service = CrearServicio(repository);

        var resultados = await service.BuscarPorDocumentoAsync(" 123 ", 100);

        var paciente = Assert.Single(resultados);
        Assert.Equal("paciente-1", paciente.Id);
        Assert.Equal("Ana López", paciente.Nombre);
        Assert.Equal("1234567890", paciente.DocumentoIdentidad);
        Assert.Equal("123", repository.PrefijoBuscado);
        Assert.Equal(20, repository.LimiteSolicitado);
    }

    [Theory]
    [InlineData("")]
    [InlineData("12")]
    [InlineData("12*")]
    public async Task BuscarPorDocumentoAsync_RechazaPrefijosInvalidos(string prefijo)
    {
        var service = CrearServicio(new FakePacienteRepository());

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.BuscarPorDocumentoAsync(prefijo, 8));
    }

    [Fact]
    public async Task ResolverIdentidadKeycloakAsync_VinculaPacienteExistenteConSubject()
    {
        var paciente = new Paciente
        {
            Id = "paciente-1",
            Nombre = "Ana López",
            DocumentoIdentidad = "1234567890"
        };
        var repository = new FakePacienteRepository { PacientePorDocumento = paciente };
        var service = CrearServicio(repository);

        var resultado = await service.ResolverIdentidadKeycloakAsync("1234567890", "keycloak-subject");

        Assert.NotNull(resultado);
        Assert.Equal(paciente.Id, resultado.Id);
        Assert.Equal("keycloak-subject", paciente.KeycloakSubjectId);
    }

    [Fact]
    public async Task ResolverIdentidadKeycloakAsync_RechazaCuentasSinPacienteVinculado()
    {
        var service = CrearServicio(new FakePacienteRepository());

        var resultado = await service.ResolverIdentidadKeycloakAsync("1234567890", "keycloak-subject");

        Assert.Null(resultado);
    }

    [Fact]
    public async Task RegistrarAsync_CreaPacienteYUsuarioConRolEnKeycloak()
    {
        var repository = new FakePacienteRepository();
        var provisioner = new FakeKeycloakPacienteProvisioner();
        var service = CrearServicio(repository, provisioner);

        var paciente = await service.RegistrarAsync(new RegistroPacienteRequest(
            "José Pérez",
            "1234567890",
            "3001234567",
            "jose@gmail.com",
            "ClaveTest987"));

        Assert.Equal("jose@gmail.com", paciente.Email);
        Assert.Equal("keycloak-subject", repository.Registros.Single().KeycloakSubjectId);
        Assert.Equal("1234567890", provisioner.DocumentoCreado);
        Assert.Equal("ClaveTest987", provisioner.PasswordEnviada);
    }

    [Fact]
    public async Task RegistrarAsync_ReintentaRegistroMongoIncompletoConMismaClave()
    {
        var pacienteExistente = new Paciente
        {
            Id = "paciente-huerfano",
            Nombre = "José Pérez",
            DocumentoIdentidad = "1234567890",
            Email = "jose@gmail.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("ClaveTest987")
        };
        var repository = new FakePacienteRepository { Registros = [pacienteExistente] };
        var provisioner = new FakeKeycloakPacienteProvisioner();
        var service = CrearServicio(repository, provisioner);

        var paciente = await service.RegistrarAsync(new RegistroPacienteRequest(
            "José Pérez",
            "1234567890",
            "3001234567",
            "jose@gmail.com",
            "ClaveTest987"));

        Assert.Equal("paciente-huerfano", paciente.Id);
        Assert.Equal("keycloak-subject", pacienteExistente.KeycloakSubjectId);
        Assert.Single(repository.Registros);
    }

    [Fact]
    public async Task RegistrarAsync_RechazaReintentoConClaveIncorrecta()
    {
        var repository = new FakePacienteRepository
        {
            Registros =
            [
                new Paciente
                {
                    Id = "paciente-huerfano",
                    Nombre = "José Pérez",
                    DocumentoIdentidad = "1234567890",
                    Email = "jose@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("ClaveTest987")
                }
            ]
        };
        var service = CrearServicio(repository);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.RegistrarAsync(new RegistroPacienteRequest(
                "José Pérez",
                "1234567890",
                "3001234567",
                "jose@gmail.com",
                "otra123clave")));
    }

    private static PacienteService CrearServicio(
        FakePacienteRepository repository,
        FakeKeycloakPacienteProvisioner? provisioner = null)
        => new(repository, provisioner ?? new FakeKeycloakPacienteProvisioner(),
            Microsoft.Extensions.Logging.Abstractions.NullLogger<PacienteService>.Instance);

    private sealed class FakePacienteRepository : IPacienteRepository
    {
        public List<Paciente> Registros { get; set; } = [];
        public List<Paciente> Resultados { get; init; } = [];
        public Paciente? PacientePorDocumento { get; init; }
        public string? PrefijoBuscado { get; private set; }
        public int LimiteSolicitado { get; private set; }

        public Task<List<Paciente>> BuscarPorDocumentoAsync(string prefijo, int limite)
        {
            PrefijoBuscado = prefijo;
            LimiteSolicitado = limite;
            return Task.FromResult(Resultados);
        }

        public Task<List<Paciente>> GetAllAsync(FilterDefinition<Paciente>? filter = null) => Task.FromResult(Resultados.Concat(Registros).ToList());
        public Task<Paciente?> GetByIdAsync(string id) => Task.FromResult(Registros.Concat(Resultados).FirstOrDefault(p => p.Id == id));
        public Task<Paciente?> FindOneAsync(FilterDefinition<Paciente> filter) => Task.FromResult(Registros.FirstOrDefault());
        public Task<Paciente?> BuscarPorEmailAsync(string email)
            => Task.FromResult(Registros.FirstOrDefault(p => p.Email == email));
        public Task<Paciente?> BuscarPorDocumentoExactoAsync(string documento)
            => Task.FromResult((PacientePorDocumento?.DocumentoIdentidad == documento ? PacientePorDocumento : null) ??
                Registros.Concat(Resultados).FirstOrDefault(p => p.DocumentoIdentidad == documento));
        public Task<Paciente?> BuscarPorSubjectKeycloakAsync(string subjectId)
            => Task.FromResult(Registros.Concat(Resultados).Concat(PacientePorDocumento is null ? [] : [PacientePorDocumento])
                .FirstOrDefault(p => p.KeycloakSubjectId == subjectId));
        public Task<bool> VincularIdentidadKeycloakAsync(string pacienteId, string subjectId)
        {
            var paciente = Registros.Concat(PacientePorDocumento is null ? [] : [PacientePorDocumento])
                .FirstOrDefault(p => p.Id == pacienteId);
            if (paciente is null ||
                (paciente.KeycloakSubjectId is not null && paciente.KeycloakSubjectId != subjectId))
                return Task.FromResult(false);

            paciente.KeycloakSubjectId = subjectId;
            return Task.FromResult(true);
        }
        public Task CreateAsync(Paciente entity)
        {
            Registros.Add(entity);
            return Task.CompletedTask;
        }
        public Task<bool> UpdateAsync(string id, Paciente entity) => Task.FromResult(false);
        public Task<bool> DeleteAsync(string id) => Task.FromResult(false);
    }

    private sealed class FakeKeycloakPacienteProvisioner : IKeycloakPacienteProvisioner
    {
        public string? DocumentoCreado { get; private set; }
        public string? PasswordEnviada { get; private set; }

        public Task<string> CrearUsuarioAsync(
            string email,
            string nombre,
            string documento,
            string password,
            CancellationToken cancellationToken = default)
        {
            DocumentoCreado = documento;
            PasswordEnviada = password;
            return Task.FromResult("keycloak-subject");
        }

        public Task EliminarUsuarioAsync(string subjectId, CancellationToken cancellationToken = default)
            => Task.CompletedTask;
    }
}
