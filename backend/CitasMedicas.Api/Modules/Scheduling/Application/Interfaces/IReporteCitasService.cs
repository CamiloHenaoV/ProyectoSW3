using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;

namespace CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;

public interface IReporteCitasService
{
    /// <summary>
    /// RF7: cantidad de citas por mes y médico/terapista para el año indicado.
    /// Devuelve null si se filtró por un médico que no existe.
    /// </summary>
    /// <exception cref="ArgumentException">El año está fuera del rango permitido.</exception>
    Task<ReporteCitasMensualDto?> CitasPorMesAsync(int anio, bool incluirCanceladas, string? medicoId = null);
}
