import { Component, input, output } from '@angular/core';
import { FranjaDisponible } from '../../../core/models/cita.model';

@Component({
  selector: 'app-selector-franjas',
  templateUrl: './selector-franjas.html',
  styleUrl: './selector-franjas.scss'
})
export class SelectorFranjas {
  franjas = input.required<FranjaDisponible[]>();
  seleccionada = input<FranjaDisponible | null>(null);

  seleccionar = output<FranjaDisponible>();

  esSeleccionada(franja: FranjaDisponible): boolean {
    return this.seleccionada()?.horaInicio === franja.horaInicio;
  }
}
