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

    public PacienteService(IPacienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<PacienteDto> RegistrarAsync(RegistroPacienteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre))
            throw new ArgumentException("El nombre es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Email))
            throw new ArgumentException("El email es obligatorio.");

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 6)
            throw new ArgumentException("La contraseña debe tener al menos 6 caracteres.");

        var email = request.Email.Trim();
        var existente = await _repository.FindOneAsync(Builders<Paciente>.Filter.Eq(p => p.Email, email));
        if (existente is not null)
            throw new InvalidOperationException("Ya existe un paciente con ese email.");

        var paciente = new Paciente
        {
            Nombre = request.Nombre.Trim(),
            DocumentoIdentidad = request.DocumentoIdentidad.Trim(),
            Telefono = request.Telefono.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Rol = Roles.Paciente
        };

        await _repository.CreateAsync(paciente);

        return new PacienteDto(paciente.Id, paciente.Nombre, paciente.DocumentoIdentidad, paciente.Telefono, paciente.Email);
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
}
