import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-no-autorizado',
  imports: [RouterLink],
  template: `
    <section class="pagina pagina--angosta">
      <header class="page-header">
        <h2>Esta sección no está disponible para tu rol</h2>
        <p class="page-intro">
          Tu cuenta no tiene permiso para abrir esta página. Si crees que deberías tener acceso,
          pide al administrador de Piedrazul que revise tus roles.
        </p>
      </header>
      <div class="acciones">
        @if (rutaInicio !== '/no-autorizado') {
          <a class="boton" [routerLink]="rutaInicio">Ir a mi inicio</a>
        }
        <button type="button" class="boton boton--secundario" (click)="cerrarSesion()">Cerrar sesión</button>
      </div>
    </section>
  `,
  styles: `
    .acciones { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .boton {
      display: inline-block; padding: 0.8rem 1.2rem; border: 1px solid var(--ink);
      background: var(--ink); color: #f8fafc; font-weight: 600; cursor: pointer; font-size: 0.9rem;
    }
    .boton--secundario { background: transparent; color: var(--ink); border-color: var(--line-strong); }
  `
})
export class NoAutorizadoPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  readonly rutaInicio = this.authService.rutaInicio();

  async cerrarSesion(): Promise<void> {
    await this.authService.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
