using CitasMedicas.Api.Modules.Scheduling.Application.Services;
using CitasMedicas.Api.Modules.Scheduling.Domain;
using CitasMedicas.Api.Modules.Scheduling.Infrastructure;
using MongoDB.Driver;
using Xunit;

namespace CitasMedicas.Api.Tests;

/// <summary>RF7: reporte gráfico de cantidad de citas por mes y médico.</summary>
public class ReporteCitasServiceTests
{
    private const string MedicoA = "650000000000000000000001";
    private const string MedicoB = "650000000000000000000002";
    private const string MedicoInactivo = "650000000000000000000003";

    private static readonly int AnioActual = DateTime.UtcNow.Year;

    private static readonly Medico[] Medicos =
    {
        new() { Id = MedicoA, Nombre = "Dra. Ana Restrepo", Especialidad = "Medicina General" },
        new() { Id = MedicoB, Nombre = "Dr. Julián Torres", Especialidad = "Terapia Física" },
        new() { Id = MedicoInactivo, Nombre = "Dr. Mateo López", Especialidad = "Cardiología", Activo = false }
    };

    [Fact]
    public async Task CitasPorMes_AgrupaPorMesYMedicoYRellenaMesesSinCitas()
    {
        var repo = new FakeReporteRepository(
            new ConteoCitasMes(MedicoA, 1, EstadoCita.Atendida, 4),
            new ConteoCitasMes(MedicoA, 1, EstadoCita.Agendada, 2),
            new ConteoCitasMes(MedicoA, 3, EstadoCita.Atendida, 5),
            new ConteoCitasMes(MedicoB, 12, EstadoCita.Agendada, 7));
        var service = new ReporteCitasService(repo, new FakeMedicoRepository(Medicos));

        var reporte = await service.CitasPorMesAsync(AnioActual, incluirCanceladas: false);

        Assert.NotNull(reporte);
        Assert.Equal(AnioActual, repo.AnioConsultado);
        var ana = reporte!.Medicos.Single(m => m.MedicoId == MedicoA);
        Assert.Equal(12, ana.CitasPorMes.Count);
        Assert.Equal(6, ana.CitasPorMes[0]);   // enero: 4 atendidas + 2 agendadas
        Assert.Equal(0, ana.CitasPorMes[1]);   // febrero sin citas
        Assert.Equal(5, ana.CitasPorMes[2]);
        Assert.Equal(11, ana.Total);
        Assert.Equal(7, reporte.Medicos.Single(m => m.MedicoId == MedicoB).CitasPorMes[11]);
        Assert.Equal(6, reporte.TotalesPorMes[0]);
        Assert.Equal(18, reporte.Total);
    }

    [Fact]
    public async Task CitasPorMes_ExcluyeCanceladasSalvoQueSePidan()
    {
        var conteos = new[]
        {
            new ConteoCitasMes(MedicoA, 5, EstadoCita.Atendida, 3),
            new ConteoCitasMes(MedicoA, 5, EstadoCita.Cancelada, 2),
            new ConteoCitasMes(MedicoA, 5, EstadoCita.Disponible, 9)
        };
        var medicos = new FakeMedicoRepository(Medicos);

        var sinCanceladas = await new ReporteCitasService(new FakeReporteRepository(conteos), medicos)
            .CitasPorMesAsync(AnioActual, incluirCanceladas: false);
        var conCanceladas = await new ReporteCitasService(new FakeReporteRepository(conteos), medicos)
            .CitasPorMesAsync(AnioActual, incluirCanceladas: true);

        Assert.Equal(3, sinCanceladas!.Total);
        Assert.False(sinCanceladas.IncluyeCanceladas);
        Assert.Equal(5, conCanceladas!.Total); // "Disponible" nunca cuenta como cita
        Assert.True(conCanceladas.IncluyeCanceladas);
    }

