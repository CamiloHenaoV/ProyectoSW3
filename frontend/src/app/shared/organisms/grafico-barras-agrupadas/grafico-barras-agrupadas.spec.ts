import { TestBed } from '@angular/core/testing';
import { SerieGrafico } from '../../../core/utils/reporte-citas';
import { GraficoBarrasAgrupadas, calcularGeometria, trazoColumna } from './grafico-barras-agrupadas';

const MESES = ['Ene', 'Feb', 'Mar'];
const LARGOS = ['enero', 'febrero', 'marzo'];
const series: SerieGrafico[] = [
  { id: 'm1', etiqueta: 'Dra. Ana', detalle: '', color: '#2a78d6', valores: [4, 0, 9], total: 13 },
  { id: 'm2', etiqueta: 'Dr. Julián', detalle: '', color: '#eb6834', valores: [2, 3, 0], total: 5 }
];

describe('GraficoBarrasAgrupadas (RF7)', () => {
  it('dibuja una barra por valor mayor que cero, con ancho máximo de 24 px', () => {
    const g = calcularGeometria(series, MESES, LARGOS, 'citas');

    expect(g.barras).toHaveLength(4);
    expect(g.barras.every((b) => b.ancho <= 24)).toBe(true);
    expect(g.escala.tope).toBe(10);
  });

  it('las barras crecen desde la misma línea base y su altura es proporcional al valor', () => {
    const g = calcularGeometria(series, MESES, LARGOS, 'citas');
    const nueve = g.barras.find((b) => b.valor === 9)!;
    const tres = g.barras.find((b) => b.valor === 3)!;

    expect(nueve.y + nueve.alto).toBeCloseTo(g.base);
    expect(tres.y + tres.alto).toBeCloseTo(g.base);
    expect(nueve.alto / tres.alto).toBeCloseTo(3);
  });

  it('etiqueta solo la barra más alta', () => {
    expect(calcularGeometria(series, MESES, LARGOS, 'citas').destacada?.valor).toBe(9);
  });

  it('describe cada mes para lectores de pantalla', () => {
    const g = calcularGeometria(series, MESES, LARGOS, 'citas');
    expect(g.bandas[0].descripcion).toBe('enero: 6 citas. Dra. Ana: 4; Dr. Julián: 2');
  });

  it('redondea solo la punta de la columna (base recta)', () => {
    const trazo = trazoColumna(10, 20, 20, 40);
    expect(trazo.startsWith('M10,60 V24 A4,4')).toBe(true);
    expect(trazo).toContain('V60 Z');
  });

  it('muestra leyenda, barras y tooltip con el detalle del mes enfocado', async () => {
    const fixture = TestBed.createComponent(GraficoBarrasAgrupadas);
    fixture.componentRef.setInput('series', series);
    fixture.componentRef.setInput('categorias', MESES);
    fixture.componentRef.setInput('categoriasLargas', LARGOS);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelectorAll('.leyenda li')).toHaveLength(2);
    expect(el.querySelectorAll('path.barra')).toHaveLength(4);

    el.querySelectorAll<SVGRectElement>('rect.zona')[2].dispatchEvent(new Event('focus'));
    await fixture.whenStable();
    const tooltip = el.querySelector('.tooltip')!;
    expect(tooltip.textContent).toContain('marzo');
    expect(tooltip.textContent).toContain('9');
    expect(el.querySelectorAll('path.barra--atenuada')).toHaveLength(3);
  });
});
