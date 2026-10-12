using CitasMedicas.Api.Modules.Scheduling.Application.Dtos;

namespace CitasMedicas.Api.Modules.Scheduling.Application.Interfaces;

public interface IMedicoService
{
    Task<List<MedicoDto>> ListarAsync(bool incluirInactivos = false);
    Task<MedicoDto?> ActualizarEstadoAsync(string medicoId, bool activo);
}