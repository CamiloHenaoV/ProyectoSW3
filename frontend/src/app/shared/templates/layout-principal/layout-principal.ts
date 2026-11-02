import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { ETIQUETA_ROL, ROLES_AGENDA, ROLES_HISTORIAL, Rol } from '../../../core/auth/roles';

interface EnlaceNavegacion {
  ruta: string;
  etiqueta: string;
}

@Component({
  selector: 'app-layout-principal',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout-principal.html',
  styleUrl: './layout-principal.scss'
})
export class LayoutPrincipal {
  private authService = inject(AuthService);
  private router = inject(Router);

  sesion = this.authService.sesion;
  autenticado = this.authService.autenticado;

  rolVisible = computed(() =>
    this.authService.roles().map((rol) => ETIQUETA_ROL[rol]).join(', ')
  );

  /** El menú se arma según los roles del token, no según la URL. */
  enlaces = computed<EnlaceNavegacion[]>(() => {
    const enlaces: EnlaceNavegacion[] = [];
    if (this.authService.tieneRol(Rol.Paciente)) {
      enlaces.push({ ruta: '/agendar', etiqueta: 'Agendar cita' }, { ruta: '/mis-citas', etiqueta: 'Mis citas' });
    }
    if (this.authService.tieneAlgunRol(ROLES_AGENDA)) {
      enlaces.push({ ruta: '/citas', etiqueta: 'Agenda del día' });
    }
    if (this.authService.tieneAlgunRol(ROLES_HISTORIAL)) {
      enlaces.push({ ruta: '/historial', etiqueta: 'Historial por cédula' });
    }
    if (this.authService.tieneRol(Rol.Administrador)) {
      enlaces.push({ ruta: '/admin/configuracion', etiqueta: 'Configuración' });
    }
    return enlaces;
  });

  async cerrarSesion(): Promise<void> {
    // Con Keycloak la página redirige al IdP; con el login local navegamos nosotros.
    await this.authService.cerrarSesion();
    this.router.navigateByUrl('/login');
  }
}
