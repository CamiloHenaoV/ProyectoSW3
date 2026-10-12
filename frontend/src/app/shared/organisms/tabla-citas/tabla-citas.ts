import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { BadgeEstado } from '../../atoms/badge-estado/badge-estado';
import { Button } from '../../atoms/button/button';
import { CitaListado } from '../../../core/models/cita.model';

@Component({
  selector: 'app-tabla-citas',
  imports: [BadgeEstado, Button, DatePipe],
  templateUrl: './tabla-citas.html',
  styleUrl: './tabla-citas.scss'
})
export class TablaCitas {
  citas = input.required<CitaListado[]>();
  mostrarCancelar = input(false);
  mostrarReagendar = input(false);
  mostrarEliminar = input(false);
  vistaPaciente = input(false);
  cancelarCita = output<string>();
  reagendarCita = output<string>();
  eliminarCita = output<string>();
}
