import Keycloak, { KeycloakConfig, KeycloakInitOptions } from 'keycloak-js';
import { AuthProvider } from './auth-provider';
import { claimTexto, extraerRoles } from './jwt.utils';
import { filtrarRolesDelSistema } from './roles';
import { SesionUsuario } from './sesion.model';

/** Segundos mínimos de vigencia que debe tener el token antes de usarse. */
const VIGENCIA_MINIMA_SEGUNDOS = 30;

/** Subconjunto de keycloak-js que usamos; facilita las pruebas con un doble. */
export type ClienteKeycloak = Pick<
  Keycloak,
  'init' | 'login' | 'logout' | 'updateToken' | 'token' | 'tokenParsed' | 'onTokenExpired'
>;

export type FabricaClienteKeycloak = (config: KeycloakConfig) => ClienteKeycloak;

/**
 * Patrón Adapter: adapta la API de keycloak-js al contrato AuthProvider.
 * Flujo OIDC Authorization Code + PKCE (S256). El token vive en memoria,
 * no en localStorage, lo que reduce la superficie ante XSS.
 */
export class KeycloakAuthProvider implements AuthProvider {
  readonly usaFormularioPropio = false;
  private readonly cliente: ClienteKeycloak;

  constructor(
    private readonly config: KeycloakConfig & { clientId: string },
    private readonly origen: string,
    fabrica: FabricaClienteKeycloak = (c) => new Keycloak(c)
  ) {
    this.cliente = fabrica(config);
  }

  async inicializar(): Promise<SesionUsuario | null> {
    const opciones: KeycloakInitOptions = {
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      silentCheckSsoRedirectUri: `${this.origen}/silent-check-sso.html`,
      checkLoginIframe: false
    };

    try {
      const autenticado = await this.cliente.init(opciones);
      this.cliente.onTokenExpired = () => {
        this.cliente.updateToken(VIGENCIA_MINIMA_SEGUNDOS).catch(() => undefined);
      };
      return autenticado ? this.construirSesion() : null;
    } catch {
      // Keycloak caído o mal configurado: la app arranca sin sesión.
      return null;
    }
  }

  async iniciarSesion(): Promise<SesionUsuario | null> {
    await this.cliente.login({ redirectUri: `${this.origen}/login` });
    return null;
  }

  async cerrarSesion(): Promise<void> {
    await this.cliente.logout({ redirectUri: `${this.origen}/login` });
  }

  async obtenerToken(): Promise<string | null> {
    try {
      await this.cliente.updateToken(VIGENCIA_MINIMA_SEGUNDOS);
      return this.cliente.token ?? null;
    } catch {
      return null;
    }
  }

  private construirSesion(): SesionUsuario | null {
    const payload = (this.cliente.tokenParsed ?? null) as Record<string, unknown> | null;
    if (!payload) return null;

    return {
      id: claimTexto(payload, 'sub'),
      nombre: claimTexto(payload, 'name', 'given_name', 'preferred_username', 'email'),
      email: claimTexto(payload, 'email', 'preferred_username'),
      roles: filtrarRolesDelSistema(extraerRoles(payload, this.config.clientId)),
      medicoId: claimTexto(payload, 'medico_id') || null
    };
  }
}
