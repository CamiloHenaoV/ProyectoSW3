import { TestBed } from '@angular/core/testing';
import { ExportacionCitasService, nombreArchivo } from './exportacion-citas.service';

describe('ExportacionCitasService', () => {
  it('arma un nombre de archivo seguro con el profesional y la fecha', () => {
    expect(nombreArchivo({ medico: 'Dra. Ana Restrepo Muñoz', fecha: '2026-11-03' }, 'csv')).toBe(
      'citas_dra-ana-restrepo-munoz_2026-11-03.csv'
    );
    expect(nombreArchivo({ medico: '***', fecha: '2026-11-03' }, 'csv')).toBe('citas_profesional_2026-11-03.csv');
  });

  it('descarga el archivo generado por el exportador elegido', () => {
    const crearUrl = vi.fn().mockReturnValue('blob:prueba');
    const revocar = vi.fn();
    Object.assign(URL, { createObjectURL: crearUrl, revokeObjectURL: revocar });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const service = TestBed.inject(ExportacionCitasService);
    const archivo = service.exportar([], 'csv-excel', { medico: 'Dr. Julián Torres', fecha: '2026-11-04' });

    expect(archivo).toBe('citas_dr-julian-torres_2026-11-04.csv');
    expect(crearUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect(document.querySelector('a[download]')).toBeNull();
    click.mockRestore();
  });

  it('expone los formatos para el selector de la pantalla', () => {
    expect(TestBed.inject(ExportacionCitasService).formatos()).toEqual([
      { value: 'csv-excel', label: 'CSV para Excel (;)' },
      { value: 'csv', label: 'CSV estándar (,)' }
    ]);
  });
});
