using CitasMedicas.Api.Modules.Configuration.Application.Dtos;
using CitasMedicas.Api.Modules.Configuration.Application.Interfaces;
using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;
using CitasMedicas.Api.Modules.Scheduling.Application.Services;
using CitasMedicas.Api.Modules.Scheduling.Application.Strategies;
using CitasMedicas.Api.Modules.Scheduling.Domain;
using CitasMedicas.Api.Modules.Scheduling.Infrastructure;
using CitasMedicas.Api.Shared.Infrastructure;
using MongoDB.Driver;
using Xunit;

namespace CitasMedicas.Api.Tests;

public class CitaServiceTests
{
    [Fact]
    public async Task AgendarAsync_RecusaFechasPasadas()
    {
        var citaRepository = new FakeCitaRepository();
        var medicoRepository = new FakeMedicoRepository();
        var validMedicoId = "67f0d2e8b1d3a2d1f2b7b9f1";
        var configService = new FakeConfiguracionService(new ConfiguracionMedicoDto(
            "cfg-1",
            validMedicoId,
            new List<DayOfWeek> { DayOfWeek.Monday },
            new TimeSpan(9, 0, 0),
            new TimeSpan(10, 0, 0),
            60,
            2));
        var service = new CitaService(citaRepository, medicoRepository, configService, new FranjasFijasStrategy());

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AgendarAsync("paciente-1", new AgendarCitaRequest(validMedicoId, DateTime.UtcNow.AddDays(-1), new TimeSpan(9, 0, 0))));

        Assert.Contains("pasadas", ex.Message);
    }

    [Fact]
    public async Task AgendarAsync_RecusaHorarioNoDisponible()
    {
        var validMedicoId = "67f0d2e8b1d3a2d1f2b7b9f2";
        var citaFecha = DateTime.UtcNow.AddDays(1).Date;
        var citaRepository = new FakeCitaRepository(new Cita
        {
            Id = "cita-1",
            MedicoId = validMedicoId,
            Fecha = citaFecha,
            HoraInicio = new TimeSpan(9, 0, 0),
            HoraFin = new TimeSpan(10, 0, 0),
            Estado = EstadoCita.Agendada,
            PacienteId = "paciente-otro"
        });
        var medicoRepository = new FakeMedicoRepository(new Medico { Id = validMedicoId, Nombre = "Dra. Gómez", Especialidad = "Cardiología" });
        var configService = new FakeConfiguracionService(new ConfiguracionMedicoDto(
            "cfg-1",
            validMedicoId,
            new List<DayOfWeek> { citaFecha.DayOfWeek },
            new TimeSpan(9, 0, 0),
            new TimeSpan(10, 0, 0),
            60,
            2));
        var service = new CitaService(citaRepository, medicoRepository, configService, new FranjasFijasStrategy());

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AgendarAsync("paciente-1", new AgendarCitaRequest(validMedicoId, citaFecha, new TimeSpan(9, 0, 0))));

        Assert.Contains("disponible", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    private sealed class FakeCitaRepository : ICitaRepository
    {
        private readonly List<Cita> _citas;

        public FakeCitaRepository(params Cita[] citas) => _citas = citas.ToList();

        public Task<List<Cita>> GetAllAsync(FilterDefinition<Cita>? filter = null) => Task.FromResult(_citas.ToList());
        public Task<Cita?> GetByIdAsync(string id) => Task.FromResult(_citas.FirstOrDefault(c => c.Id == id));
        public Task<Cita?> FindOneAsync(FilterDefinition<Cita> filter) => Task.FromResult(_citas.FirstOrDefault());
        public Task CreateAsync(Cita entity)
        {
            _citas.Add(entity);
            return Task.CompletedTask;
        }

        public Task<bool> UpdateAsync(string id, Cita entity) => Task.FromResult(true);
        public Task<bool> DeleteAsync(string id) => Task.FromResult(true);
    }

    private sealed class FakeMedicoRepository : IMedicoRepository
    {
        private readonly Medico? _medico;

        public FakeMedicoRepository(Medico? medico = null) => _medico = medico;

        public Task<List<Medico>> GetAllAsync(FilterDefinition<Medico>? filter = null) => Task.FromResult(_medico is null ? new List<Medico>() : new List<Medico> { _medico });
        public Task<Medico?> GetByIdAsync(string id) => Task.FromResult(_medico);
        public Task<Medico?> FindOneAsync(FilterDefinition<Medico> filter) => Task.FromResult(_medico);
        public Task CreateAsync(Medico entity) => Task.CompletedTask;
        public Task<bool> UpdateAsync(string id, Medico entity) => Task.FromResult(true);
        public Task<bool> DeleteAsync(string id) => Task.FromResult(true);
    }

    private sealed class FakeConfiguracionService : IConfiguracionService
    {
        private readonly ConfiguracionMedicoDto _config;

        public FakeConfiguracionService(ConfiguracionMedicoDto config) => _config = config;

        public Task<ConfiguracionMedicoDto?> ObtenerPorMedicoAsync(string medicoId) => Task.FromResult<ConfiguracionMedicoDto?>(_config);
        public Task<ConfiguracionMedicoDto> GuardarAsync(GuardarConfiguracionRequest request) => Task.FromResult(_config);
    }
}
