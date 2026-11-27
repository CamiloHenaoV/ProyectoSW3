# Despliegue en Vercel y Render con MongoDB Atlas

El frontend Angular se despliega en Vercel y la API ASP.NET Core en Render mediante el `Dockerfile` del backend. MongoDB Atlas aloja los datos. El Blueprint [`render.yaml`](../render.yaml) define el servicio API y las variables que deben completarse en Render.

## 1. Preparar servicios externos

- Crea una base y un usuario de MongoDB Atlas con permisos mínimos para la base de la aplicación. Configura el acceso de red para que Render pueda conectarse; evita abrir acceso global si puedes usar una lista de IPs/rangos permitidos adecuados a tu plan.
- Configura un realm de Keycloak de producción con URL pública HTTPS. No importes en producción `keycloak/realm-piedrazul.json`: contiene usuarios y configuración de desarrollo.
- El cliente de servicio de Keycloak tiene un secreto versionado en ese archivo. Trátalo como expuesto, rótalo y configura el secreto nuevo solo en Render.
- Configura el cliente frontend como público con Authorization Code + PKCE, y añade el dominio HTTPS de Vercel en sus redirect URIs y web origins.
- Asegúrate de que los tokens incluyan el audience `piedrazul-api` y los roles que valida la API.

## 2. Render: API

1. En Render, crea un **Blueprint** y conecta este repositorio. Render leerá el archivo `render.yaml`.
2. El Blueprint configura el servicio `piedrazul-api`, el directorio raíz `backend/CitasMedicas.Api`, el `Dockerfile` y el health check `/health`.
3. Completa en Render las variables marcadas para introducirse manualmente:

| Variable | Valor |
|---|---|
| `MongoDbSettings__ConnectionString` | URI de MongoDB Atlas, mantener secreta |
| `Keycloak__Authority` | `https://<host-keycloak>/realms/piedrazul` |
| `Keycloak__ServiceClientSecret` | Secreto nuevo del cliente confidencial de servicio, mantener secreto |
| `Cors__AllowedOrigins__0` | Origen de Vercel, por ejemplo `https://<app>.vercel.app`, sin `/` final |

El Blueprint también define `ASPNETCORE_ENVIRONMENT=Production`, la base `piedrazul_db`, el realm y los IDs de cliente esperados. La API falla al iniciar si faltan variables requeridas o si CORS no contiene un origen HTTPS exacto.

Render proporciona `PORT`; el `Dockerfile` hace que ASP.NET Core escuche en `0.0.0.0` en ese puerto. `/health` confirma que la API está activa; no comprueba disponibilidad de MongoDB ni de Keycloak.

## 3. Vercel: frontend

1. Importa el repositorio en Vercel y configura **Root Directory** como `frontend`.
2. Vercel usará `frontend/vercel.json` para compilar Angular, publicar `dist/frontend/browser` y redirigir las rutas de la SPA a `index.html`.
3. Configura estas variables en Vercel:

| Variable | Valor |
|---|---|
| `API_URL` | `https://<dominio-render>/api` |
| `KEYCLOAK_URL` | `https://<host-keycloak>` |
| `KEYCLOAK_REALM` | Realm de producción |
| `KEYCLOAK_CLIENT_ID` | ID del cliente público frontend |

Estos cuatro valores se incluyen en el bundle del navegador: no pongas secretos ni client secrets aquí. El build de Vercel falla si faltan o si las URLs no usan HTTPS. Si quieres builds Preview de Vercel, configura también esas variables para el entorno Preview.

Una vez que Vercel asigne el dominio definitivo, actualiza `Cors__AllowedOrigins__0` en Render y los redirect URIs/web origins en Keycloak; vuelve a desplegar ambos servicios si cambiaste su configuración.

## 4. Despliegue continuo y comprobación

- En Render, selecciona **After CI Checks Pass** como comportamiento de auto-deploy para que espere los checks de GitHub Actions. Protege también `main` para impedir fusiones con checks fallidos.
- Comprueba `https://<dominio-render>/health` (HTTP 200), inicia sesión desde Vercel y prueba una operación autenticada. En el navegador, confirma que no haya errores CORS ni peticiones a `localhost`.
- La pantalla de configuración de Render, no este repositorio, es el lugar para introducir las credenciales de MongoDB y Keycloak. No copies secretos en logs, commits o chats.

## Estado de credenciales revisado

- No hay archivos `.env` versionados ni una URI real de MongoDB Atlas en `appsettings.json`; allí hay un marcador de posición.
- Hay un secreto de servicio de Keycloak en el realm de desarrollo versionado. No lo reutilices: rótalo antes de producción.
- Vercel no necesita una API key para Keycloak: el cliente del navegador es público y usa PKCE.
