using CitasMedicas.Api.Modules.Patients.Application.Dtos;

namespace CitasMedicas.Api.Modules.Patients.Application.Interfaces;

public interface IPacienteService
{
    Task<PacienteDto> RegistrarAsync(RegistroPacienteRequest request);
    Task<PacienteDto?> ObtenerPorIdAsync(string id);
    Task<PacienteDto?> ResolverIdentidadKeycloakAsync(string documento, string subjectId);
    Task<List<PacienteResumenDto>> BuscarPorDocumentoAsync(string prefijo, int limite);
}