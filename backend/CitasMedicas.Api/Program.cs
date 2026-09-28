using MongoDB.Driver;
using CitasMedicas.Api.Modules.Scheduling;
using CitasMedicas.Api.Shared.Infrastructure;
using CitasMedicas.Api.Modules.Configuration;
using CitasMedicas.Api.Modules.Patients;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using CitasMedicas.Api.Shared.Security;

var builder = WebApplication.CreateBuilder(args);
CitasMedicas.Api.Shared.Infrastructure.MongoConventions.Registrar();
// --- 1. Configuración de MongoDB ---
builder.Services.Configure<MongoDbSettings>(
    builder.Configuration.GetSection("MongoDbSettings"));

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

// Kernel compartido (Paso 1) — esto faltaba
builder.Services.AddScoped<IMongoContext, MongoContext>();

builder.Services.AddSchedulingModule();
builder.Services.AddConfigurationModule();
builder.Services.AddPatientsModule();
// --- Autenticación JWT ---
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("JwtSettings"));
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

var jwt = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>() ?? new JwtSettings();
if (string.IsNullOrWhiteSpace(jwt.Key) || jwt.Key.Length < 32)
    throw new InvalidOperationException(
        "Falta JwtSettings:Key (mínimo 32 caracteres). Ejecuta: dotnet user-secrets set \"JwtSettings:Key\" \"<clave>\"");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
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
builder.Services.AddAuthorization();
builder.Services.AddControllers();

// --- 2. Servicios OpenAPI y CORS ---
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

app.UseCors("AllowAngular");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
// --- 3. Endpoint de prueba de conexión a MongoDB Atlas ---
app.MapGet("/api/test-db", async (IMongoDatabase database) =>
{
    try
    {
        var command = new MongoDB.Bson.BsonDocument("ping", 1);
        await database.RunCommandAsync<MongoDB.Bson.BsonDocument>(command);
        return Results.Ok(new { status = "OK", message = "¡Conexión a MongoDB Atlas Exitosa!" });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Error al conectar a MongoDB: {ex.Message}");
    }
});

// --- 4. Endpoint WeatherForecast por defecto ---
var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast = Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.MapControllers();
app.Run();

// --- Clases de soporte ---
public class MongoDbSettings
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DatabaseName { get; set; } = string.Empty;
}

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}