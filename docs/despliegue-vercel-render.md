# Despliegue en Vercel y Render con MongoDB Atlas

El frontend Angular se despliega en Vercel. El Blueprint [`render.yaml`](../render.yaml) define la API ASP.NET Core, Keycloak y una base PostgreSQL privada para Keycloak. MongoDB Atlas sigue alojando los datos de la aplicación; PostgreSQL solo almacena los datos internos de Keycloak.

## 1. Preparar servicios externos

- Crea una base y un usuario de MongoDB Atlas con permisos mínimos para la base de la aplicación. Configura el acceso de red para que Render pueda conectarse; evita abrir acceso global si puedes usar una lista de IPs/rangos permitidos adecuados a tu plan.
- El Blueprint está configurado con planes gratuitos para la API, Keycloak y PostgreSQL. Son solo para pruebas o demostraciones, no para producción ni datos reales: los servicios web se duermen tras 15 minutos sin tráfico y el PostgreSQL gratuito expira a los 30 días.
- No importes en producción `keycloak/realm-piedrazul.json`: contiene usuarios y configuración de desarrollo.
- El cliente de servicio de Keycloak tiene un secreto versionado en ese archivo. Trátalo como expuesto, rótalo y configura el secreto nuevo solo en Render.
- El contenedor de [Keycloak](../keycloak/Dockerfile) toma la conexión interna de PostgreSQL de Render, la configura como JDBC y usa el hostname HTTPS que Render asigna. Si agregas un dominio personalizado, configura `KC_HOSTNAME` manualmente con ese dominio.

## 2. Render: Keycloak, PostgreSQL y API

1. En Render, crea un **Blueprint** y conecta este repositorio. Render leerá el archivo `render.yaml`.
2. Revisa el plan que Render propone antes de aplicarlo: `piedrazul-keycloak`, `piedrazul-keycloak-db` y `piedrazul-api` deben aparecer como **Free**. La base PostgreSQL solo acepta conexiones internas de Render. Render permite una sola base PostgreSQL gratuita activa por workspace.
3. En el primer despliegue, Render pedirá los valores `sync: false` de la API. Introduce los valores reales de MongoDB y CORS. Para `Keycloak__Authority` y `Keycloak__ServiceClientSecret`, usa valores provisionales seguros; los actualizarás después de crear el realm y el cliente. Si el servicio API ya existía, agrega o actualiza esas variables desde su panel **Environment**.
4. Render genera `KC_BOOTSTRAP_ADMIN_PASSWORD`; consúltalo en las variables de `piedrazul-keycloak` y guárdalo de forma segura. Inicia sesión en la consola de administración y crea el realm `piedrazul`, el cliente público `piedrazul-frontend` con Authorization Code + PKCE y el cliente confidencial `piedrazul-api`.
5. Configura el cliente frontend con el dominio HTTPS de Vercel en sus redirect URIs y web origins. Asegúrate de que los tokens incluyan el audience `piedrazul-api` y los roles que valida la API. No importes usuarios ni el secreto del realm de desarrollo.
6. En el panel **Environment** de `piedrazul-api`, reemplaza los valores provisionales de `Keycloak__Authority` y `Keycloak__ServiceClientSecret` por los definitivos; Render volverá a desplegar la API.

Las variables manuales de la API son:

| Variable | Valor |
|---|---|
| `MongoDbSettings__ConnectionString` | URI de MongoDB Atlas, mantener secreta |
| `Keycloak__Authority` | `https://<host-keycloak>/realms/piedrazul` (hostname público HTTPS de `piedrazul-keycloak`) |
| `Keycloak__ServiceClientSecret` | Secreto nuevo del cliente confidencial de servicio, mantener secreto |
| `Cors__AllowedOrigins__0` | Origen de Vercel, por ejemplo `https://<app>.vercel.app`, sin `/` final |

El Blueprint también define `ASPNETCORE_ENVIRONMENT=Production`, la base Mongo `piedrazul_db`, el realm y los IDs de cliente esperados. Las credenciales PostgreSQL se conectan automáticamente a Keycloak y no se comparten con la API. La API falla al iniciar si faltan variables requeridas o si CORS no contiene un origen HTTPS exacto.

### Límites de los planes gratuitos

- Los servicios web gratuitos se duermen tras 15 minutos sin tráfico; la primera petición puede tardar alrededor de un minuto mientras arrancan.
- Render PostgreSQL gratuito ofrece 1 GB y expira a los 30 días. Si no se actualiza a un plan pago durante el período de gracia, Render elimina la base y los datos de Keycloak.
- Usa solamente cuentas y datos ficticios. Para mantener Keycloak disponible y conservar su base de datos, tendrás que pasar a planes pagos antes de esos límites.

Render proporciona el puerto público `10000` usado por Keycloak. El `Dockerfile` hace que ASP.NET Core escuche en `0.0.0.0` en el puerto de Render. `/health` confirma que la API está activa; no comprueba disponibilidad de MongoDB ni de Keycloak.

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
