const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

function aIso(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** Interpreta "yyyy-MM-dd" (o un ISO con hora) como fecha local, sin corrimiento por zona horaria. */
export function desdeIso(fechaIso: string): Date {
  const [anio, mes, dia] = fechaIso.substring(0, 10).split('-').map(Number);
  return new Date(anio, (mes ?? 1) - 1, dia ?? 1);
}

/**
 * Fecha de hoy en hora local. Evita el error de toISOString(), que en Colombia
 * (UTC-5) devuelve el día siguiente después de las 7 p. m.
 */
export function hoyLocal(ahora: Date = new Date()): string {
  return aIso(ahora);
}

export function sumarDias(fechaIso: string, dias: number): string {
  const fecha = desdeIso(fechaIso);
  fecha.setDate(fecha.getDate() + dias);
  return aIso(fecha);
}

export function rangoDeDias(desdeFechaIso: string, cantidad: number): string[] {
  return Array.from({ length: cantidad }, (_, i) => sumarDias(desdeFechaIso, i));
}

/** "08:30:00" → "08:30" */
export function formatearHora(hora: string | null | undefined): string {
  if (!hora) return '';
  const [h = '', m = ''] = hora.split(':');
  return m ? `${h.padStart(2, '0')}:${m.padStart(2, '0')}` : hora;
}

export function minutosDelDia(hora: string): number {
  const [h = '0', m = '0'] = hora.split(':');
  return Number(h) * 60 + Number(m);
}

export function diaCorto(fechaIso: string): string {
  return DIAS_CORTOS[desdeIso(fechaIso).getDay()];
}

export function numeroDia(fechaIso: string): number {
  return desdeIso(fechaIso).getDate();
}

/** "2026-11-03" → "martes, 3 de noviembre de 2026" */
export function fechaLarga(fechaIso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(desdeIso(fechaIso));
}

/** "2026-11-03" → "03/11/2026" */
export function fechaCorta(fechaIso: string): string {
  const [anio, mes, dia] = fechaIso.substring(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}
