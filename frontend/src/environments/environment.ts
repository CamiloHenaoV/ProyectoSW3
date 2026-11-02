import { ConfiguracionEntorno } from './environment.model';

export const environment: ConfiguracionEntorno = {
  production: false,
  apiUrl: 'http://localhost:5039/api',
  auth: {
    // 'keycloak' → OIDC Authorization Code + PKCE contra Keycloak (segundo corte).
    // 'local'    → login propio del backend (primer corte), útil mientras el backend migra.
    proveedor: 'keycloak',
    keycloak: {
      url: 'http://localhost:8080',
      realm: 'piedrazul',
      clientId: 'piedrazul-frontend'
    }
  }
};
