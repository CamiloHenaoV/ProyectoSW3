using MongoDB.Driver;
using CitasMedicas.Api.Modules.Patients.Application.Dtos;
using CitasMedicas.Api.Modules.Patients.Application.Interfaces;
using CitasMedicas.Api.Modules.Patients.Domain;
using CitasMedicas.Api.Modules.Patients.Infrastructure;

namespace CitasMedicas.Api.Modules.Patients.Application.Services;

public class PacienteService : IPacienteService
{
    private const int LongitudMinimaPassword = 8;

    private readonly IPacienteRepository _repository;

    public PacienteService(IPacienteRepository repository)
    {
        _repository = repository;
    }

    public async Task<PacienteDto> RegistrarAsync(RegistroPacienteRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Nombre) ||
            string.IsNullOrWhiteSpace(request.DocumentoIdentidad) ||
            string.IsNullOrWhiteSpace(request.Email))
            throw new InvalidOperationException("Nombre, documento y correo son obligatorios.");

        if (string.IsNullOrEmpty(request.Password) || request.Password.Length < LongitudMinimaPassword)
            throw new InvalidOperationException($"La contraseña debe tener al menos {LongitudMinimaPassword} caracteres.");

        var email = request.Email.Trim().ToLowerInvariant();

        var existente = await _repository.FindOneAsync(Builders<Paciente>.Filter.Eq(p => p.Email, email));
        if (existente is not null)
            throw new InvalidOperationException("Ya existe un paciente registrado con ese correo.");

        var paciente = new Paciente
        {
            Nombre = request.Nombre.Trim(),
            DocumentoIdentidad = request.DocumentoIdentidad.Trim(),
            Telefono = request.Telefono.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password)
        };

        await _repository.CreateAsync(paciente);
        return MapToDto(paciente);
    }

    public async Task<PacienteDto?> ObtenerPorIdAsync(string id)
    {
        var paciente = await _repository.GetByIdAsync(id);
        return paciente is null ? null : MapToDto(paciente);
    }

    private static PacienteDto MapToDto(Paciente p) => new(p.Id, p.Nombre, p.DocumentoIdentidad, p.Telefono, p.Email);
}
