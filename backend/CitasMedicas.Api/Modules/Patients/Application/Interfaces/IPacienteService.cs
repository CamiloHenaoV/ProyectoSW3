using CitasMedicas.Api.Modules.Patients.Application.Dtos;

namespace CitasMedicas.Api.Modules.Patients.Application.Interfaces;

public interface IPacienteService
{
    Task<PacienteDto> RegistrarAsync(RegistroPacienteRequest request);
    Task<PacienteDto?> ObtenerPorIdAsync(string id);
}