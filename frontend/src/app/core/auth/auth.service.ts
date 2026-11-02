import { Injectable, computed, inject, signal } from '@angular/core';
import { AUTH_PROVIDER } from './auth-provider';
import { Rol, rutaInicioPorRoles } from './roles';
import { CredencialesLogin, SesionUsuario } from './sesion.model';

/**
 * Patrón Facade: punto único que componentes, guards e interceptor usan
 * para todo lo relacionado con la sesión, sin conocer el proveedor concreto.
 * La sesión es un signal, así la barra de navegación reacciona sola.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly proveedor = inject(AUTH_PROVIDER);
  private readonly sesionActual = signal<SesionUsuario | null>(null);

  readonly sesion = this.sesionActual.asReadonly();
  readonly autenticado = computed(() => this.sesionActual() !== null);
  readonly roles = computed(() => this.sesionActual()?.roles ?? []);
  readonly usaFormularioPropio = this.proveedor.usaFormularioPropio;

  async inicializar(): Promise<void> {
    this.sesionActual.set(await this.proveedor.inicializar());
  }

  async iniciarSesion(credenciales?: CredencialesLogin): Promise<void> {
    this.sesionActual.set(await this.proveedor.iniciarSesion(credenciales));
  }

  async cerrarSesion(): Promise<void> {
    this.sesionActual.set(null);
    await this.proveedor.cerrarSesion();
  }

  /** Limpia la sesión local cuando la API responde 401 (token vencido o revocado). */
  descartarSesion(): void {
    this.sesionActual.set(null);
  }

  obtenerToken(): Promise<string | null> {
    return this.proveedor.obtenerToken();
  }

  tieneRol(rol: Rol): boolean {
    return this.roles().includes(rol);
  }

  tieneAlgunRol(roles: readonly Rol[]): boolean {
    return roles.some((rol) => this.tieneRol(rol));
  }

  rutaInicio(): string {
    return this.autenticado() ? rutaInicioPorRoles(this.roles()) : '/login';
  }
}
