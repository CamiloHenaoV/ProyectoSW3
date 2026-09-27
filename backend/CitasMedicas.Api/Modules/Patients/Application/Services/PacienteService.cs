using MongoDB.Driver;
using CitasMedicas.Api.Modules.Patients.Application.Dtos;
using CitasMedicas.Api.Modules.Patients.Application.Interfaces;
using CitasMedicas.Api.Modules.Patients.Domain;
using CitasMedicas.Api.Modules.Patients.Infrastructure;

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
        var filtroExistente = Builders<Paciente>.Filter.Eq(p => p.Email, request.Email);
        var existente = await _repository.FindOneAsync(filtroExistente);
        if (existente is not null)
            throw new InvalidOperationException("Ya existe un paciente registrado con ese correo.");

        var paciente = new Paciente
        {
            Nombre = request.Nombre,
            DocumentoIdentidad = request.DocumentoIdentidad,
            Telefono = request.Telefono,
            Email = request.Email,
            PasswordHash = HashSimplificado(request.Password)
        };

        await _repository.CreateAsync(paciente);
        return MapToDto(paciente);
    }

    public async Task<PacienteDto?> ObtenerPorIdAsync(string id)
    {
        var paciente = await _repository.GetByIdAsync(id);
        return paciente is null ? null : MapToDto(paciente);
    }

    private static string HashSimplificado(string password)
        => Convert.ToBase64String(System.Security.Cryptography.SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(password)));

    private static PacienteDto MapToDto(Paciente p) => new(p.Id, p.Nombre, p.DocumentoIdentidad, p.Telefono, p.Email);
}