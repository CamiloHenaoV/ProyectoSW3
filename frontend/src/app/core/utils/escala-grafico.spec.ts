import { escalaEje, formatearEntero } from './escala-grafico';

describe('escalaEje (RF7)', () => {
  it('redondea el tope a un paso limpio y genera marcas enteras', () => {
    expect(escalaEje(37)).toEqual({ tope: 40, marcas: [0, 10, 20, 30, 40] });
    expect(escalaEje(7)).toEqual({ tope: 8, marcas: [0, 2, 4, 6, 8] });
    expect(escalaEje(130).tope).toBe(150);
  });

  it('nunca usa pasos fraccionarios para conteos', () => {
    expect(escalaEje(2).marcas).toEqual([0, 1, 2]);
    expect(escalaEje(1).marcas).toEqual([0, 1]);
  });

  it('devuelve un eje utilizable cuando no hay datos', () => {
    expect(escalaEje(0)).toEqual({ tope: 4, marcas: [0, 1, 2, 3, 4] });
    expect(escalaEje(Number.NaN).tope).toBe(4);
  });

  it('formatea enteros con el separador de miles de Colombia', () => {
    expect(formatearEntero(1284)).toBe('1.284');
    expect(formatearEntero(7)).toBe('7');
  });
});
