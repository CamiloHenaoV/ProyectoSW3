import { validarConfiguracion } from './formulario-configuracion';

describe('validarConfiguracion (RF3)', () => {
  const valida = {
    medicoId: 'm1',
    diasAtencion: [1, 3, 5],
    horaInicio: '08:00:00',
    horaFin: '12:00:00',
    intervaloMinutos: 30,
    semanasHabilitadas: 4
  };

  it('acepta una configuración correcta', () => {
    expect(validarConfiguracion(valida)).toEqual([]);
  });

  it('rechaza configuraciones incoherentes', () => {
    expect(validarConfiguracion({ ...valida, diasAtencion: [] })).toContain('Selecciona al menos un día de atención.');
    expect(validarConfiguracion({ ...valida, horaFin: '07:00:00' })).toContain(
      'La hora de fin debe ser posterior a la hora de inicio.'
    );
    expect(validarConfiguracion({ ...valida, intervaloMinutos: 2 })[0]).toContain('entre 5 y 240');
    expect(validarConfiguracion({ ...valida, horaFin: '08:20:00' })[0]).toContain('más corta que el intervalo');
    expect(validarConfiguracion({ ...valida, semanasHabilitadas: 0 })[0]).toContain('entre 1 y 52');
  });

  it('muestra un solo error cuando la hora de fin es anterior a la de inicio', () => {
    expect(validarConfiguracion({ ...valida, horaFin: '07:00:00' })).toEqual([
      'La hora de fin debe ser posterior a la hora de inicio.'
    ]);
  });
});
