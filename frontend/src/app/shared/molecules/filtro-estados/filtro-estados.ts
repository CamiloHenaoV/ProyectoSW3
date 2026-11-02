import { Component, computed, input, output } from '@angular/core';

interface OpcionEstado {
  valor: string;
  etiqueta: string;
  cantidad: number;
}

/** Chips de estado con su conteo; al tocar uno se filtra la tabla. */
@Component({
  selector: 'app-filtro-estados',
  template: `
    <div class="estados" role="group" aria-label="Filtrar por estado">
      @for (opcion of opciones(); track opcion.valor) {
        <button
          type="button"
          class="chip"
          [class.chip--activo]="opcion.valor === seleccionado()"
          [attr.aria-pressed]="opcion.valor === seleccionado()"
          (click)="cambiar.emit(opcion.valor)"
        >
          {{ opcion.etiqueta }} <strong>{{ opcion.cantidad }}</strong>
        </button>
      }
    </div>
  `,
  styles: `
    .estados { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .chip {
      display: inline-flex; align-items: center; gap: 0.45rem;
      padding: 0.45rem 0.85rem; border: 1px solid var(--line-strong); border-radius: 999px;
      background: #fff; color: var(--ink-soft); font-size: 0.85rem; cursor: pointer;
    }
    .chip strong { color: var(--ink); font-weight: 700; }
    .chip--activo { background: var(--ink); border-color: var(--ink); color: #f8fafc; }
    .chip--activo strong { color: #f8fafc; }
  `
})
export class FiltroEstados {
  estados = input.required<readonly string[]>();
  conteos = input.required<Partial<Record<string, number>>>();
  total = input.required<number>();
  seleccionado = input<string>('');

  cambiar = output<string>();

  opciones = computed<OpcionEstado[]>(() => [
    { valor: '', etiqueta: 'Todas', cantidad: this.total() },
    ...this.estados().map((estado) => ({
      valor: estado,
      etiqueta: estado,
      cantidad: this.conteos()[estado] ?? 0
    }))
  ]);
}
