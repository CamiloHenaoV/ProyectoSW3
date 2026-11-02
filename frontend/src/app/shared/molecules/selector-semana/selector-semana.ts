import { Component, input, output } from '@angular/core';
import { diaCorto, numeroDia } from '../../../core/utils/fechas';

export interface DiaDisponibilidad {
  fecha: string;
  /** null mientras se consulta; -1 si la consulta falló. */
  disponibles: number | null;
}

/** Tira de días con cuántas franjas libres tiene cada uno (RF2). */
@Component({
  selector: 'app-selector-semana',
  template: `
    <div class="semana">
      <button type="button" class="nav" aria-label="Semana anterior"
              [disabled]="!puedeRetroceder()" (click)="anterior.emit()">‹</button>

      <div class="dias" role="radiogroup" aria-label="Día de la cita">
        @for (dia of dias(); track dia.fecha) {
          <button
            type="button"
            role="radio"
            class="dia"
            [class.dia--seleccionado]="dia.fecha === seleccionada()"
            [class.dia--lleno]="dia.disponibles === 0"
            [attr.aria-checked]="dia.fecha === seleccionada()"
            [disabled]="!dia.disponibles || dia.disponibles < 0"
            (click)="seleccionar.emit(dia.fecha)"
          >
            <span class="dia__nombre">{{ nombre(dia.fecha) }}</span>
            <span class="dia__numero">{{ numero(dia.fecha) }}</span>
            <span class="dia__cupos">
              @switch (true) {
                @case (dia.disponibles === null) { … }
                @case (dia.disponibles === -1) { sin datos }
                @case (dia.disponibles === 0) { sin cupos }
                @default { {{ dia.disponibles }} {{ dia.disponibles === 1 ? 'cupo' : 'cupos' }} }
              }
            </span>
          </button>
        }
      </div>

      <button type="button" class="nav" aria-label="Semana siguiente"
              [disabled]="!puedeAvanzar()" (click)="siguiente.emit()">›</button>
    </div>
  `,
  styles: `
    .semana { display: grid; grid-template-columns: auto 1fr auto; gap: 0.5rem; align-items: stretch; }
    .nav {
      width: 2.4rem; border: 1px solid var(--line-strong); background: #fff;
      font-size: 1.4rem; color: var(--ink); cursor: pointer;
    }
    .nav:disabled { opacity: 0.35; cursor: not-allowed; }
    .dias { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 0.4rem; }
    .dia {
      display: grid; justify-items: center; gap: 0.1rem; padding: 0.6rem 0.2rem;
      border: 1px solid var(--line-strong); background: #fff; cursor: pointer; color: var(--ink);
    }
    .dia__nombre { font-size: 0.75rem; color: var(--ink-soft); text-transform: capitalize; }
    .dia__numero { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 1.7rem; font-weight: 600; line-height: 1; }
    .dia__cupos { font-size: 0.7rem; color: var(--accent); font-weight: 600; white-space: nowrap; }
    .dia:disabled { cursor: not-allowed; background: var(--paper-alt); }
    .dia:disabled .dia__numero { color: var(--ink-soft); }
    .dia--lleno .dia__cupos { color: var(--ink-soft); font-weight: 400; }
    .dia--seleccionado { background: var(--ink); border-color: var(--ink); }
    .dia--seleccionado .dia__nombre, .dia--seleccionado .dia__numero, .dia--seleccionado .dia__cupos { color: #f8fafc; }
    @media (max-width: 560px) {
      .dias { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
  `
})
export class SelectorSemana {
  dias = input.required<DiaDisponibilidad[]>();
  seleccionada = input<string>('');
  puedeRetroceder = input(false);
  puedeAvanzar = input(true);

  seleccionar = output<string>();
  anterior = output<void>();
  siguiente = output<void>();

  nombre = diaCorto;
  numero = numeroDia;
}
