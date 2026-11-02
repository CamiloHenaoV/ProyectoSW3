# Contratos de API que espera el frontend — Segundo corte

Este documento lista lo que el frontend (Angular) necesita del backend (ASP.NET Core) para el segundo corte. Todo lo que no aparece aquí se mantiene igual que en el primer corte.

## 1. Autenticación con Keycloak (RNF1)

El frontend ya no llama a `POST /api/auth/login`. Obtiene el token de Keycloak (flujo Authorization Code + PKCE) y lo envía en cada petición como `Authorization: Bearer <token>`.

| Dato | Valor en desarrollo |
|---|---|
| Realm | `piedrazul` |
| Issuer (`iss`) | `http://localhost:8080/realms/piedrazul` |
| Audiencia (`aud`) | `piedrazul-api` |
| Roles | `realm_access.roles`: `Paciente`, `Agendador`, `Administrador`, `Medico`, `Terapista` |
| Claims útiles | `sub`, `email`, `name`, `documento` (pacientes), `medico_id` (médicos y terapistas) |

El realm se importa solo con `docker compose up -d` (archivo `keycloak/realm-piedrazul.json`). Ya fue verificado con Keycloak 26.0.7: los tokens traen la audiencia, los roles y los atributos anteriores.

### Validación del token en ASP.NET Core

Keycloak anida los roles dentro del claim `realm_access`, así que hay que copiarlos a `ClaimTypes.Role` para que `[Authorize(Roles = ...)]` siga funcionando:

```csharp
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = builder.Configuration["Keycloak:Authority"];  // http://localhost:8080/realms/piedrazul
        options.Audience = builder.Configuration["Keycloak:Audience"];    // piedrazul-api
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
                if (context.Principal?.Identity is not ClaimsIdentity identidad) return Task.CompletedTask;
                var realmAccess = context.Principal.FindFirst("realm_access")?.Value;
                if (string.IsNullOrEmpty(realmAccess)) return Task.CompletedTask;

                using var json = JsonDocument.Parse(realmAccess);
                if (json.RootElement.TryGetProperty("roles", out var roles))
                {
                    foreach (var rol in roles.EnumerateArray())
                        identidad.AddClaim(new Claim(ClaimTypes.Role, rol.GetString()!));
                }
                return Task.CompletedTask;
            }
        };
    });
```

Notas:

- Agregar `Medico` y `Terapista` a `Shared/Security/Roles.cs`.
- El `iss` del token depende de la URL con la que el navegador llegó a Keycloak. Si la API corre dentro de Docker y Keycloak se llama `keycloak:8080` allí, el issuer no coincidirá; en ese caso configurar `ValidIssuer = "http://localhost:8080/realms/piedrazul"` y `MetadataAddress` apuntando a la URL interna.
- CORS ya permite `http://localhost:4200`; no hace falta permitir el origen de Keycloak en la API.

### Identidad del paciente

Antes el `id` del token era el `_id` del paciente en MongoDB. Con Keycloak, `sub` es el id de Keycloak. Para `agendar`, `mis-citas`, `reagendar` y `cancelar`, la API debe encontrar al paciente por el claim `documento` (o por `email`) en lugar de usar `ClaimTypes.NameIdentifier` directamente.

## 2. Registro de pacientes

`POST /api/pacientes/registro` no cambia para el frontend (mismo cuerpo). Lo que cambia es la implementación: además de guardar el paciente en MongoDB, debe crear el usuario en Keycloak con la cuenta de servicio del cliente `piedrazul-api` (ya tiene los permisos `manage-users`, `view-users` y `query-users` en el realm):

1. Pedir un token: `POST /realms/piedrazul/protocol/openid-connect/token` con `grant_type=client_credentials`, `client_id=piedrazul-api` y el secreto del cliente.
2. Crear el usuario: `POST /admin/realms/piedrazul/users` con `username`, `email`, `firstName`, `lastName`, `enabled: true`, `emailVerified: true`, `attributes: { documento: ["<cédula>"] }` y `credentials: [{ type: "password", value: "<contraseña>", temporary: false }]`.
3. Asignar el rol: `POST /admin/realms/piedrazul/users/{id}/role-mappings/realm` con el rol `Paciente`.

