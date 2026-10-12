using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;
using CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;
using CitasMedicas.Api.Modules.Scheduling.Infrastructure;

namespace CitasMedicas.Api.Modules.Scheduling.Application.Services;

public class MedicoService : IMedicoService
{
    private readonly IMedicoRepository _repository;

    public MedicoService(IMedicoRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<MedicoDto>> ListarAsync(bool incluirInactivos = false)
    {
        var medicos = await _repository.GetAllAsync();
        return medicos
            .Where(m => incluirInactivos || m.Activo)
            .Select(m => new MedicoDto(m.Id, m.Nombre, m.Especialidad, m.Activo))
            .ToList();
    }

    public async Task<MedicoDto?> ActualizarEstadoAsync(string medicoId, bool activo)
    {
        var medico = await _repository.GetByIdAsync(medicoId);
        if (medico is null)
            return null;

        if (medico.Activo != activo)
        {
            medico.Activo = activo;
            if (!await _repository.UpdateAsync(medico.Id, medico))
                return null;
        }

        return new MedicoDto(medico.Id, medico.Nombre, medico.Especialidad, medico.Activo);
    }
}