import { CitaListado } from '../models/cita.model';
import {
  cumplePlazoCancelacion,
  horasParaLaCita,
  mensajeErrorMotivo,
  puedeCancelarCita,
  validarMotivo
} from './cancelacion';

// Reloj de referencia: 2026-03-10 15:00 UTC = 2026-03-10 10:00 en Colombia (UTC-5).
// El límite de 48 h cae exactamente el 2026-03-12 a las 10:00 (hora de Colombia).
const AHORA = new Date('2026-03-10T15:00:00Z');

function cita(fecha: string, horaInicio: string, estado = 'Agendada'): CitaListado {
  return {
    id: 'c1',
    medicoId: 'm1',
    nombreMedico: 'Dra. Ana Restrepo',
    fecha,
    horaInicio,
    horaFin: '11:00:00',
    estado,
    pacienteId: 'p1'
  };
}

describe('plazo de cancelación (RF6)', () => {
  it('permite cancelar exactamente a 48 horas', () => {
    const c = cita('2026-03-12T00:00:00', '10:00:00');
    expect(horasParaLaCita(c, AHORA)).toBe(48);
    expect(cumplePlazoCancelacion(c, AHORA)).toBe(true);
  });

  it('rechaza un minuto antes del límite y permite un minuto después', () => {
    expect(cumplePlazoCancelacion(cita('2026-03-12T00:00:00', '09:59:00'), AHORA)).toBe(false);
    expect(cumplePlazoCancelacion(cita('2026-03-12T00:00:00', '10:01:00'), AHORA)).toBe(true);
  });

  it('rechaza citas de mañana, de hoy y ya pasadas', () => {
    expect(cumplePlazoCancelacion(cita('2026-03-11T00:00:00', '10:00:00'), AHORA)).toBe(false);
    expect(cumplePlazoCancelacion(cita('2026-03-10T00:00:00', '16:00:00'), AHORA)).toBe(false);
    expect(cumplePlazoCancelacion(cita('2026-03-09T00:00:00', '10:00:00'), AHORA)).toBe(false);
  });

  it('permite citas con más de dos días de anticipación', () => {
    expect(cumplePlazoCancelacion(cita('2026-03-20T00:00:00', '08:00:00'), AHORA)).toBe(true);
  });

  it('calcula el plazo en hora de Colombia y no en UTC', () => {
    // 12/03 12:00 en Colombia está a 50 h; contra la hora UTC serían 45 h y se rechazaría por error.
    expect(cumplePlazoCancelacion(cita('2026-03-12T00:00:00', '12:00:00'), AHORA)).toBe(true);
  });

  it('acepta la fecha con o sin hora y con sufijo de zona', () => {
    expect(cumplePlazoCancelacion(cita('2026-03-20', '08:00:00'), AHORA)).toBe(true);
    expect(cumplePlazoCancelacion(cita('2026-03-20T00:00:00Z', '08:00:00'), AHORA)).toBe(true);
  });

  it('solo se pueden cancelar citas agendadas', () => {
    const lejana = ['2026-03-20T00:00:00', '08:00:00'] as const;
    expect(puedeCancelarCita(cita(...lejana), AHORA)).toBe(true);
    expect(puedeCancelarCita(cita(...lejana, 'Cancelada'), AHORA)).toBe(false);
    expect(puedeCancelarCita(cita(...lejana, 'Atendida'), AHORA)).toBe(false);
  });
});

describe('justificación de la cancelación', () => {
  it('es obligatoria y no cuenta los espacios', () => {
    expect(validarMotivo('')).toBe('vacio');
    expect(validarMotivo('     ')).toBe('vacio');
    expect(mensajeErrorMotivo('vacio')).toContain('justificación');
  });

  it('acepta hasta 500 caracteres (sin contar espacios de los extremos) y rechaza más', () => {
    expect(validarMotivo('Tengo un viaje')).toBeNull();
    expect(validarMotivo(`  ${'a'.repeat(500)}  `)).toBeNull();
    expect(validarMotivo('a'.repeat(501))).toBe('muy-largo');
    expect(mensajeErrorMotivo('muy-largo')).toContain('500');
    expect(mensajeErrorMotivo(null)).toBe('');
  });
});