Si el correo ya existe en Keycloak responde 409; devolver 409 con `{ "mensaje": "Ya existe una cuenta con ese correo." }`. El frontend muestra ese mensaje.

El secreto del cliente `piedrazul-api` en el realm de desarrollo es `cambiar-este-secreto-en-desarrollo`. Cambiarlo en la consola de Keycloak y guardarlo con `dotnet user-secrets`, nunca en el repositorio.

## 3. Endpoints nuevos

### RF5 · Historial de citas por cédula

```
GET /api/citas/historial?documento={cedula}
Roles: Agendador, Administrador, Medico, Terapista
200 → CitaListadoDto[]   (cualquier orden; el frontend ordena de la más reciente a la más antigua)
404 → si no existe un paciente con esa cédula
```

Un paciente que existe pero no tiene citas debe responder `200` con `[]`, no `404`; el frontend distingue los dos casos.

### RF5 · Autocompletado de pacientes por cédula

```
GET /api/pacientes/buscar?documento={prefijo}&limite=8
Roles: Agendador, Administrador, Medico, Terapista
200 → [{ "id": "...", "nombre": "...", "documentoIdentidad": "..." }]
```

Devuelve los pacientes cuya cédula **empieza** por el prefijo (el frontend pide sugerencias desde 3 dígitos y espera 300 ms entre teclas). Sugerencia para Mongo: índice sobre `DocumentoIdentidad` y filtro `Regex("^" + Regex.Escape(prefijo))`. No devolver teléfono ni correo aquí: es una lista de búsqueda y no los necesita.

## 4. Cambios en endpoints existentes

| Endpoint | Cambio |
|---|---|
| `GET /api/citas?medicoId=&fecha=` | Permitir también `Medico` y `Terapista` (RF1, RF4). |
| `CitaListadoDto` | Recomendado: agregar `PacienteDocumento` y `EspecialidadMedico`. La tabla y el CSV muestran la cédula si llega; si no, la columna queda vacía. |
| `POST /api/citas/agendar` | El frontend ya no envía `pacienteId` (el DTO del backend tampoco lo tenía). El paciente se toma del token. |
| `GET /api/medicos` | Sin cambios. |

## 5. Lo que NO necesita endpoint

**RF4 · Exportar a CSV:** el frontend genera el archivo en el navegador a partir de `GET /api/citas?medicoId=&fecha=`. No hace falta endpoint de exportación.

## 6. Usuarios de prueba (Keycloak)

| Rol | Correo | Contraseña | Atributo |
|---|---|---|---|
| Paciente | paciente@example.com | Paciente123 | `documento = 1032456789` |
| Agendador | agendador@example.com | Agendador123 | — |
| Administrador | admin@example.com | Admin123 | — |
| Médico | medico@example.com | Medico123 | `medico_id = 650000000000000000000001` |
| Terapista | terapista@example.com | Terapista123 | `medico_id = 650000000000000000000002` |

El paciente de prueba coincide con el que ya existe en `mongo-init/reset-and-seed.js` (Carlos Pérez, cédula `1032456789`), así que la API puede encontrarlo por el claim `documento`. Los `medico_id` corresponden a los médicos del mismo seed.

Consola de administración de Keycloak: http://localhost:8080 (usuario `admin`, contraseña `admin`, solo desarrollo).

### Obtener un token desde Postman

El cliente `piedrazul-frontend` tiene habilitado el flujo de contraseña **solo para pruebas con Postman**:

```
POST http://localhost:8080/realms/piedrazul/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=password&client_id=piedrazul-frontend&username=agendador@example.com&password=Agendador123
```

Antes de producción hay que desactivar *Direct access grants* en ese cliente; el frontend no lo usa.
