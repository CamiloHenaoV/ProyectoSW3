import { ExportadorCitas } from './exportador-citas';
import { ExportadorFactory } from './exportador.factory';

describe('ExportadorFactory', () => {
  it('trae los formatos CSV registrados por defecto', () => {
    const fabrica = new ExportadorFactory();
    expect(fabrica.disponibles().map((e) => e.id)).toEqual(['csv-excel', 'csv']);
    expect(fabrica.obtener('csv').extension).toBe('csv');
  });

  it('permite registrar un formato nuevo sin modificar la fábrica (abierto/cerrado)', () => {
    const fabrica = new ExportadorFactory();
    const json: ExportadorCitas = {
      id: 'json',
      etiqueta: 'JSON',
      extension: 'json',
      tipoMime: 'application/json',
      generar: (citas) => JSON.stringify(citas)
    };
    fabrica.registrar(json);
    expect(fabrica.obtener('json')).toBe(json);
  });

  it('falla con un mensaje claro si el formato no existe', () => {
    expect(() => new ExportadorFactory().obtener('pdf')).toThrow('Formato de exportación no soportado: pdf');
  });
});
