import { desdeIso, diaCorto, fechaCorta, formatearHora, hoyLocal, minutosDelDia, rangoDeDias, sumarDias } from './fechas';

describe('utilidades de fechas', () => {
  it('usa la fecha local y no la UTC (8 p. m. en Colombia sigue siendo hoy)', () => {
    expect(hoyLocal(new Date(2026, 9, 30, 20, 30))).toBe('2026-10-30');
  });

  it('suma días cruzando meses y años', () => {
    expect(sumarDias('2026-10-30', 3)).toBe('2026-11-02');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDias('2026-11-02', -7)).toBe('2026-10-26');
  });

  it('genera un rango consecutivo de días', () => {
    expect(rangoDeDias('2026-11-02', 3)).toEqual(['2026-11-02', '2026-11-03', '2026-11-04']);
  });

  it('interpreta fechas ISO con hora sin corrimiento de zona horaria', () => {
    expect(desdeIso('2026-11-03T00:00:00Z').getDate()).toBe(3);
    expect(diaCorto('2026-11-03')).toBe('mar');
    expect(fechaCorta('2026-11-03T00:00:00')).toBe('03/11/2026');
  });

  it('formatea horas y las convierte a minutos', () => {
    expect(formatearHora('08:30:00')).toBe('08:30');
    expect(formatearHora('8:5')).toBe('08:05');
    expect(formatearHora(null)).toBe('');
    expect(minutosDelDia('14:20:00')).toBe(860);
  });
});
