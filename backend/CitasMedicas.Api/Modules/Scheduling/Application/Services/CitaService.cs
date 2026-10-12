using MongoDB.Driver;
using CitasMedicas.Api.Modules.Configuration.Application.Interfaces;
using CitasMedicas.Api.Modules.Patients.Domain;
using CitasMedicas.Api.Modules.Patients.Infrastructure;
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
    private readonly IPacienteRepository? _pacienteRepository;
    private readonly IConfiguracionService _configuracionService;
    private readonly IGeneradorFranjasStrategy _generadorFranjas;

    public CitaService(
        ICitaRepository citaRepository,
        IMedicoRepository medicoRepository,
        IConfiguracionService configuracionService,
        IGeneradorFranjasStrategy generadorFranjas)
        : this(citaRepository, medicoRepository, null, configuracionService, generadorFranjas)
    {
    }

    public CitaService(
        ICitaRepository citaRepository,
        IMedicoRepository medicoRepository,
        IPacienteRepository? pacienteRepository,
        IConfiguracionService configuracionService,
        IGeneradorFranjasStrategy generadorFranjas)
    {
        _citaRepository = citaRepository;
        _medicoRepository = medicoRepository;
        _pacienteRepository = pacienteRepository;
        _configuracionService = configuracionService;
        _generadorFranjas = generadorFranjas;
    }

    public async Task<List<CitaListadoDto>> ListarPorMedicoYFechaAsync(string medicoId, DateTime fecha)
    {
        if (string.IsNullOrWhiteSpace(medicoId))
            return new List<CitaListadoDto>();

        var medico = await _medicoRepository.GetByIdAsync(medicoId);
        var fechaNormalizada = DateTime.SpecifyKind(fecha.Date, DateTimeKind.Utc);

        var filtro = Builders<Cita>.Filter.And(
            Builders<Cita>.Filter.Eq(c => c.MedicoId, medicoId),
            Builders<Cita>.Filter.Eq(c => c.Fecha, fechaNormalizada));

        var citas = await _citaRepository.GetAllAsync(filtro);
        var pacientesPorId = new Dictionary<string, string>();

        if (_pacienteRepository is not null)
        {
            foreach (var cita in citas.Where(c => !string.IsNullOrWhiteSpace(c.PacienteId)))
            {
                if (!pacientesPorId.ContainsKey(cita.PacienteId!))
                {
                    var paciente = await _pacienteRepository.GetByIdAsync(cita.PacienteId!);
                    pacientesPorId[cita.PacienteId!] = paciente?.Nombre ?? "Desconocido";
                }
            }
        }

        return citas
            .OrderBy(c => c.HoraInicio)
            .Select(c => new CitaListadoDto(
                c.Id,
                c.MedicoId,
                medico?.Nombre ?? "Desconocido",
                c.Fecha,
                c.HoraInicio,
                c.HoraFin,
                c.Estado.ToString(),
                c.PacienteId,
                c.PacienteId is not null && pacientesPorId.TryGetValue(c.PacienteId, out var pacienteNombre)
                    ? pacienteNombre
                    : null))
            .ToList();
    }

    public async Task<List<CitaListadoDto>> ListarPorPacienteAsync(string pacienteId)
    {
        var citas = await _citaRepository.GetAllAsync(Builders<Cita>.Filter.Eq(c => c.PacienteId, pacienteId));

        var medicosPorId = new Dictionary<string, string>();
        foreach (var cita in citas)
        {
            if (!medicosPorId.ContainsKey(cita.MedicoId))
            {
                var medico = await _medicoRepository.GetByIdAsync(cita.MedicoId);
                medicosPorId[cita.MedicoId] = medico?.Nombre ?? "Desconocido";
            }
        }

        return citas
            .OrderByDescending(c => c.Fecha)
            .ThenBy(c => c.HoraInicio)
            .Select(c => new CitaListadoDto(
                c.Id,
                c.MedicoId,
                medicosPorId.TryGetValue(c.MedicoId, out var nombre) ? nombre : "Desconocido",
                c.Fecha,
                c.HoraInicio,
                c.HoraFin,
                c.Estado.ToString(),
                c.PacienteId,
                null))
            .ToList();
    }

    public async Task<List<FranjaDisponibleDto>> ObtenerFranjasDisponiblesAsync(string medicoId, DateTime fecha)
    {
        if (string.IsNullOrWhiteSpace(medicoId))
            return new List<FranjaDisponibleDto>();

        var medico = await _medicoRepository.GetByIdAsync(medicoId);
        if (medico is null || !medico.Activo)
            return new List<FranjaDisponibleDto>();

        var configuracion = await _configuracionService.ObtenerPorMedicoAsync(medicoId);
        if (configuracion is null)
            return new List<FranjaDisponibleDto>();

        var fechaNormalizada = DateTime.SpecifyKind(fecha.Date, DateTimeKind.Utc);
        var limite = DateTime.UtcNow.Date.AddDays(7 * configuracion.SemanasHabilitadas);
        if (fechaNormalizada > limite || fechaNormalizada < DateTime.UtcNow.Date)
            return new List<FranjaDisponibleDto>();

        var filtro = Builders<Cita>.Filter.And(
            Builders<Cita>.Filter.Eq(c => c.MedicoId, medicoId),
            Builders<Cita>.Filter.Eq(c => c.Fecha, fechaNormalizada));
        var citasExistentes = await _citaRepository.GetAllAsync(filtro);

        return _generadorFranjas
            .Generar(configuracion, fechaNormalizada, citasExistentes)
            .Select(f => new FranjaDisponibleDto(fechaNormalizada, f.Inicio, f.Fin))
            .ToList();
    }

    public async Task<CitaListadoDto> AgendarAsync(string pacienteId, AgendarCitaRequest request)
    {
        if (string.IsNullOrWhiteSpace(pacienteId))
            throw new InvalidOperationException("El paciente no está autenticado.");

        if (string.IsNullOrWhiteSpace(request.MedicoId) || request.MedicoId.Length != 24)
            throw new InvalidOperationException("El médico seleccionado no es válido.");

        if (request.Fecha.Date < DateTime.UtcNow.Date)
            throw new InvalidOperationException("No se puede agendar en fechas pasadas.");

        var medico = await _medicoRepository.GetByIdAsync(request.MedicoId)
            ?? throw new InvalidOperationException("El medico/terapista no existe.");
        if (!medico.Activo)
            throw new InvalidOperationException("El médico/terapista está inactivo y no acepta nuevas citas.");

        var franjas = await ObtenerFranjasDisponiblesAsync(request.MedicoId, request.Fecha);
        var franja = franjas.FirstOrDefault(f => f.HoraInicio == request.HoraInicio)
            ?? throw new InvalidOperationException("La franja seleccionada ya no está disponible.");

        var fechaNormalizada = DateTime.SpecifyKind(request.Fecha.Date, DateTimeKind.Utc);
        var yaExiste = await _citaRepository.FindOneAsync(
            Builders<Cita>.Filter.And(
                Builders<Cita>.Filter.Eq(c => c.MedicoId, request.MedicoId),
                Builders<Cita>.Filter.Eq(c => c.Fecha, fechaNormalizada),
                Builders<Cita>.Filter.Eq(c => c.HoraInicio, request.HoraInicio),
                Builders<Cita>.Filter.Ne(c => c.Estado, EstadoCita.Cancelada)));

        if (yaExiste is not null)
            throw new InvalidOperationException("La cita ya está ocupada en ese horario.");

        var cita = new Cita
        {
            MedicoId = request.MedicoId,
            Fecha = fechaNormalizada,
            HoraInicio = franja.HoraInicio,
            HoraFin = franja.HoraFin,
            Estado = EstadoCita.Agendada,
            PacienteId = pacienteId
        };

        await _citaRepository.CreateAsync(cita);

        return new CitaListadoDto(
            cita.Id,
            cita.MedicoId,
            medico.Nombre,
            cita.Fecha,
            cita.HoraInicio,
            cita.HoraFin,
            cita.Estado.ToString(),
            cita.PacienteId,
            _pacienteRepository is not null ? (await _pacienteRepository.GetByIdAsync(pacienteId))?.Nombre : null);
    }

    public async Task<bool> CancelarAsync(string citaId, string? pacienteId)
    {
        var cita = await _citaRepository.GetByIdAsync(citaId);
        if (cita is null)
            return false;

        if (pacienteId is not null && cita.PacienteId != pacienteId)
            throw new UnauthorizedAccessException("Solo puedes cancelar tus propias citas.");

        if (cita.Estado is EstadoCita.Cancelada or EstadoCita.Atendida)
            throw new InvalidOperationException("No se puede cancelar una cita cancelada o atendida.");

        cita.Estado = EstadoCita.Cancelada;
        return await _citaRepository.UpdateAsync(cita.Id, cita);
    }

    public Task<bool> EliminarAsync(string citaId)
        => _citaRepository.DeleteAsync(citaId);

    public async Task<CitaListadoDto?> ReagendarAsync(
        string citaId,
        string pacienteId,
        ReagendarCitaRequest request)
    {
        var cita = await _citaRepository.GetByIdAsync(citaId);
        if (cita is null)
            return null;

        if (cita.PacienteId != pacienteId)
            throw new UnauthorizedAccessException("Solo puedes reagendar tus propias citas.");

        if (cita.Estado != EstadoCita.Agendada)
            throw new InvalidOperationException("Solo se pueden reagendar citas que estén agendadas.");

        var fechaNormalizada = DateTime.SpecifyKind(request.Fecha.Date, DateTimeKind.Utc);
        if (fechaNormalizada <= DateTime.UtcNow.Date)
            throw new InvalidOperationException("La nueva fecha debe ser posterior a hoy.");

        var medico = await _medicoRepository.GetByIdAsync(cita.MedicoId)
            ?? throw new InvalidOperationException("El médico/terapista de la cita no existe.");
        if (!medico.Activo)
            throw new InvalidOperationException("El médico/terapista está inactivo y no acepta nuevas citas.");

        var configuracion = await _configuracionService.ObtenerPorMedicoAsync(cita.MedicoId)
            ?? throw new InvalidOperationException("El médico/terapista no tiene configuración de disponibilidad.");
        var filtroFecha = Builders<Cita>.Filter.And(
            Builders<Cita>.Filter.Eq(c => c.MedicoId, cita.MedicoId),
            Builders<Cita>.Filter.Eq(c => c.Fecha, fechaNormalizada));
        var citasFecha = await _citaRepository.GetAllAsync(filtroFecha);
        var citasQueOcupanFranja = citasFecha
            .Where(otra => otra.Id != cita.Id)
            .ToList();
        var franjasDisponibles = _generadorFranjas
            .Generar(configuracion, fechaNormalizada, citasQueOcupanFranja);
        if (!franjasDisponibles.Any(f => f.Inicio == request.HoraInicio))
            throw new InvalidOperationException("La franja seleccionada ya no está disponible.");

        var franja = franjasDisponibles.First(f => f.Inicio == request.HoraInicio);
        cita.Fecha = fechaNormalizada;
        cita.HoraInicio = franja.Inicio;
        cita.HoraFin = franja.Fin;
        if (!await _citaRepository.UpdateAsync(cita.Id, cita))
            return null;

        var nombrePaciente = _pacienteRepository is not null && cita.PacienteId is not null
            ? (await _pacienteRepository.GetByIdAsync(cita.PacienteId))?.Nombre
            : null;

        return new CitaListadoDto(
            cita.Id,
            cita.MedicoId,
            medico.Nombre,
            cita.Fecha,
            cita.HoraInicio,
            cita.HoraFin,
            cita.Estado.ToString(),
            cita.PacienteId,
            nombrePaciente);
    }
}
