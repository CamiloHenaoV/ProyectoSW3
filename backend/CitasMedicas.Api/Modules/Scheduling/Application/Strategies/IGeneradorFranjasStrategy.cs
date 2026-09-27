using CitasMedicas.Api.Modules.Configuration.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Domain;

namespace CitasMedicas.Api.Modules.Scheduling.Application.Strategies;

// Strategy Pattern: aisla el algoritmo de calculo de franjas para poder
// reemplazarlo sin tocar CitaService (Open/Closed Principle).
public interface IGeneradorFranjasStrategy
{
    List<(TimeSpan Inicio, TimeSpan Fin)> Generar(
        ConfiguracionMedicoDto configuracion, DateTime fecha, List<Cita> citasExistentes);
}