import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { LoginRequest } from '../../core/models/auth.model';
import { mensajeDeError } from '../../core/utils/http-errores';
import { FormularioLogin } from '../../shared/organisms/formulario-login/formulario-login';
import { Button } from '../../shared/atoms/button/button';

@Component({
  selector: 'app-login',
  imports: [FormularioLogin, Button, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);

  /** Keycloak: botón que redirige al IdP. Local: formulario propio. */
  readonly usaFormularioPropio = this.authService.usaFormularioPropio;
  cargando = signal(false);
  error = signal('');

  async iniciarConKeycloak(): Promise<void> {
    this.error.set('');
    this.cargando.set(true);
    try {
      await this.authService.iniciarSesion();
    } catch {
      this.cargando.set(false);
      this.error.set('No fue posible conectar con el servidor de identidad. Intenta de nuevo en unos minutos.');
    }
  }

  async onLogin(request: LoginRequest): Promise<void> {
    this.error.set('');
    this.cargando.set(true);
    try {
      await this.authService.iniciarSesion(request);
      this.router.navigateByUrl(this.authService.rutaInicio());
    } catch (error) {
      this.error.set(mensajeDeError(error, 'Correo o contraseña incorrectos.'));
    } finally {
      this.cargando.set(false);
    }
  }
}
