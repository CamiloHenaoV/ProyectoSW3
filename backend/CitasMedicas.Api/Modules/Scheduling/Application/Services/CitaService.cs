using MongoDB.Driver;
using CitasMedicas.Api.Modules.Configuration.Application.Interfaces;
using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;
using CitasMedicas.Api.Modules.Scheduling.Application.Strategies;
using CitasMedicas.Api.Modules.Scheduling.Domain;
using CitasMedicas.Api.Modules.Scheduling.Infrastructure;

namespace CitasMedicas.Api.Modules.Scheduling.Application.Services;

public class CitaService : ICitaService
{
    private readonly ICitaRepository _citaRepository;
    private readonly IMedicoRepository _medicoRepository;
    private readonly IConfiguracionService _configuracionService;
    private readonly IGeneradorFranjasStrategy _generadorFranjas;

    public CitaService(
        ICitaRepository citaRepository,
        IMedicoRepository medicoRepository,
        IConfiguracionService configuracionService,
        IGeneradorFranjasStrategy generadorFranjas)
    {
        _citaRepository = citaRepository;
        _medicoRepository = medicoRepository;
        _configuracionService = configuracionService;
        _generadorFranjas = generadorFranjas;
    }

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

    public async Task<List<FranjaDisponibleDto>> ObtenerFranjasDisponiblesAsync(string medicoId, DateTime fecha)
    {
        var configuracion = await _configuracionService.ObtenerPorMedicoAsync(medicoId);
        if (configuracion is null)
            return new List<FranjaDisponibleDto>();

        var fechaNormalizada = DateTime.SpecifyKind(fecha.Date, DateTimeKind.Utc);

        var limite = DateTime.UtcNow.Date.AddDays(7 * configuracion.SemanasHabilitadas);
        if (fechaNormalizada > limite)
            return new List<FranjaDisponibleDto>();

        var filtro = Builders<Cita>.Filter.And(
            Builders<Cita>.Filter.Eq(c => c.MedicoId, medicoId),
            Builders<Cita>.Filter.Eq(c => c.Fecha, fechaNormalizada)
        );
        var citasExistentes = await _citaRepository.GetAllAsync(filtro);

        return _generadorFranjas
            .Generar(configuracion, fechaNormalizada, citasExistentes)
            .Select(f => new FranjaDisponibleDto(fechaNormalizada, f.Inicio, f.Fin))
            .ToList();
    }
    public async Task<CitaListadoDto> AgendarAsync(AgendarCitaRequest request)
{
    var medico = await _medicoRepository.GetByIdAsync(request.MedicoId)
        ?? throw new InvalidOperationException("El medico/terapista no existe.");

    var franjas = await ObtenerFranjasDisponiblesAsync(request.MedicoId, request.Fecha);
    var franja = franjas.FirstOrDefault(f => f.HoraInicio == request.HoraInicio)
        ?? throw new InvalidOperationException("La franja seleccionada ya no esta disponible.");

    var cita = new Cita
    {
        MedicoId = request.MedicoId,
        Fecha = DateTime.SpecifyKind(request.Fecha.Date, DateTimeKind.Utc),
        HoraInicio = franja.HoraInicio,
        HoraFin = franja.HoraFin,
        Estado = EstadoCita.Agendada,
        PacienteId = request.PacienteId
    };

    await _citaRepository.CreateAsync(cita);

    return new CitaListadoDto(
        cita.Id, cita.MedicoId, medico.Nombre, cita.Fecha,
        cita.HoraInicio, cita.HoraFin, cita.Estado.ToString(), cita.PacienteId);
}
}