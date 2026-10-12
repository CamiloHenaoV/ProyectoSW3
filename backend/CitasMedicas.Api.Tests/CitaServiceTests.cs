using CitasMedicas.Api.Modules.Configuration.Application.Dtos;
using CitasMedicas.Api.Modules.Configuration.Application.Interfaces;
using CitasMedicas.Api.Modules.Patients.Domain;
using CitasMedicas.Api.Modules.Patients.Infrastructure;
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

    [Fact]
    public async Task AgendarAsync_RechazaMedicoInactivo()
    {
        var medicoId = "67f0d2e8b1d3a2d1f2b7b9f2";
        var citaFecha = DateTime.UtcNow.AddDays(1).Date;
        var medicoRepository = new FakeMedicoRepository(new Medico
        {
            Id = medicoId,
            Nombre = "Dra. Gómez",
            Especialidad = "Cardiología",
            Activo = false
        });
        var configService = new FakeConfiguracionService(new ConfiguracionMedicoDto(
            "cfg-1",
            medicoId,
            new List<DayOfWeek> { citaFecha.DayOfWeek },
            new TimeSpan(9, 0, 0),
            new TimeSpan(10, 0, 0),
            60,
            2));
        var service = new CitaService(
            new FakeCitaRepository(),
            medicoRepository,
            configService,
            new FranjasFijasStrategy());

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.AgendarAsync("paciente-1", new AgendarCitaRequest(medicoId, citaFecha, new TimeSpan(9, 0, 0))));

        Assert.Contains("inactivo", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task ObtenerFranjasDisponiblesAsync_NoDevuelveFranjasParaMedicoInactivo()
    {
        var medicoId = "67f0d2e8b1d3a2d1f2b7b9f2";
        var configService = new FakeConfiguracionService(new ConfiguracionMedicoDto(
            "cfg-1",
            medicoId,
            new List<DayOfWeek> { DateTime.UtcNow.AddDays(1).DayOfWeek },
            new TimeSpan(9, 0, 0),
            new TimeSpan(10, 0, 0),
            60,
            2));
        var service = new CitaService(
            new FakeCitaRepository(),
            new FakeMedicoRepository(new Medico { Id = medicoId, Activo = false }),
            configService,
            new FranjasFijasStrategy());

        var franjas = await service.ObtenerFranjasDisponiblesAsync(medicoId, DateTime.UtcNow.AddDays(1));

        Assert.Empty(franjas);
    }

    [Fact]
    public async Task ListarPorMedicoYFechaAsync_DevuelveNombreDelPacienteEnLugarDeLaId()
    {
        var medicoId = "67f0d2e8b1d3a2d1f2b7b9f1";
        var pacienteId = "paciente-123";
        var citaFecha = DateTime.UtcNow.AddDays(1).Date;
        var citaRepository = new FakeCitaRepository(new Cita
        {
            Id = "cita-1",
            MedicoId = medicoId,
            Fecha = citaFecha,
            HoraInicio = new TimeSpan(9, 0, 0),
            HoraFin = new TimeSpan(10, 0, 0),
            Estado = EstadoCita.Agendada,
            PacienteId = pacienteId
        });
        var medicoRepository = new FakeMedicoRepository(new Medico { Id = medicoId, Nombre = "Dra. Gómez", Especialidad = "Cardiología" });
        var pacienteRepository = new FakePacienteRepository(new Paciente { Id = pacienteId, Nombre = "Ana López", Email = "ana@test.com" });
        var configService = new FakeConfiguracionService(new ConfiguracionMedicoDto(
            "cfg-1",
            medicoId,
            new List<DayOfWeek> { citaFecha.DayOfWeek },
            new TimeSpan(9, 0, 0),
            new TimeSpan(10, 0, 0),
            60,
            2));
        var service = new CitaService(citaRepository, medicoRepository, pacienteRepository, configService, new FranjasFijasStrategy());

        var citas = await service.ListarPorMedicoYFechaAsync(medicoId, citaFecha);

        Assert.Equal("Ana López", citas[0].PacienteNombre);
        Assert.Equal(pacienteId, citas[0].PacienteId);
    }

    [Fact]
    public async Task ListarPorPacienteAsync_DevuelveNombreDelMedico()
    {
        const string pacienteId = "paciente-123";
        const string medicoId = "medico-123";
        var citaRepository = new FakeCitaRepository(new Cita
        {
            Id = "cita-1",
            MedicoId = medicoId,
            Estado = EstadoCita.Agendada,
            PacienteId = pacienteId
        });
        var medicoRepository = new FakeMedicoRepository(new Medico
        {
            Id = medicoId,
            Nombre = "Dra. Gómez",
            Especialidad = "Cardiología"
        });
        var service = new CitaService(
            citaRepository,
            medicoRepository,
            new FakeConfiguracionService(new ConfiguracionMedicoDto(
                "cfg-1", medicoId, new List<DayOfWeek> { DayOfWeek.Monday },
                new TimeSpan(9, 0, 0), new TimeSpan(10, 0, 0), 60, 2)),
            new FranjasFijasStrategy());

        var citas = await service.ListarPorPacienteAsync(pacienteId);

        Assert.Single(citas);
        Assert.Equal("Dra. Gómez", citas[0].NombreMedico);
    }

    [Fact]
    public async Task CancelarAsync_CambiaEstadoDeLaCitaPropia()
    {
        var cita = new Cita
        {
            Id = "cita-1",
            Estado = EstadoCita.Agendada,
            PacienteId = "paciente-1"
        };
        var service = CrearServicio(new FakeCitaRepository(cita));

        var resultado = await service.CancelarAsync(cita.Id, "paciente-1");

        Assert.True(resultado);
        Assert.Equal(EstadoCita.Cancelada, cita.Estado);
    }

    [Fact]
    public async Task CancelarAsync_RechazaCitaDeOtroPaciente()
    {
        var cita = new Cita { Id = "cita-1", Estado = EstadoCita.Agendada, PacienteId = "paciente-2" };
        var service = CrearServicio(new FakeCitaRepository(cita));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.CancelarAsync(cita.Id, "paciente-1"));
    }

    [Fact]
    public async Task CancelarAsync_PersonalPuedeCancelarCitaDeOtroPaciente()
    {
        var cita = new Cita { Id = "cita-1", Estado = EstadoCita.Agendada, PacienteId = "paciente-2" };
        var service = CrearServicio(new FakeCitaRepository(cita));

        var resultado = await service.CancelarAsync(cita.Id, null);

        Assert.True(resultado);
        Assert.Equal(EstadoCita.Cancelada, cita.Estado);
    }

    [Theory]
    [InlineData(EstadoCita.Cancelada)]
    [InlineData(EstadoCita.Atendida)]
    public async Task CancelarAsync_RechazaCitasYaCanceladasOAtendidas(EstadoCita estado)
    {
        var cita = new Cita { Id = "cita-1", Estado = estado, PacienteId = "paciente-1" };
        var service = CrearServicio(new FakeCitaRepository(cita));

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CancelarAsync(cita.Id, "paciente-1"));
    }

    [Fact]
    public async Task ReagendarAsync_ActualizaFechaYHoraUsandoFranjaDisponible()
    {
        var nuevaFecha = DateTime.UtcNow.Date.AddDays(2);
        var cita = new Cita
        {
            Id = "cita-1",
            MedicoId = "medico-1",
            Fecha = DateTime.UtcNow.Date.AddDays(1),
            HoraInicio = new TimeSpan(9, 0, 0),
            HoraFin = new TimeSpan(10, 0, 0),
            Estado = EstadoCita.Agendada,
            PacienteId = "paciente-1"
        };
        var service = new CitaService(
            new FakeCitaRepository(cita),
            new FakeMedicoRepository(new Medico { Id = "medico-1", Nombre = "Dra. Gómez" }),
            new FakeConfiguracionService(new ConfiguracionMedicoDto(
                "cfg-1", "medico-1", new List<DayOfWeek> { nuevaFecha.DayOfWeek },
                new TimeSpan(9, 0, 0), new TimeSpan(11, 0, 0), 60, 4)),
            new FranjasFijasStrategy());

        var resultado = await service.ReagendarAsync(
            cita.Id,
            "paciente-1",
            new ReagendarCitaRequest(nuevaFecha, new TimeSpan(10, 0, 0)));

        Assert.NotNull(resultado);
        Assert.Equal(nuevaFecha, cita.Fecha);
        Assert.Equal(new TimeSpan(10, 0, 0), cita.HoraInicio);
        Assert.Equal(new TimeSpan(11, 0, 0), cita.HoraFin);
    }

    [Fact]
    public async Task ReagendarAsync_RechazaCitaDeOtroPaciente()
    {
        var cita = new Cita { Id = "cita-1", Estado = EstadoCita.Agendada, PacienteId = "paciente-2" };
        var service = CrearServicio(new FakeCitaRepository(cita));

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.ReagendarAsync(
                cita.Id,
                "paciente-1",
                new ReagendarCitaRequest(DateTime.UtcNow.Date.AddDays(2), new TimeSpan(9, 0, 0))));
    }

    [Fact]
    public async Task ReagendarAsync_RechazaHorarioOcupado()
    {
        var nuevaFecha = DateTime.UtcNow.Date.AddDays(2);
        var cita = new Cita
        {
            Id = "cita-1",
            MedicoId = "medico-1",
            Fecha = DateTime.UtcNow.Date.AddDays(1),
            Estado = EstadoCita.Agendada,
            PacienteId = "paciente-1"
        };
        var citaOcupada = new Cita
        {
            Id = "cita-2",
            MedicoId = "medico-1",
            Fecha = nuevaFecha,
            HoraInicio = new TimeSpan(9, 0, 0),
            Estado = EstadoCita.Agendada,
            PacienteId = "paciente-2"
        };
        var service = new CitaService(
            new FakeCitaRepository(cita, citaOcupada),
            new FakeMedicoRepository(new Medico { Id = "medico-1" }),
            new FakeConfiguracionService(new ConfiguracionMedicoDto(
                "cfg-1", "medico-1", new List<DayOfWeek> { nuevaFecha.DayOfWeek },
                new TimeSpan(9, 0, 0), new TimeSpan(11, 0, 0), 60, 4)),
            new FranjasFijasStrategy());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.ReagendarAsync(
                cita.Id,
                "paciente-1",
                new ReagendarCitaRequest(nuevaFecha, new TimeSpan(9, 0, 0))));
    }

    [Fact]
    public async Task EliminarAsync_DevuelveFalseCuandoLaCitaNoExiste()
    {
        var service = CrearServicio(new FakeCitaRepository());

        var resultado = await service.EliminarAsync("cita-inexistente");

        Assert.False(resultado);
    }

    [Fact]
    public async Task EliminarAsync_EliminaLaCitaExistente()
    {
        var service = CrearServicio(new FakeCitaRepository(new Cita { Id = "cita-1" }));

        var resultado = await service.EliminarAsync("cita-1");

        Assert.True(resultado);
    }

    private static CitaService CrearServicio(FakeCitaRepository citaRepository)
        => new(
            citaRepository,
            new FakeMedicoRepository(),
            new FakeConfiguracionService(new ConfiguracionMedicoDto(
                "cfg-1", "medico-1", new List<DayOfWeek> { DayOfWeek.Monday },
                new TimeSpan(9, 0, 0), new TimeSpan(10, 0, 0), 60, 2)),
            new FranjasFijasStrategy());

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

        public Task<bool> UpdateAsync(string id, Cita entity)
        {
            var index = _citas.FindIndex(c => c.Id == id);
            if (index < 0)
                return Task.FromResult(false);

            _citas[index] = entity;
            return Task.FromResult(true);
        }

        public Task<bool> DeleteAsync(string id)
        {
            var cita = _citas.FirstOrDefault(c => c.Id == id);
            return Task.FromResult(cita is not null && _citas.Remove(cita));
        }
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
        public Task<List<ConfiguracionMedicoDto>> ListarAsync() => Task.FromResult(new List<ConfiguracionMedicoDto> { _config });
        public Task<ConfiguracionMedicoDto> GuardarAsync(GuardarConfiguracionRequest request) => Task.FromResult(_config);
        public Task<bool> EliminarAsync(string medicoId) => Task.FromResult(true);
    }

    private sealed class FakePacienteRepository : IPacienteRepository
    {
        private readonly Paciente? _paciente;

        public FakePacienteRepository(Paciente? paciente = null) => _paciente = paciente;

        public Task<List<Paciente>> GetAllAsync(FilterDefinition<Paciente>? filter = null) => Task.FromResult(_paciente is null ? new List<Paciente>() : new List<Paciente> { _paciente });
        public Task<Paciente?> GetByIdAsync(string id) => Task.FromResult(_paciente);
        public Task<Paciente?> FindOneAsync(FilterDefinition<Paciente> filter) => Task.FromResult(_paciente);
        public Task CreateAsync(Paciente entity) => Task.CompletedTask;
        public Task<bool> UpdateAsync(string id, Paciente entity) => Task.FromResult(true);
        public Task<bool> DeleteAsync(string id) => Task.FromResult(true);
    }
}
