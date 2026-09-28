import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { PacientesService } from '../../core/services/pacientes.service';
import { RegistroPacienteRequest } from '../../core/models/paciente.model';
import { FormularioRegistroPaciente } from '../../shared/organisms/formulario-registro-paciente/formulario-registro-paciente';

@Component({
  selector: 'app-registro',
  imports: [FormularioRegistroPaciente],
  template: `
    <section class="pagina pagina--registro">
      <header class="page-header">
        <p class="eyebrow">Registro</p>
        <h2>Crea tu cuenta</h2>
      </header>

      <div class="registro-panel">
        <app-formulario-registro-paciente [enviando]="cargando()" (registrar)="registrarPaciente($event)" />

        @if (mensaje()) {
          <p class="mensaje" [class.error]="esError()">{{ mensaje() }}</p>
        }
      </div>
    </section>
  `,
  styles: [
    ".pagina--registro { display: grid; justify-items: center; gap: 2rem; }",
    ".page-header { text-align: center; }",
    ".registro-panel { width: min(100%, 520px); display: grid; gap: 1rem; }",
    ".mensaje { margin: 0; padding: 0.9rem 1rem; border: 1px solid var(--line); background: rgba(255,255,255,0.72); }",
    ".error { color: var(--error); border-color: rgba(161,29,51,0.2); background: rgba(161,29,51,0.04); }"
  ]
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
    this.esError.set(false);

    this.pacientesService.registrar(request).subscribe({
      next: () => {
        this.cargando.set(false);
        this.mensaje.set('Registro exitoso. Ya puedes iniciar sesión.');
        this.esError.set(false);
        setTimeout(() => this.router.navigateByUrl('/login'), 1200);
      },
      error: (err) => {
        this.cargando.set(false);
        this.mensaje.set(err?.error?.mensaje ?? 'No fue posible completar el registro.');
        this.esError.set(true);
      }
    });
  }
}
