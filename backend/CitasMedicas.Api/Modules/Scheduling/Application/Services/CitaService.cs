using MongoDB.Driver;
using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;
using CitasMedicas.Api.Modules.Scheduling.Domain;
using CitasMedicas.Api.Modules.Scheduling.Infrastructure;

namespace CitasMedicas.Api.Modules.Scheduling.Application.Services;

public class CitaService : ICitaService
{
    private readonly ICitaRepository _citaRepository;
    private readonly IMedicoRepository _medicoRepository;

    public CitaService(ICitaRepository citaRepository, IMedicoRepository medicoRepository)
    {
        _citaRepository = citaRepository;
        _medicoRepository = medicoRepository;
    }

    // RF1: Yo como agendador necesito listar las citas de un medico en una fecha determinada
   public async Task<List<CitaListadoDto>> ListarPorMedicoYFechaAsync(string medicoId, DateTime fecha)
{
    var medico = await _medicoRepository.GetByIdAsync(medicoId);
    var fechaNormalizada = DateTime.SpecifyKind(fecha.Date, DateTimeKind.Utc);

    var filtro = Builders<Cita>.Filter.And(
        Builders<Cita>.Filter.Eq(c => c.MedicoId, medicoId),
        Builders<Cita>.Filter.Eq(c => c.Fecha, fechaNormalizada)
    );

    var citas = await _citaRepository.GetAllAsync(filtro);

    return citas
        .OrderBy(c => c.HoraInicio)
        .Select(c => new CitaListadoDto(
            c.Id, c.MedicoId, medico?.Nombre ?? "Desconocido",
            c.Fecha, c.HoraInicio, c.HoraFin, c.Estado.ToString(), c.PacienteId))
        .ToList();
}
}