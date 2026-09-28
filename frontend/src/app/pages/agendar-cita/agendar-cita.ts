import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CitasService } from '../../core/services/citas.service';
import { MedicosService } from '../../core/services/medicos.service';
import { AuthService } from '../../core/services/auth.service';
import { FranjaDisponible, Medico } from '../../core/models/cita.model';
import { SelectorFranjas } from '../../shared/organisms/selector-franjas/selector-franjas';
import { SelectField, SelectOption } from '../../shared/atoms/select-field/select-field';
import { InputField } from '../../shared/atoms/input-field/input-field';
import { Button } from '../../shared/atoms/button/button';

// RF2: Yo como paciente necesito agendar una cita mediante la web.
// Flujo: elegir médico + fecha + franja + confirmar.
@Component({
  selector: 'app-agendar-cita',
  imports: [SelectorFranjas, SelectField, InputField, Button],
  templateUrl: './agendar-cita.html',
  styleUrl: './agendar-cita.scss'
})
export class AgendarCita {
  private citasService = inject(CitasService);
  private medicosService = inject(MedicosService);
  private authService = inject(AuthService);
  private router = inject(Router);

  paso = signal<1 | 2 | 3>(1);

  pacienteId = signal('');
  medicos = signal<Medico[]>([]);
  medicoId = signal('');
  fecha = signal(new Date().toISOString().substring(0, 10));
  franjas = signal<FranjaDisponible[]>([]);
  franjaSeleccionada = signal<FranjaDisponible | null>(null);

  mensaje = signal('');
  mensajeEsError = signal(false);

  constructor() {
    const usuario = this.authService.getUsuario();
    if (!usuario) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.pacienteId.set(usuario.id);

    this.medicosService.listar().subscribe({
      next: (medicos) => this.medicos.set(medicos),
      error: () => this.mostrarError('No se pudieron cargar los médicos. Intenta nuevamente.')
    });
  }

  get opcionesMedicos(): SelectOption[] {
    return this.medicos().map((m) => ({ value: m.id, label: `${m.nombre} - ${m.especialidad}` }));
  }

  buscarFranjas(): void {
    if (!this.medicoId() || !this.fecha()) {
      this.mostrarError('Selecciona médico/terapista y fecha.');
      return;
    }
    this.citasService.obtenerFranjasDisponibles(this.medicoId(), this.fecha()).subscribe({
      next: (franjas) => {
        this.franjas.set(franjas);
        this.mensaje.set(franjas.length ? '' : 'No hay franjas disponibles para esa fecha.');
        this.mensajeEsError.set(false);
      },
      error: () => this.mostrarError('Ocurrió un error al consultar la disponibilidad.')
    });
  }

  confirmarCita(): void {
    const franja = this.franjaSeleccionada();
    if (!franja) {
      this.mostrarError('Selecciona una franja horaria.');
      return;
    }

    this.citasService.agendar({
      medicoId: this.medicoId(),
      pacienteId: this.pacienteId(),
      fecha: this.fecha(),
      horaInicio: franja.horaInicio
    }).subscribe({
      next: () => {
        this.mensaje.set('¡Cita agendada exitosamente!');
        this.mensajeEsError.set(false);
        this.paso.set(3);
      },
      error: (err) => this.mostrarError(err?.error?.mensaje ?? 'No fue posible agendar la cita.')
    });
  }

  private mostrarError(texto: string): void {
    this.mensaje.set(texto);
    this.mensajeEsError.set(true);
  }
}
