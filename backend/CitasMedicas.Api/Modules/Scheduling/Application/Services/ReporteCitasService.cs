using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;
using CitasMedicas.Api.Modules.Scheduling.Domain;
using CitasMedicas.Api.Modules.Scheduling.Infrastructure;

namespace CitasMedicas.Api.Modules.Scheduling.Application.Services;

/// <summary>
/// RF7: arma el reporte de cantidad de citas por mes y médico/terapista.
/// Tiene una sola responsabilidad (consolidar conteos para el gráfico) y por eso
/// vive aparte de <see cref="CitaService"/>, que gestiona el ciclo de vida de la cita.
/// </summary>
public class ReporteCitasService : IReporteCitasService
{
    public const int AnioMinimo = 2000;
    public const int MesesPorAnio = 12;

    private readonly IReporteCitasRepository _reporteRepository;
    private readonly IMedicoRepository _medicoRepository;

    public ReporteCitasService(IReporteCitasRepository reporteRepository, IMedicoRepository medicoRepository)
    {
        _reporteRepository = reporteRepository;
        _medicoRepository = medicoRepository;
    }

    /// <summary>Año más reciente que se puede consultar: la agenda puede abrirse hacia el año siguiente.</summary>
    public static int AnioMaximo => DateTime.UtcNow.Year + 1;

    public async Task<ReporteCitasMensualDto?> CitasPorMesAsync(
        int anio,
        bool incluirCanceladas,
        string? medicoId = null)
    {
        if (anio < AnioMinimo || anio > AnioMaximo)
            throw new ArgumentException($"El año debe estar entre {AnioMinimo} y {AnioMaximo}.", nameof(anio));

        var filtroMedico = string.IsNullOrWhiteSpace(medicoId) ? null : medicoId.Trim();

        List<Medico> medicos;
        if (filtroMedico is null)
        {
            medicos = await _medicoRepository.GetAllAsync();
        }
        else
        {
            var medico = await _medicoRepository.GetByIdAsync(filtroMedico);
            if (medico is null)
                return null;
            medicos = new List<Medico> { medico };
        }

        var conteos = await _reporteRepository.ContarPorMesAsync(anio, filtroMedico);

        // "Disponible" no es una cita de un paciente; las canceladas son opcionales.
        var porMedico = conteos
            .Where(c => c.Mes is >= 1 and <= MesesPorAnio)
            .Where(c => c.Estado != EstadoCita.Disponible)
            .Where(c => incluirCanceladas || c.Estado != EstadoCita.Cancelada)
            .Where(c => filtroMedico is null || c.MedicoId == filtroMedico)
            .GroupBy(c => c.MedicoId)
            .ToDictionary(g => g.Key, g =>
            {
                var meses = new int[MesesPorAnio];
                foreach (var conteo in g)
                    meses[conteo.Mes - 1] += conteo.Cantidad;
                return meses;
            });

        var medicosPorId = medicos.ToDictionary(m => m.Id);

        // Se muestran los profesionales activos (aunque tengan 0 citas, para comparar)
        // y cualquier profesional que haya tenido citas ese año, aunque hoy esté inactivo.
        var idsIncluidos = medicos
            .Where(m => m.Activo || filtroMedico is not null)
            .Select(m => m.Id)
            .Union(porMedico.Keys);

        var series = idsIncluidos
            .Select(id =>
            {
                var meses = porMedico.TryGetValue(id, out var valores) ? valores : new int[MesesPorAnio];
                medicosPorId.TryGetValue(id, out var medico);
                return new SerieCitasMedicoDto(
                    id,
                    medico?.Nombre ?? "Desconocido",
                    medico?.Especialidad ?? string.Empty,
                    meses,
                    meses.Sum());
            })
            .OrderBy(s => s.NombreMedico, StringComparer.CurrentCulture)
            .ToList();

        var totalesPorMes = Enumerable.Range(0, MesesPorAnio)
            .Select(i => series.Sum(s => s.CitasPorMes[i]))
            .ToArray();

        return new ReporteCitasMensualDto(
            anio,
            incluirCanceladas,
            series,
            totalesPorMes,
            totalesPorMes.Sum());
    }
}
