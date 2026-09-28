import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout-principal',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './layout-principal.html',
  styleUrl: './layout-principal.scss'
})
export class LayoutPrincipal {
  private authService = inject(AuthService);
  private router = inject(Router);

  usuario() {
    return this.authService.getUsuario();
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  isPaciente(): boolean {
    return this.authService.hasRole('Paciente');
  }

  isAgendador(): boolean {
    return this.authService.hasRole('Agendador');
  }

  isAdmin(): boolean {
    return this.authService.hasRole('Administrador');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
