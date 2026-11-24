import { ReporteCitasMensual, SerieCitasMedico } from '../models/reporte.model';

export const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] as const;
export const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
] as const;

/**
 * Paleta categórica validada (contraste de daltonismo y visión normal entre vecinos)
 * con scripts/validate_palette.js del skill de visualización. El orden es parte de la
 * validación: los colores se asignan siempre en este orden, nunca se generan nuevos.
 */
export const PALETA_SERIES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'] as const;
export const COLOR_OTROS = '#94a3b8';
export const ID_OTROS = '__otros__';

export interface SerieGrafico {
  id: string;
  etiqueta: string;
  detalle: string;
  color: string;
  valores: number[];
  total: number;
}

/** Años que se pueden elegir: el siguiente (la agenda puede abrirse hacia él) y los anteriores. */
export function aniosSeleccionables(anioActual: number, anteriores = 9): number[] {
  return Array.from({ length: anteriores + 2 }, (_, i) => anioActual + 1 - i);
}

/**
 * Convierte las series del reporte en series del gráfico.
 * El color sigue al profesional, no a su posición en el resultado: se toma de su lugar
 * en `ordenEstable` (el listado de médicos), así filtrar por uno no lo "repinta".
 * Si hay más profesionales que colores, los de menos citas se agrupan en «Otros».
 */
export function prepararSeries(
  series: readonly SerieCitasMedico[],
  ordenEstable: readonly string[]
): SerieGrafico[] {
  const posicion = (id: string) => {
    const i = ordenEstable.indexOf(id);
    return i === -1 ? ordenEstable.length + series.findIndex((s) => s.medicoId === id) : i;
  };
  const ordenadas = [...series].sort((a, b) => posicion(a.medicoId) - posicion(b.medicoId));

  const aSerie = (s: SerieCitasMedico, color: string): SerieGrafico => ({
    id: s.medicoId,
    etiqueta: s.nombreMedico,
    detalle: s.especialidad,
    color,
    valores: [...s.citasPorMes],
    total: s.total
  });

  if (ordenadas.length <= PALETA_SERIES.length) {
    // Si algún profesional queda fuera de los 8 primeros del listado, se reparte por orden para no repetir colores.
    const porPosicion = ordenadas.every((s) => posicion(s.medicoId) < PALETA_SERIES.length);
    return ordenadas.map((s, i) => aSerie(s, PALETA_SERIES[porPosicion ? posicion(s.medicoId) : i]));
  }

  // Más series que colores: se conservan las de mayor total y el resto se agrupa.
  const cupo = PALETA_SERIES.length - 1;
  const conservadas = new Set([...ordenadas].sort((a, b) => b.total - a.total).slice(0, cupo).map((s) => s.medicoId));
  const visibles = ordenadas.filter((s) => conservadas.has(s.medicoId)).map((s, i) => aSerie(s, PALETA_SERIES[i]));
  const resto = ordenadas.filter((s) => !conservadas.has(s.medicoId));
  const valoresOtros = Array.from({ length: 12 }, (_, mes) => resto.reduce((suma, s) => suma + (s.citasPorMes[mes] ?? 0), 0));

  return [
    ...visibles,
    {
      id: ID_OTROS,
      etiqueta: `Otros (${resto.length})`,
      detalle: resto.map((s) => s.nombreMedico).join(', '),
      color: COLOR_OTROS,
      valores: valoresOtros,
      total: valoresOtros.reduce((a, b) => a + b, 0)
    }
  ];
}

export interface ResumenReporte {
  total: number;
  /** null si el año no tiene citas. */
  mesPico: { mes: string; cantidad: number } | null;
  /** Promedio sobre los meses que tuvieron al menos una cita. */
  promedioMensual: number;
  profesionalLider: { nombre: string; cantidad: number } | null;
}

export function resumirReporte(reporte: ReporteCitasMensual): ResumenReporte {
  const totales = reporte.totalesPorMes;
  const maximo = Math.max(0, ...totales);
  const indicePico = maximo > 0 ? totales.indexOf(maximo) : -1;
  const mesesConCitas = totales.filter((t) => t > 0).length;
  const lider = [...reporte.medicos].sort((a, b) => b.total - a.total)[0];

  return {
    total: reporte.total,
    mesPico: indicePico >= 0 ? { mes: MESES_LARGOS[indicePico], cantidad: maximo } : null,
    promedioMensual: mesesConCitas ? Math.round((reporte.total / mesesConCitas) * 10) / 10 : 0,
    profesionalLider: lider && lider.total > 0 ? { nombre: lider.nombreMedico, cantidad: lider.total } : null
  };
}
