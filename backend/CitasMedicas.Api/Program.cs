using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using CitasMedicas.Api.Modules.Configuration;
using CitasMedicas.Api.Modules.Patients;
using CitasMedicas.Api.Modules.Patients.Infrastructure;
using CitasMedicas.Api.Modules.Scheduling;
using CitasMedicas.Api.Shared.Infrastructure;
using CitasMedicas.Api.Shared.Security;

var builder = WebApplication.CreateBuilder(args);
MongoConventions.Registrar();

builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDbSettings"));

builder.Services.AddSingleton<IMongoClient>(sp =>
{
    var connectionString = builder.Configuration["MongoDbSettings:ConnectionString"];
    return new MongoClient(connectionString);
});

builder.Services.AddScoped<IMongoDatabase>(sp =>
{
    var client = sp.GetRequiredService<IMongoClient>();
    var databaseName = builder.Configuration["MongoDbSettings:DatabaseName"] ?? "piedrazul_db";
    return client.GetDatabase(databaseName);
});

builder.Services.AddScoped<IMongoContext, MongoContext>();

builder.Services.AddSchedulingModule();
builder.Services.AddConfigurationModule();
builder.Services.AddPatientsModule();
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

var jwt = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings();
var keycloakAuthority = builder.Configuration["Keycloak:Authority"];
var keycloakAudience = builder.Configuration["Keycloak:Audience"];

var authentication = builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme);

if (!string.IsNullOrWhiteSpace(keycloakAuthority))
{
    if (string.IsNullOrWhiteSpace(keycloakAudience))
        throw new InvalidOperationException("Falta configurar Keycloak:Audience.");

    authentication.AddJwtBearer(options =>
    {
        options.Authority = keycloakAuthority;
        options.Audience = keycloakAudience;
        options.RequireHttpsMetadata = !builder.Environment.IsDevelopment();
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            NameClaimType = "preferred_username",
            RoleClaimType = ClaimTypes.Role,
            ClockSkew = TimeSpan.FromSeconds(30)
        };

        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = context =>
            {
                if (context.Principal?.Identity is not ClaimsIdentity identity)
                    return Task.CompletedTask;

                var realmAccess = context.Principal.FindFirst("realm_access")?.Value;
                if (string.IsNullOrWhiteSpace(realmAccess))
                    return Task.CompletedTask;

                using var json = JsonDocument.Parse(realmAccess);
                if (json.RootElement.TryGetProperty("roles", out var roles) &&
                    roles.ValueKind == JsonValueKind.Array)
                {
                    foreach (var role in roles.EnumerateArray())
                    {
                        if (role.ValueKind == JsonValueKind.String &&
                            !string.IsNullOrWhiteSpace(role.GetString()))
                        {
                            identity.AddClaim(new Claim(ClaimTypes.Role, role.GetString()!));
                        }
                    }
                }

                return Task.CompletedTask;
            }
        };
    });
}
else
{
    if (string.IsNullOrWhiteSpace(jwt.Key) || jwt.Key.Length < 32)
        throw new InvalidOperationException(
            "Falta JwtSettings:Key (mínimo 32 caracteres). Ejecuta: dotnet user-secrets set \"JwtSettings:Key\" \"<clave>\"");

    authentication.AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwt.Issuer,
            ValidateAudience = true,
            ValidAudience = jwt.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.Key)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
}

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(Roles.Paciente, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireClaim(ClaimTypes.Role, Roles.Paciente);
    });
});
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("login", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
                AutoReplenishment = true
            }));
});

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseExceptionHandler(exceptionHandlerApp =>
{
    exceptionHandlerApp.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        var statusCode = exception switch
        {
            KeycloakProvisioningException => StatusCodes.Status503ServiceUnavailable,
            InvalidOperationException => StatusCodes.Status409Conflict,
            ArgumentException => StatusCodes.Status400BadRequest,
            UnauthorizedAccessException => StatusCodes.Status403Forbidden,
            TimeoutException => StatusCodes.Status503ServiceUnavailable,
            _ => StatusCodes.Status500InternalServerError
        };

        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = statusCode,
            Title = statusCode == StatusCodes.Status503ServiceUnavailable
                ? "Servicio temporalmente no disponible"
                : "Error de solicitud",
            Detail = statusCode == StatusCodes.Status503ServiceUnavailable
                ? exception?.Message ?? "El servicio externo no está disponible temporalmente."
                : exception?.Message ?? "Ocurrió un error inesperado.",
            Type = $"https://httpstatuses.com/{statusCode}"
        });
    });
});

app.UseCors("AllowAngular");
app.UseHttpsRedirection();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();