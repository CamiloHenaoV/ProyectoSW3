import { Component, inject, signal } from '@angular/core';
import { CitasService } from '../../core/services/citas.service';
import { MedicosService } from '../../core/services/medicos.service';
import { PacientesService } from '../../core/services/pacientes.service';
import { FranjaDisponible, Medico } from '../../core/models/cita.model';
import { RegistroPacienteRequest } from '../../core/models/paciente.model';
import { FormularioRegistroPaciente } from '../../shared/organisms/formulario-registro-paciente/formulario-registro-paciente';
import { SelectorFranjas } from '../../shared/organisms/selector-franjas/selector-franjas';
import { SelectField, SelectOption } from '../../shared/atoms/select-field/select-field';
import { InputField } from '../../shared/atoms/input-field/input-field';
import { Button } from '../../shared/atoms/button/button';

// RF2: Yo como paciente necesito agendar una cita mediante la web.
// Flujo: 1) registrar paciente 2) elegir medico+fecha 3) elegir franja 4) confirmar
@Component({
  selector: 'app-agendar-cita',
  imports: [FormularioRegistroPaciente, SelectorFranjas, SelectField, InputField, Button],
  templateUrl: './agendar-cita.html',
  styleUrl: './agendar-cita.scss'
})
export class AgendarCita {
  private citasService = inject(CitasService);
  private medicosService = inject(MedicosService);
  private pacientesService = inject(PacientesService);

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
    this.medicosService.listar().subscribe((medicos) => this.medicos.set(medicos));
  }

  get opcionesMedicos(): SelectOption[] {
    return this.medicos().map((m) => ({ value: m.id, label: `${m.nombre} - ${m.especialidad}` }));
  }

  registrarPaciente(request: RegistroPacienteRequest): void {
    this.pacientesService.registrar(request).subscribe({
      next: (paciente) => {
        this.pacienteId.set(paciente.id);
        this.paso.set(2);
        this.mensaje.set('');
      },
      error: (err) => this.mostrarError(err?.error?.mensaje ?? 'No fue posible completar el registro.')
    });
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
