import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { BadgeEstado } from '../../atoms/badge-estado/badge-estado';
import { Button } from '../../atoms/button/button';
import { HoraPipe } from '../../pipes/hora.pipe';
import { CitaListado } from '../../../core/models/cita.model';

/**
 * - agenda:    citas de un profesional en un día (RF1/RF4): orden, hora, paciente, cédula.
 * - paciente:  "Mis citas" del paciente autenticado: fecha, hora, profesional.
 * - historial: citas de un paciente consultadas por cédula (RF5): fecha, hora, profesional.
 */
export type ModoTablaCitas = 'agenda' | 'paciente' | 'historial';

@Component({
  selector: 'app-tabla-citas',
  imports: [BadgeEstado, Button, DatePipe, HoraPipe],
  templateUrl: './tabla-citas.html',
  styleUrl: './tabla-citas.scss'
})
export class TablaCitas {
  citas = input.required<CitaListado[]>();
  modo = input<ModoTablaCitas>('agenda');
  mensajeVacio = input('No hay citas para mostrar.');
  mostrarCancelar = input(false);
  mostrarReagendar = input(false);
  mostrarEliminar = input(false);

  cancelarCita = output<string>();
  reagendarCita = output<string>();
  eliminarCita = output<string>();

  esAgenda = computed(() => this.modo() === 'agenda');
  hayAcciones = computed(() => this.mostrarCancelar() || this.mostrarReagendar() || this.mostrarEliminar());
}
