import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PacientesService } from '../../core/services/pacientes.service';
import { RegistroPacienteRequest } from '../../core/models/paciente.model';
import { mensajeDeError } from '../../core/utils/http-errores';
import { FormularioRegistroPaciente } from '../../shared/organisms/formulario-registro-paciente/formulario-registro-paciente';

@Component({
  selector: 'app-registro',
  imports: [FormularioRegistroPaciente, RouterLink],
  template: `
    <section class="pagina--registro">
      <header class="page-header">
        <h2>Crea tu cuenta</h2>
        <p class="page-intro">Con tu cuenta podrás agendar y consultar tus citas sin escribir por WhatsApp.</p>
      </header>

      <div class="registro-panel">
        <app-formulario-registro-paciente [enviando]="cargando()" (registrar)="registrarPaciente($event)" />

        @if (mensaje()) {
          <p class="aviso" [class.aviso--error]="esError()" [class.aviso--exito]="!esError()" role="status">
            {{ mensaje() }}
          </p>
        }
        <p class="enlace">¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión</a></p>
      </div>
    </section>
  `,
  styles: `
    .pagina--registro { display: grid; justify-items: center; gap: 2rem; padding-top: 1rem; }
    .page-header { text-align: center; justify-items: center; border-bottom: none; }
    .registro-panel { width: min(100%, 480px); display: grid; gap: 1rem; }
    .enlace { margin: 0; text-align: center; }
    .enlace a { color: var(--ink); font-weight: 700; text-decoration: underline; text-underline-offset: 0.18rem; }
  `
})
export class RegistroPage {
  private pacientesService = inject(PacientesService);
  private router = inject(Router);

  cargando = signal(false);
  mensaje = signal('');
  esError = signal(false);

  registrarPaciente(request: RegistroPacienteRequest): void {
    this.cargando.set(true);
    this.mensaje.set('');

    this.pacientesService.registrar(request).subscribe({
      next: () => {
        this.cargando.set(false);
        this.esError.set(false);
        this.mensaje.set('Cuenta creada. Ahora inicia sesión con tu correo y contraseña.');
        setTimeout(() => this.router.navigateByUrl('/login'), 1800);
      },
      error: (err) => {
        this.cargando.set(false);
        this.esError.set(true);
        this.mensaje.set(mensajeDeError(err, 'No fue posible crear la cuenta. Revisa los datos e intenta de nuevo.'));
      }
    });
  }
}
