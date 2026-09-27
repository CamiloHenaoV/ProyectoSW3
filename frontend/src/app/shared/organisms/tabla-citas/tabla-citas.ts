import { Component, input } from '@angular/core';
import { BadgeEstado } from '../../atoms/badge-estado/badge-estado';
import { CitaListado } from '../../../core/models/cita.model';

@Component({
  selector: 'app-tabla-citas',
  imports: [BadgeEstado],
  templateUrl: './tabla-citas.html',
  styleUrl: './tabla-citas.scss'
})
export class TablaCitas {
  citas = input.required<CitaListado[]>();
}