    [Fact]
    public async Task CitasPorMes_IncluyeActivosSinCitasYOmiteInactivosSinCitas()
    {
        var service = new ReporteCitasService(
            new FakeReporteRepository(new ConteoCitasMes(MedicoA, 2, EstadoCita.Atendida, 1)),
            new FakeMedicoRepository(Medicos));

        var reporte = await service.CitasPorMesAsync(AnioActual, incluirCanceladas: false);

        var ids = reporte!.Medicos.Select(m => m.MedicoId).ToList();
        Assert.Contains(MedicoA, ids);
        Assert.Contains(MedicoB, ids);
        Assert.DoesNotContain(MedicoInactivo, ids);
        Assert.Equal(0, reporte.Medicos.Single(m => m.MedicoId == MedicoB).Total);
    }

    [Fact]
    public async Task CitasPorMes_MantieneInactivoQueTuvoCitasEseAnio()
    {
        var service = new ReporteCitasService(
            new FakeReporteRepository(new ConteoCitasMes(MedicoInactivo, 4, EstadoCita.Atendida, 2)),
            new FakeMedicoRepository(Medicos));

        var reporte = await service.CitasPorMesAsync(AnioActual, incluirCanceladas: false);

        var inactivo = Assert.Single(reporte!.Medicos, m => m.MedicoId == MedicoInactivo);
        Assert.Equal("Dr. Mateo López", inactivo.NombreMedico);
        Assert.Equal(2, inactivo.Total);
    }

    [Fact]
    public async Task CitasPorMes_FiltraPorMedico()
    {
        var repo = new FakeReporteRepository(
            new ConteoCitasMes(MedicoA, 1, EstadoCita.Atendida, 4),
            new ConteoCitasMes(MedicoB, 1, EstadoCita.Atendida, 3));
        var service = new ReporteCitasService(repo, new FakeMedicoRepository(Medicos));

        var reporte = await service.CitasPorMesAsync(AnioActual, incluirCanceladas: false, medicoId: MedicoB);

        var serie = Assert.Single(reporte!.Medicos);
        Assert.Equal(MedicoB, serie.MedicoId);
        Assert.Equal(MedicoB, repo.MedicoConsultado);
        Assert.Equal(3, reporte.Total);
    }

    [Fact]
    public async Task CitasPorMes_DevuelveNullSiElMedicoNoExiste()
    {
        var service = new ReporteCitasService(new FakeReporteRepository(), new FakeMedicoRepository(Medicos));

        var reporte = await service.CitasPorMesAsync(AnioActual, incluirCanceladas: false, medicoId: "650000000000000000000099");

        Assert.Null(reporte);
    }

    [Theory]
    [InlineData(1999)]
    [InlineData(3000)]
    public async Task CitasPorMes_RechazaAnioFueraDeRango(int anio)
    {
        var service = new ReporteCitasService(new FakeReporteRepository(), new FakeMedicoRepository(Medicos));

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CitasPorMesAsync(anio, incluirCanceladas: false));

        Assert.Contains("año", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    private sealed class FakeReporteRepository : IReporteCitasRepository
    {
        private readonly List<ConteoCitasMes> _conteos;

        public FakeReporteRepository(params ConteoCitasMes[] conteos) => _conteos = conteos.ToList();

        public int? AnioConsultado { get; private set; }
        public string? MedicoConsultado { get; private set; }

        public Task<List<ConteoCitasMes>> ContarPorMesAsync(int anio, string? medicoId = null)
        {
            AnioConsultado = anio;
            MedicoConsultado = medicoId;
            return Task.FromResult(_conteos.ToList());
        }
    }

    private sealed class FakeMedicoRepository : IMedicoRepository
    {
        private readonly List<Medico> _medicos;

        public FakeMedicoRepository(IEnumerable<Medico> medicos) => _medicos = medicos.ToList();

        public Task<List<Medico>> GetAllAsync(FilterDefinition<Medico>? filter = null) => Task.FromResult(_medicos.ToList());
        public Task<Medico?> GetByIdAsync(string id) => Task.FromResult(_medicos.FirstOrDefault(m => m.Id == id));
        public Task<Medico?> FindOneAsync(FilterDefinition<Medico> filter) => Task.FromResult(_medicos.FirstOrDefault());
        public Task CreateAsync(Medico entity) => Task.CompletedTask;
        public Task<bool> UpdateAsync(string id, Medico entity) => Task.FromResult(true);
        public Task<bool> DeleteAsync(string id) => Task.FromResult(true);
    }
}
