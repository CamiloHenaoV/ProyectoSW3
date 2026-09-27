namespace CitasMedicas.Api.Modules.Patients.Application.Dtos;

public record RegistroPacienteRequest(
    string Nombre,
    string DocumentoIdentidad,
    string Telefono,
    string Email,
    string Password
);

public record PacienteDto(string Id, string Nombre, string DocumentoIdentidad, string Telefono, string Email);