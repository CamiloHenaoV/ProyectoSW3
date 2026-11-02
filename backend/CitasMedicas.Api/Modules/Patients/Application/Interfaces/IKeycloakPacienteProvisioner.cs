namespace CitasMedicas.Api.Modules.Patients.Application.Interfaces;

public interface IKeycloakPacienteProvisioner
{
    Task<string> CrearUsuarioAsync(
        string email,
        string nombre,
        string documento,
        string password,
        CancellationToken cancellationToken = default);

    Task EliminarUsuarioAsync(string subjectId, CancellationToken cancellationToken = default);
}
