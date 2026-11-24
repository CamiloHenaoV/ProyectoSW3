import { Component, input } from '@angular/core';
import { formatearEntero } from '../../../core/utils/escala-grafico';
import { MESES_CORTOS, MESES_LARGOS, SerieGrafico } from '../../../core/utils/reporte-citas';

/**
 * Organismo: vista en tabla del reporte (RF7). Da acceso a todos los valores sin
 * depender del color ni del puntero, y es lo que queda legible al imprimir.
 */
@Component({
  selector: 'app-tabla-reporte-citas',
  template: `
    <div class="contenedor">
      <table class="tabla">
        <caption class="sr-only">{{ titulo() }}</caption>
        <thead>
          <tr>
            <th scope="col">Profesional</th>
            @for (mes of meses; track mes; let i = $index) {
              <th scope="col" class="num"><abbr [attr.title]="mesesLargos[i]">{{ mes }}</abbr></th>
            }
            <th scope="col" class="num">Total</th>
          </tr>
        </thead>
        <tbody>
          @for (serie of series(); track serie.id) {
            <tr>
              <th scope="row">
                <span class="muestra" [style.background]="serie.color" aria-hidden="true"></span>
                {{ serie.etiqueta }}
                @if (serie.detalle) {
                  <span class="detalle">{{ serie.detalle }}</span>
                }
              </th>
              @for (valor of serie.valores; track $index) {
                <td class="num" [class.cero]="!valor">{{ formatear(valor) }}</td>
              }
              <td class="num total">{{ formatear(serie.total) }}</td>
            </tr>
          }
        </tbody>
        @if (series().length > 1) {
          <tfoot>
            <tr>
              <th scope="row">Total por mes</th>
              @for (valor of totalesPorMes(); track $index) {
                <td class="num">{{ formatear(valor) }}</td>
              }
              <td class="num total">{{ formatear(total()) }}</td>
            </tr>
          </tfoot>
        }
      </table>
    </div>
  `,
  styles: `
    .contenedor { overflow-x: auto; border: 1px solid var(--line); background: rgba(255, 255, 255, 0.8); }
    .tabla { width: 100%; min-width: 760px; border-collapse: collapse; font-size: 0.86rem; }
    th, td { padding: 0.6rem 0.55rem; border-bottom: 1px solid var(--line); text-align: left; vertical-align: middle; }
    thead th { font-size: 0.76rem; color: var(--ink-soft); font-weight: 700; background: rgba(15, 118, 110, 0.05); }
    abbr { text-decoration: none; }
    tbody th { font-weight: 600; color: var(--ink); white-space: nowrap; }
    .muestra { display: inline-block; width: 9px; height: 9px; margin-right: 0.4rem; border-radius: 2px; }
    .detalle { display: block; padding-left: 1.05rem; font-size: 0.76rem; font-weight: 400; color: var(--ink-soft); }
    .num { text-align: right; font-variant-numeric: tabular-nums; color: var(--ink); }
    .cero { color: #94a3b8; }
    .total { font-weight: 700; }
    tfoot th, tfoot td { border-bottom: none; font-weight: 700; color: var(--ink); background: rgba(15, 23, 42, 0.03); }
  `
})
export class TablaReporteCitas {
  series = input.required<SerieGrafico[]>();
  totalesPorMes = input.required<number[]>();
  total = input.required<number>();
  titulo = input<string>('Cantidad de citas por mes y profesional');

  readonly meses = MESES_CORTOS;
  readonly mesesLargos = MESES_LARGOS;
  formatear = formatearEntero;
}
