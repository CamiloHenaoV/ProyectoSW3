import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthResponse } from '../models/auth.model';
import { AuthProvider } from './auth-provider';
import { decodificarPayload, tokenExpirado } from './jwt.utils';
import { filtrarRolesDelSistema } from './roles';
import { CredencialesLogin, SesionUsuario } from './sesion.model';

export const TOKEN_KEY = 'citas_medicas_token';
export const USER_KEY = 'citas_medicas_user';

/**
 * Estrategia del primer corte: el backend emite el JWT en POST /auth/login.
 * Se conserva para poder trabajar mientras el backend termina la migración
 * a Keycloak (environment.auth.proveedor = 'local').
 */
export class LocalJwtAuthProvider implements AuthProvider {
  readonly usaFormularioPropio = true;

  constructor(
    private readonly http: HttpClient,
    private readonly apiUrl: string,
    private readonly almacen: Storage = localStorage
  ) {}

  async inicializar(): Promise<SesionUsuario | null> {
    const token = this.tokenVigente();
    return token ? this.leerSesion() : null;
  }

  async iniciarSesion(credenciales?: CredencialesLogin): Promise<SesionUsuario | null> {
    if (!credenciales) {
      throw new Error('El inicio de sesión local requiere correo y contraseña.');
    }

    const respuesta = await firstValueFrom(
      this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credenciales)
    );
    this.almacen.setItem(TOKEN_KEY, respuesta.token);
    this.almacen.setItem(USER_KEY, JSON.stringify(respuesta.usuario));
    return this.leerSesion();
  }

  async cerrarSesion(): Promise<void> {
    this.almacen.removeItem(TOKEN_KEY);
    this.almacen.removeItem(USER_KEY);
  }

  async obtenerToken(): Promise<string | null> {
    return this.tokenVigente();
  }

  private tokenVigente(): string | null {
    const token = this.almacen.getItem(TOKEN_KEY);
    if (!token || tokenExpirado(decodificarPayload(token))) {
      return null;
    }
    return token;
  }

  private leerSesion(): SesionUsuario | null {
    try {
      const usuario = JSON.parse(this.almacen.getItem(USER_KEY) ?? 'null');
      if (!usuario) return null;
      return {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        roles: filtrarRolesDelSistema([usuario.rol]),
        medicoId: usuario.medicoId ?? null
      };
    } catch {
      return null;
    }
  }
}
