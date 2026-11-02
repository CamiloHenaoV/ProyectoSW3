using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using CitasMedicas.Api.Modules.Patients.Application.Interfaces;

namespace CitasMedicas.Api.Modules.Patients.Infrastructure;

public sealed class KeycloakPacienteProvisioner : IKeycloakPacienteProvisioner
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<KeycloakPacienteProvisioner> _logger;

    public KeycloakPacienteProvisioner(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<KeycloakPacienteProvisioner> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> CrearUsuarioAsync(
        string email,
        string nombre,
        string documento,
        string password,
        CancellationToken cancellationToken = default)
    {
        var (authority, realm, clientId, clientSecret) = ObtenerConfiguracion();
        var token = await ObtenerTokenAsync(authority, clientId, clientSecret, cancellationToken);
        var http = _httpClientFactory.CreateClient();
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var adminUrl = $"{authority.GetLeftPart(UriPartial.Authority)}/admin/realms/{Uri.EscapeDataString(realm)}";
        var nombrePartes = nombre.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);
        using var respuestaCreacion = await http.PostAsJsonAsync(
            $"{adminUrl}/users",
            new
            {
                username = email,
                email,
                emailVerified = false,
                enabled = true,
                firstName = nombrePartes.FirstOrDefault() ?? nombre,
                lastName = nombrePartes.Length > 1 ? nombrePartes[1] : string.Empty,
                attributes = new Dictionary<string, string[]> { ["documento"] = [documento] },
                credentials = new[]
                {
                    new { type = "password", value = password, temporary = false }
                }
            },
            JsonOptions,
            cancellationToken);

        if (respuestaCreacion.StatusCode == HttpStatusCode.Conflict)
            throw new InvalidOperationException("Ya existe una cuenta con ese correo en el sistema de identidad.");

        if (respuestaCreacion.StatusCode != HttpStatusCode.Created)
            throw new KeycloakProvisioningException(
                $"Keycloak rechazó la creación de la cuenta (HTTP {(int)respuestaCreacion.StatusCode}).");

        var subjectId = ObtenerIdDesdeLocation(respuestaCreacion.Headers.Location);
        try
        {
            var roleResponse = await http.GetAsync(
                $"{adminUrl}/roles/Paciente",
                cancellationToken);
            if (!roleResponse.IsSuccessStatusCode)
            {
                throw new KeycloakProvisioningException(
                    $"No fue posible consultar el rol de paciente en Keycloak (HTTP {(int)roleResponse.StatusCode}).");
            }

            var role = await roleResponse.Content.ReadFromJsonAsync<KeycloakRole>(JsonOptions, cancellationToken)
                ?? throw new KeycloakProvisioningException("Keycloak no devolvió el rol de paciente.");

            var asignacionResponse = await http.PostAsJsonAsync(
                $"{adminUrl}/users/{Uri.EscapeDataString(subjectId)}/role-mappings/realm",
                new[] { role },
                JsonOptions,
                cancellationToken);
            if (!asignacionResponse.IsSuccessStatusCode)
            {
                throw new KeycloakProvisioningException(
                    $"No fue posible asignar el rol de paciente en Keycloak (HTTP {(int)asignacionResponse.StatusCode}).");
            }

            return subjectId;
        }
        catch
        {
            await EliminarUsuarioTrasFalloAsync(http, adminUrl, subjectId, cancellationToken);
            throw;
        }
    }

    public async Task EliminarUsuarioAsync(string subjectId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(subjectId))
            throw new ArgumentException("El identificador de Keycloak es obligatorio.", nameof(subjectId));

        var (authority, realm, clientId, clientSecret) = ObtenerConfiguracion();
        var token = await ObtenerTokenAsync(authority, clientId, clientSecret, cancellationToken);
        var http = _httpClientFactory.CreateClient();
        http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var adminUrl = $"{authority.GetLeftPart(UriPartial.Authority)}/admin/realms/{Uri.EscapeDataString(realm)}";
        using var respuesta = await http.DeleteAsync(
            $"{adminUrl}/users/{Uri.EscapeDataString(subjectId)}",
            cancellationToken);

        if (respuesta.StatusCode is not (HttpStatusCode.NoContent or HttpStatusCode.NotFound))
            respuesta.EnsureSuccessStatusCode();
    }

    private async Task<string> ObtenerTokenAsync(
        Uri authority,
        string clientId,
        string clientSecret,
        CancellationToken cancellationToken)
    {
        var tokenUri = new Uri($"{authority.ToString().TrimEnd('/')}/protocol/openid-connect/token");
        var http = _httpClientFactory.CreateClient();
        using var respuesta = await http.PostAsync(
            tokenUri,
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials",
                ["client_id"] = clientId,
                ["client_secret"] = clientSecret
            }),
            cancellationToken);

        if (!respuesta.IsSuccessStatusCode)
            throw new KeycloakProvisioningException(
                $"No fue posible autenticar el servicio de registro con Keycloak (HTTP {(int)respuesta.StatusCode}).");

        var token = await respuesta.Content.ReadFromJsonAsync<KeycloakToken>(JsonOptions, cancellationToken);
        return !string.IsNullOrWhiteSpace(token?.AccessToken)
            ? token.AccessToken
            : throw new KeycloakProvisioningException("Keycloak no devolvió un token para el servicio de registro.");
    }

    private (Uri Authority, string Realm, string ClientId, string ClientSecret) ObtenerConfiguracion()
    {
        var authorityText = _configuration["Keycloak:Authority"];
        var realm = _configuration["Keycloak:Realm"];
        var clientId = _configuration["Keycloak:ServiceClientId"];
        var clientSecret = _configuration["Keycloak:ServiceClientSecret"];

        if (!Uri.TryCreate(authorityText, UriKind.Absolute, out var authority) ||
            string.IsNullOrWhiteSpace(realm) ||
            string.IsNullOrWhiteSpace(clientId) ||
            string.IsNullOrWhiteSpace(clientSecret))
        {
            throw new KeycloakProvisioningException(
                "Falta configurar la autoridad, el realm y las credenciales de servicio de Keycloak.");
        }

        return (authority, realm, clientId, clientSecret);
    }

    private static string ObtenerIdDesdeLocation(Uri? location)
    {
        var subjectId = location?.Segments.LastOrDefault()?.TrimEnd('/');
        if (string.IsNullOrWhiteSpace(subjectId))
            throw new KeycloakProvisioningException("Keycloak creó el usuario, pero no devolvió su identificador.");

        return Uri.UnescapeDataString(subjectId);
    }

    private async Task EliminarUsuarioTrasFalloAsync(
        HttpClient http,
        string adminUrl,
        string subjectId,
        CancellationToken cancellationToken)
    {
        try
        {
            using var respuesta = await http.DeleteAsync(
                $"{adminUrl}/users/{Uri.EscapeDataString(subjectId)}",
                cancellationToken);
            if (respuesta.StatusCode is not (HttpStatusCode.NoContent or HttpStatusCode.NotFound))
                respuesta.EnsureSuccessStatusCode();
        }
        catch (Exception exception)
        {
            _logger.LogError(
                exception,
                "No fue posible revertir la creación del usuario {SubjectId} en Keycloak.",
                subjectId);
        }
    }

    private sealed record KeycloakToken(
        [property: JsonPropertyName("access_token")] string? AccessToken);

    private sealed record KeycloakRole(
        [property: JsonPropertyName("id")] string Id,
        [property: JsonPropertyName("name")] string Name);
}

public sealed class KeycloakProvisioningException(string message) : Exception(message);
