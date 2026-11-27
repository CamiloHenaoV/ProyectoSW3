import { CitaListado } from '../models/cita.model';

/**
 * Dos días de anticipación antes del inicio de la cita
 * Fecha y hora de la cita son la hora de pared de Colombia (UTC-5, sin horario de verano)
 */
export const HORAS_ANTICIPACION_CANCELACION = 48;
export const LONGITUD_MAXIMA_MOTIVO = 500;

export const MENSAJE_PLAZO_CANCELACION =
  'Solo puedes cancelar una cita con al menos 2 días (48 horas) de anticipación.';

const MS_POR_HORA = 3_600_000;
const DESFASE_COLOMBIA_MS = -5 * MS_POR_HORA;

type CitaConInicio = Pick<CitaListado, 'fecha' | 'horaInicio'>;

/**Inicio de la cita como hora de pared de Colombia*/
function inicioCitaMs(cita: CitaConInicio): number {
  const [anio, mes, dia] = cita.fecha.substring(0, 10).split('-').map(Number);
  const [hora = 0, minuto = 0] = cita.horaInicio.split(':').map(Number);
  return Date.UTC(anio, (mes ?? 1) - 1, dia ?? 1, hora, minuto);
}

/**El instante actual expresado como hora de pared de Colombia*/
function ahoraColombiaMs(ahora: Date): number {
  return ahora.getTime() + DESFASE_COLOMBIA_MS;
}

export function horasParaLaCita(cita: CitaConInicio, ahora: Date = new Date()): number {
  return (inicioCitaMs(cita) - ahoraColombiaMs(ahora)) / MS_POR_HORA;
}

/**True si la cita está a 48 horas o más*/
export function cumplePlazoCancelacion(cita: CitaConInicio, ahora: Date = new Date()): boolean {
  return horasParaLaCita(cita, ahora) >= HORAS_ANTICIPACION_CANCELACION;
}

/** Una cita puede cancelarla el paciente si sigue agendada y cumple el plazo*/
export function puedeCancelarCita(cita: CitaListado, ahora: Date = new Date()): boolean {
  return cita.estado === 'Agendada' && cumplePlazoCancelacion(cita, ahora);
}

export type ErrorMotivo = 'vacio' | 'muy-largo' | null;

/** Valida la justificación obligatoria y de máximo 500 caracteres. */
export function validarMotivo(motivo: string): ErrorMotivo {
  const limpio = motivo.trim();
  if (!limpio) return 'vacio';
  if (limpio.length > LONGITUD_MAXIMA_MOTIVO) return 'muy-largo';
  return null;
}

export function mensajeErrorMotivo(error: ErrorMotivo): string {
  switch (error) {
    case 'vacio':
      return 'Escribe la justificación de la cancelación.';
    case 'muy-largo':
      return `La justificación no puede superar ${LONGITUD_MAXIMA_MOTIVO} caracteres.`;
    default:
      return '';
  }
}
