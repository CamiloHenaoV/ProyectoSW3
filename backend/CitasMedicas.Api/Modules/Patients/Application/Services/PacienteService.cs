using CitasMedicas.Api.Modules.Patients.Application.Dtos;
using CitasMedicas.Api.Modules.Patients.Application.Interfaces;
using CitasMedicas.Api.Modules.Patients.Domain;
using CitasMedicas.Api.Modules.Patients.Infrastructure;
using CitasMedicas.Api.Shared.Security;
using MongoDB.Driver;

namespace CitasMedicas.Api.Modules.Patients.Application.Services;

public class PacienteService : IPacienteService
{
    private readonly IPacienteRepository _repository;
    private readonly IKeycloakPacienteProvisioner _keycloakProvisioner;
    private readonly ILogger<PacienteService> _logger;

    public PacienteService(
        IPacienteRepository repository,
        IKeycloakPacienteProvisioner keycloakProvisioner,
        ILogger<PacienteService> logger)
    {
        _repository = repository;
        _keycloakProvisioner = keycloakProvisioner;
        _logger = logger;
    }

    public async Task<PacienteDto> RegistrarAsync(RegistroPacienteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            throw new ArgumentException("El nombre es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Email) ||
            !System.Net.Mail.MailAddress.TryCreate(request.Email.Trim(), out _))
            throw new ArgumentException("El email es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.DocumentoIdentidad) ||
            request.DocumentoIdentidad.Trim().Length is < 5 or > 12 ||
            !request.DocumentoIdentidad.Trim().All(char.IsDigit))
        {
            throw new ArgumentException("La cédula debe tener entre 5 y 12 dígitos.");
        }

        if (string.IsNullOrWhiteSpace(request.Telefono))
            throw new ArgumentException("El teléfono es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Password) ||
            request.Password.Length < 8 ||
            !request.Password.Any(char.IsLetter) ||
            !request.Password.Any(char.IsDigit))
        {
            throw new ArgumentException("La contraseña debe tener al menos 8 caracteres, con letras y números.");
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var existente = await _repository.BuscarPorEmailAsync(email);
        if (existente is not null)
        {
            if (existente.Rol != Roles.Paciente ||
                !string.IsNullOrWhiteSpace(existente.KeycloakSubjectId) ||
                !BCrypt.Net.BCrypt.Verify(request.Password, existente.PasswordHash))
            {
                throw new InvalidOperationException("Ya existe una cuenta con ese correo.");
            }

            return await ProvisionarCuentaKeycloakAsync(existente, request.Password);
        }

        var documento = request.DocumentoIdentidad.Trim();
        var pacienteConDocumento = await _repository.BuscarPorDocumentoExactoAsync(documento);
        if (pacienteConDocumento is not null)
            throw new InvalidOperationException("Ya existe una cuenta con esa cédula.");

        var paciente = new Paciente
        {
            Nombre = request.Nombre.Trim(),
            DocumentoIdentidad = documento,
            Telefono = request.Telefono.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Rol = Roles.Paciente
        };

        await _repository.CreateAsync(paciente);

        return await ProvisionarCuentaKeycloakAsync(paciente, request.Password);
    }

    public async Task<PacienteDto?> ObtenerPorIdAsync(string id)
    {
        var paciente = await _repository.GetByIdAsync(id);
        return paciente is null ? null : new PacienteDto(
            paciente.Id,
            paciente.Nombre,
            paciente.DocumentoIdentidad,
            paciente.Telefono,
            paciente.Email);
    }

    public async Task<PacienteDto?> ResolverIdentidadKeycloakAsync(string documento, string subjectId)
    {
        if (string.IsNullOrWhiteSpace(documento) || string.IsNullOrWhiteSpace(subjectId))
            return null;

        var paciente = await _repository.BuscarPorDocumentoExactoAsync(documento.Trim());
        if (paciente is null ||
            (!string.IsNullOrWhiteSpace(paciente.KeycloakSubjectId) &&
             !string.Equals(paciente.KeycloakSubjectId, subjectId, StringComparison.Ordinal)))
        {
            return null;
        }

        if (!await _repository.VincularIdentidadKeycloakAsync(paciente.Id, subjectId))
            return null;

        return new PacienteDto(
            paciente.Id,
            paciente.Nombre,
            paciente.DocumentoIdentidad,
            paciente.Telefono,
            paciente.Email);
    }

    public async Task<List<PacienteResumenDto>> BuscarPorDocumentoAsync(string prefijo, int limite)
    {
        var documento = prefijo?.Trim();
        if (string.IsNullOrEmpty(documento) ||
            documento.Length is < 3 or > 32 ||
            !documento.All(c => char.IsLetterOrDigit(c) || c == '-'))
        {
            throw new ArgumentException("La cédula debe tener entre 3 y 32 caracteres alfanuméricos.");
        }

        if (limite < 1)
            throw new ArgumentOutOfRangeException(nameof(limite), "El límite debe ser mayor que cero.");

        var pacientes = await _repository.BuscarPorDocumentoAsync(documento, Math.Min(limite, 20));
        return pacientes
            .Select(p => new PacienteResumenDto(p.Id, p.Nombre, p.DocumentoIdentidad))
            .ToList();
    }

    private async Task<PacienteDto> ProvisionarCuentaKeycloakAsync(Paciente paciente, string password)
    {
        var subjectId = await _keycloakProvisioner.CrearUsuarioAsync(
            paciente.Email,
            paciente.Nombre,
            paciente.DocumentoIdentidad,
            password);

        if (!await _repository.VincularIdentidadKeycloakAsync(paciente.Id, subjectId))
        {
            try
            {
                await _keycloakProvisioner.EliminarUsuarioAsync(subjectId);
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "No fue posible revertir el usuario {SubjectId} tras fallar su vinculación.",
                    subjectId);
            }

            throw new InvalidOperationException("No fue posible asociar la cuenta con el paciente registrado.");
        }

        paciente.KeycloakSubjectId = subjectId;
        return new PacienteDto(
            paciente.Id,
            paciente.Nombre,
            paciente.DocumentoIdentidad,
            paciente.Telefono,
            paciente.Email);
    }
}
