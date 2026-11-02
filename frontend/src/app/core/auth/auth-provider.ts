import { InjectionToken } from '@angular/core';
import { CredencialesLogin, SesionUsuario } from './sesion.model';

/**
 * Contrato que el resto de la aplicación usa para autenticarse.
 * Patrón Strategy: KeycloakAuthProvider y LocalJwtAuthProvider son
 * implementaciones intercambiables (se elige en environment.auth.proveedor).
 * Principio de inversión de dependencias: AuthService depende de esta
 * abstracción, no de keycloak-js ni del endpoint /auth/login.
 */
export interface AuthProvider {
  /** true si la app muestra su propio formulario (local); false si redirige al IdP (Keycloak). */
  readonly usaFormularioPropio: boolean;

  /** Restaura la sesión al cargar la app. Devuelve null si no hay sesión. */
  inicializar(): Promise<SesionUsuario | null>;

  /** Keycloak redirige a su pantalla de login; local valida credenciales con el backend. */
  iniciarSesion(credenciales?: CredencialesLogin): Promise<SesionUsuario | null>;

  cerrarSesion(): Promise<void>;

  /** Token de acceso vigente (renovándolo si hace falta) o null si la sesión expiró. */
  obtenerToken(): Promise<string | null>;
}

export const AUTH_PROVIDER = new InjectionToken<AuthProvider>('AUTH_PROVIDER');
