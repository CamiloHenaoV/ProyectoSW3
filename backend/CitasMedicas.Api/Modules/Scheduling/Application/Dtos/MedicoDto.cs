namespace CitasMedicas.Api.Modules.Scheduling.Application.Dtos;

public record MedicoDto(string Id, string Nombre, string Especialidad, bool Activo = true);

public record ActualizarEstadoMedicoRequest(bool Activo);