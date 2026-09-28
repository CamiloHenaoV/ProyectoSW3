using CitasMedicas.Api.Modules.Configuration.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Domain;

namespace CitasMedicas.Api.Modules.Scheduling.Application.Strategies;

// Genera franjas de tamano fijo (IntervaloMinutos) dentro del horario configurado,
// excluyendo las que ya esten ocupadas (Agendada/Atendida).
public class FranjasFijasStrategy : IGeneradorFranjasStrategy
{
    public List<(TimeSpan Inicio, TimeSpan Fin)> Generar(
        ConfiguracionMedicoDto configuracion, DateTime fecha, List<Cita> citasExistentes)
    {
        var resultado = new List<(TimeSpan, TimeSpan)>();

        if (configuracion is null)
            return resultado;

        if (configuracion.IntervaloMinutos <= 0 || configuracion.HoraFin <= configuracion.HoraInicio)
            return resultado;

        if (configuracion.DiasAtencion is null || !configuracion.DiasAtencion.Contains(fecha.DayOfWeek))
            return resultado;

        var ocupadas = citasExistentes
            .Where(c => c.Estado is EstadoCita.Agendada or EstadoCita.Atendida)
            .Select(c => c.HoraInicio)
            .ToHashSet();

        var actual = configuracion.HoraInicio;
        var intervalo = TimeSpan.FromMinutes(configuracion.IntervaloMinutos);

        while (actual + intervalo <= configuracion.HoraFin)
        {
            if (!ocupadas.Contains(actual))
                resultado.Add((actual, actual + intervalo));

            actual += intervalo;
        }

        return resultado;
    }
}