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

    public async Task<List<MedicoDto>> ListarAsync()
    {
        var medicos = await _repository.GetAllAsync();
        return medicos.Select(m => new MedicoDto(m.Id, m.Nombre, m.Especialidad)).ToList();
    }
}