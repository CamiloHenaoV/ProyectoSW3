using CitasMedicas.Api.Modules.Patients.Application.Dtos;
using CitasMedicas.Api.Modules.Patients.Application.Interfaces;
using CitasMedicas.Api.Modules.Patients.Application.Services;
using CitasMedicas.Api.Modules.Patients.Domain;
using CitasMedicas.Api.Modules.Patients.Infrastructure;
using CitasMedicas.Api.Shared.Infrastructure;
using CitasMedicas.Api.Shared.Security;
using MongoDB.Driver;
using Xunit;

namespace CitasMedicas.Api.Tests;

public class AuthServiceTests
{
    [Fact]
    public async Task LoginAsync_DevuelveTokenCuandoCredencialesSonValidas()
    {
        var repository = new FakePacienteRepository(new Paciente
        {
            Id = "67f0d2e8b1d3a2d1f2b7b9f1",
            Nombre = "Paciente Demo",
            Email = "paciente@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Paciente123"),
            Rol = Roles.Paciente
        });
        var tokenService = new FakeJwtTokenService();
        var service = new AuthService(repository, tokenService);

        var result = await service.LoginAsync(new LoginRequest("paciente@example.com", "Paciente123"));

        Assert.NotNull(result);
        Assert.Equal("Paciente", result!.Usuario.Rol);
        Assert.Equal("paciente@example.com", result.Usuario.Email);
        Assert.Equal("token-demo", result.Token);
    }

    [Fact]
    public async Task LoginAsync_DevuelveNullCuandoPasswordEsIncorrecta()
    {
        var repository = new FakePacienteRepository(new Paciente
        {
            Id = "67f0d2e8b1d3a2d1f2b7b9f2",
            Nombre = "Paciente Demo",
            Email = "paciente@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("OtraClave123"),
            Rol = Roles.Paciente
        });
        var tokenService = new FakeJwtTokenService();
        var service = new AuthService(repository, tokenService);

        var result = await service.LoginAsync(new LoginRequest("paciente@example.com", "Paciente123"));

        Assert.Null(result);
    }

    private sealed class FakePacienteRepository : IPacienteRepository
    {
        private readonly Paciente? _paciente;

        public FakePacienteRepository(Paciente? paciente) => _paciente = paciente;

        public Task<List<Paciente>> GetAllAsync(FilterDefinition<Paciente>? filter = null) => Task.FromResult(new List<Paciente>());
        public Task<Paciente?> GetByIdAsync(string id) => Task.FromResult(_paciente);
        public Task<Paciente?> FindOneAsync(FilterDefinition<Paciente> filter) => Task.FromResult(_paciente);
        public Task CreateAsync(Paciente entity) => Task.CompletedTask;
        public Task<bool> UpdateAsync(string id, Paciente entity) => Task.FromResult(true);
        public Task<bool> DeleteAsync(string id) => Task.FromResult(true);
    }

    private sealed class FakeJwtTokenService : IJwtTokenService
    {
        public (string Token, DateTime ExpiraEn) Generar(string usuarioId, string email, string nombre, string rol)
            => ("token-demo", DateTime.UtcNow.AddMinutes(60));
    }
}
