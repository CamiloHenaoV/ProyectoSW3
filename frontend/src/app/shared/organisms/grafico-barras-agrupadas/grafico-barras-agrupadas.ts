import { Component, computed, input, signal } from '@angular/core';
import { EscalaEje, escalaEje, formatearEntero } from '../../../core/utils/escala-grafico';
import { SerieGrafico } from '../../../core/utils/reporte-citas';

/** Lienzo lógico del SVG; se escala al ancho del contenedor con viewBox. */
export const ANCHO_GRAFICO = 920;
export const ALTO_GRAFICO = 320;
const MARGEN = { arriba: 22, derecha: 8, abajo: 34, izquierda: 44 };
const ANCHO_MAXIMO_BARRA = 24;
const ANCHO_MINIMO_BARRA = 3;
const SEPARACION_BARRAS = 2;
const RADIO_PUNTA = 4;

export interface BarraGrafico {
  serieId: string;
  categoria: number;
  valor: number;
  color: string;
  x: number;
  y: number;
  ancho: number;
  alto: number;
  trazo: string;
}

export interface BandaGrafico {
  indice: number;
  x: number;
  ancho: number;
  centro: number;
  etiqueta: string;
  descripcion: string;
}

export interface GeometriaGrafico {
  escala: EscalaEje;
  barras: BarraGrafico[];
  bandas: BandaGrafico[];
  marcasY: { valor: number; y: number; texto: string }[];
  base: number;
  izquierda: number;
  derecha: number;
  arriba: number;
  /** La barra más alta lleva su valor escrito (etiqueta selectiva, no una en cada barra). */
  destacada: BarraGrafico | null;
}

/** Columna con punta redondeada de 4 px y base recta sobre la línea de cero. */
export function trazoColumna(x: number, y: number, ancho: number, alto: number): string {
  const r = Math.min(RADIO_PUNTA, ancho / 2, alto);
  const base = y + alto;
  return [
    `M${x},${base}`,
    `V${y + r}`,
    `A${r},${r} 0 0 1 ${x + r},${y}`,
    `H${x + ancho - r}`,
    `A${r},${r} 0 0 1 ${x + ancho},${y + r}`,
    `V${base}`,
    'Z'
  ].join(' ');
}

export function calcularGeometria(
  series: readonly SerieGrafico[],
  categorias: readonly string[],
  categoriasLargas: readonly string[],
  unidad: string
): GeometriaGrafico {
  const anchoTrazado = ANCHO_GRAFICO - MARGEN.izquierda - MARGEN.derecha;
  const altoTrazado = ALTO_GRAFICO - MARGEN.arriba - MARGEN.abajo;
  const base = MARGEN.arriba + altoTrazado;
  const n = Math.max(categorias.length, 1);
  const anchoBanda = anchoTrazado / n;
  const k = Math.max(series.length, 1);

  const maximo = Math.max(0, ...series.flatMap((s) => s.valores));
  const escala = escalaEje(maximo);
  const aY = (valor: number) => base - (valor / escala.tope) * altoTrazado;

  const anchoBarra = Math.max(
    ANCHO_MINIMO_BARRA,
    Math.min(ANCHO_MAXIMO_BARRA, (anchoBanda * 0.74 - (k - 1) * SEPARACION_BARRAS) / k)
  );
  const anchoGrupo = k * anchoBarra + (k - 1) * SEPARACION_BARRAS;

  const barras: BarraGrafico[] = [];
  const bandas: BandaGrafico[] = categorias.map((etiqueta, i) => {
    const xBanda = MARGEN.izquierda + i * anchoBanda;
    const inicioGrupo = xBanda + (anchoBanda - anchoGrupo) / 2;

    series.forEach((serie, j) => {
      const valor = serie.valores[i] ?? 0;
      if (valor <= 0) return;
      const x = inicioGrupo + j * (anchoBarra + SEPARACION_BARRAS);
      const y = aY(valor);
      const alto = base - y;
      barras.push({ serieId: serie.id, categoria: i, valor, color: serie.color, x, y, ancho: anchoBarra, alto, trazo: trazoColumna(x, y, anchoBarra, alto) });
    });

    const total = series.reduce((suma, s) => suma + (s.valores[i] ?? 0), 0);
    const detalle = series.map((s) => `${s.etiqueta}: ${formatearEntero(s.valores[i] ?? 0)}`).join('; ');
    return {
      indice: i,
      x: xBanda,
      ancho: anchoBanda,
      centro: xBanda + anchoBanda / 2,
      etiqueta,
      descripcion: `${categoriasLargas[i] ?? etiqueta}: ${formatearEntero(total)} ${unidad}. ${detalle}`
    };
  });

  const destacada = barras.reduce<BarraGrafico | null>((mayor, b) => (!mayor || b.valor > mayor.valor ? b : mayor), null);

  return {
    escala,
    barras,
    bandas,
    marcasY: escala.marcas.map((valor) => ({ valor, y: aY(valor), texto: formatearEntero(valor) })),
    base,
    izquierda: MARGEN.izquierda,
    derecha: ANCHO_GRAFICO - MARGEN.derecha,
    arriba: MARGEN.arriba,
    destacada
  };
}

/**
 * Organismo: columnas agrupadas (una categoría por mes, una columna por serie).
 * Es presentacional y genérico: no sabe de citas ni de médicos, solo de series.
 * Accesibilidad: cada mes es enfocable con teclado y anuncia sus valores; el detalle
 * completo también está en la tabla que la página muestra debajo.
 */
@Component({
  selector: 'app-grafico-barras-agrupadas',
  templateUrl: './grafico-barras-agrupadas.html',
  styleUrl: './grafico-barras-agrupadas.scss'
})
export class GraficoBarrasAgrupadas {
  series = input.required<SerieGrafico[]>();
  categorias = input.required<readonly string[]>();
  /** Nombres completos para el tooltip y los lectores de pantalla (p. ej. «marzo»). */
  categoriasLargas = input<readonly string[]>([]);
  titulo = input<string>('Gráfico de barras');
  unidad = input<string>('citas');

  readonly ancho = ANCHO_GRAFICO;
  readonly alto = ALTO_GRAFICO;

  bandaActiva = signal<number | null>(null);

  geometria = computed(() =>
    calcularGeometria(this.series(), this.categorias(), this.categoriasLargas(), this.unidad())
  );

  tooltip = computed(() => {
    const indice = this.bandaActiva();
    if (indice === null) return null;
    const banda = this.geometria().bandas[indice];
    if (!banda) return null;

    const filas = this.series().map((s) => ({ id: s.id, etiqueta: s.etiqueta, color: s.color, valor: s.valores[indice] ?? 0 }));
    const porcentaje = (banda.centro / ANCHO_GRAFICO) * 100;
    return {
      titulo: this.categoriasLargas()[indice] ?? banda.etiqueta,
      total: filas.reduce((suma, f) => suma + f.valor, 0),
      filas,
      // A la derecha del mes en la primera mitad; a la izquierda en la segunda, para no salirse.
      izquierda: porcentaje <= 55 ? `calc(${porcentaje}% + 18px)` : null,
      derecha: porcentaje > 55 ? `calc(${100 - porcentaje}% + 18px)` : null
    };
  });

  formatear = formatearEntero;

  activar(indice: number): void {
    this.bandaActiva.set(indice);
  }

  desactivar(indice: number): void {
    if (this.bandaActiva() === indice) this.bandaActiva.set(null);
  }
}
