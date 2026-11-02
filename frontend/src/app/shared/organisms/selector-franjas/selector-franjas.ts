import { Component, computed, input, output } from '@angular/core';
import { FranjaDisponible } from '../../../core/models/cita.model';
import { minutosDelDia } from '../../../core/utils/fechas';
import { HoraPipe } from '../../pipes/hora.pipe';

interface GrupoFranjas {
  nombre: string;
  franjas: FranjaDisponible[];
}

const MEDIODIA = 12 * 60;

@Component({
  selector: 'app-selector-franjas',
  imports: [HoraPipe],
  templateUrl: './selector-franjas.html',
  styleUrl: './selector-franjas.scss'
})
export class SelectorFranjas {
  franjas = input.required<FranjaDisponible[]>();
  seleccionada = input<FranjaDisponible | null>(null);
  mensajeVacio = input('No hay franjas disponibles para esa fecha.');

  seleccionar = output<FranjaDisponible>();

  grupos = computed<GrupoFranjas[]>(() => {
    const manana = this.franjas().filter((f) => minutosDelDia(f.horaInicio) < MEDIODIA);
    const tarde = this.franjas().filter((f) => minutosDelDia(f.horaInicio) >= MEDIODIA);
    return [
      { nombre: 'Mañana', franjas: manana },
      { nombre: 'Tarde', franjas: tarde }
    ].filter((g) => g.franjas.length);
  });

  esSeleccionada(franja: FranjaDisponible): boolean {
    return this.seleccionada()?.horaInicio === franja.horaInicio;
  }
}
