import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LoginRequest } from '../../core/models/auth.model';
import { FormularioLogin } from '../../shared/organisms/formulario-login/formulario-login';

@Component({
  selector: 'app-login',
  imports: [FormularioLogin, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  cargando = signal(false);
  error = signal('');

  ngOnInit(): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.authService.getHomeRoute());
    }
  }

  onLogin(request: LoginRequest): void {
    this.error.set('');
    this.cargando.set(true);

    this.authService.login(request).subscribe({
      next: () => {
        this.cargando.set(false);
        this.router.navigateByUrl(this.authService.getHomeRoute());
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('Correo o contraseña incorrectos.');
      }
    });
  }
}
