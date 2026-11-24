import { ReporteCitasMensual, SerieCitasMedico } from '../models/reporte.model';
import { COLOR_OTROS, ID_OTROS, PALETA_SERIES, aniosSeleccionables, prepararSeries, resumirReporte } from './reporte-citas';

const meses = (...valores: number[]) => Array.from({ length: 12 }, (_, i) => valores[i] ?? 0);
const serie = (medicoId: string, nombre: string, valores: number[]): SerieCitasMedico => ({
  medicoId,
  nombreMedico: nombre,
  especialidad: 'Medicina General',
  citasPorMes: valores,
  total: valores.reduce((a, b) => a + b, 0)
});

describe('utilidades del reporte de citas (RF7)', () => {
  it('ofrece el año siguiente, el actual y los anteriores, del más reciente al más antiguo', () => {
    expect(aniosSeleccionables(2026, 2)).toEqual([2027, 2026, 2025, 2024]);
  });

  it('asigna el color por el lugar del profesional en el listado, no por su posición en el resultado', () => {
    const orden = ['m1', 'm2', 'm3'];
    const todos = prepararSeries([serie('m3', 'C', meses(1)), serie('m1', 'A', meses(1)), serie('m2', 'B', meses(1))], orden);
    const soloTercero = prepararSeries([serie('m3', 'C', meses(1))], orden);

    expect(todos.map((s) => s.id)).toEqual(['m1', 'm2', 'm3']);
    expect(todos[2].color).toBe(PALETA_SERIES[2]);
    // Filtrar por un profesional no lo "repinta".
    expect(soloTercero[0].color).toBe(PALETA_SERIES[2]);
  });

  it('agrupa en «Otros» cuando hay más profesionales que colores validados', () => {
    const muchos = Array.from({ length: 10 }, (_, i) => serie(`m${i}`, `Prof ${i}`, meses(i + 1)));
    const series = prepararSeries(muchos, muchos.map((s) => s.medicoId));

    expect(series).toHaveLength(PALETA_SERIES.length);
    const otros = series[series.length - 1];
    expect(otros.id).toBe(ID_OTROS);
    expect(otros.color).toBe(COLOR_OTROS);
    // Se agrupan los de menor total: Prof 0 (1), Prof 1 (2) y Prof 2 (3).
    expect(otros.valores[0]).toBe(6);
    expect(new Set(series.map((s) => s.color)).size).toBe(series.length);
  });

  it('resume el total, el mes pico, el promedio y el profesional con más citas', () => {
    const reporte: ReporteCitasMensual = {
      anio: 2026,
      incluyeCanceladas: false,
      medicos: [serie('m1', 'Dra. Ana', meses(2, 0, 6)), serie('m2', 'Dr. Julián', meses(1, 0, 1))],
      totalesPorMes: meses(3, 0, 7),
      total: 10
    };

    expect(resumirReporte(reporte)).toEqual({
      total: 10,
      mesPico: { mes: 'marzo', cantidad: 7 },
      promedioMensual: 5,
      profesionalLider: { nombre: 'Dra. Ana', cantidad: 8 }
    });
  });

  it('no inventa un mes pico ni un líder cuando el año no tiene citas', () => {
    const vacio: ReporteCitasMensual = { anio: 2020, incluyeCanceladas: false, medicos: [serie('m1', 'A', meses())], totalesPorMes: meses(), total: 0 };
    expect(resumirReporte(vacio)).toEqual({ total: 0, mesPico: null, promedioMensual: 0, profesionalLider: null });
  });
});
