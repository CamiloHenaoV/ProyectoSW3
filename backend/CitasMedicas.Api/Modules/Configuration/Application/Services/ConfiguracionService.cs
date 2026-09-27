using MongoDB.Driver;
using CitasMedicas.Api.Modules.Configuration.Application.Dtos;
using CitasMedicas.Api.Modules.Configuration.Application.Interfaces;
using CitasMedicas.Api.Modules.Configuration.Domain;
using CitasMedicas.Api.Modules.Configuration.Infrastructure;

namespace CitasMedicas.Api.Modules.Configuration.Application.Services;

public class ConfiguracionService : IConfiguracionService
{
    private readonly IConfiguracionMedicoRepository _repository;

    public ConfiguracionService(IConfiguracionMedicoRepository repository)
    {
        _repository = repository;
    }

    public async Task<ConfiguracionMedicoDto?> ObtenerPorMedicoAsync(string medicoId)
    {
        var filter = Builders<ConfiguracionMedico>.Filter.Eq(c => c.MedicoId, medicoId);
        var config = await _repository.FindOneAsync(filter);
        return config is null ? null : MapToDto(config);
    }

    public async Task<ConfiguracionMedicoDto> GuardarAsync(GuardarConfiguracionRequest request)
    {
        var filter = Builders<ConfiguracionMedico>.Filter.Eq(c => c.MedicoId, request.MedicoId);
        var existente = await _repository.FindOneAsync(filter);

        var entidad = existente ?? new ConfiguracionMedico { MedicoId = request.MedicoId };
        entidad.DiasAtencion = request.DiasAtencion;
        entidad.HoraInicio = request.HoraInicio;
        entidad.HoraFin = request.HoraFin;
        entidad.IntervaloMinutos = request.IntervaloMinutos;
        entidad.SemanasHabilitadas = request.SemanasHabilitadas;
        entidad.FechaActualizacion = DateTime.UtcNow;

        if (existente is null)
            await _repository.CreateAsync(entidad);
        else
            await _repository.UpdateAsync(entidad.Id, entidad);

        return MapToDto(entidad);
    }

    private static ConfiguracionMedicoDto MapToDto(ConfiguracionMedico c) => new(
        c.Id, c.MedicoId, c.DiasAtencion, c.HoraInicio, c.HoraFin, c.IntervaloMinutos, c.SemanasHabilitadas);
}