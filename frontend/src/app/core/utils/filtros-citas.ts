import { CitaListado } from '../models/cita.model';
import { minutosDelDia } from './fechas';

export const ESTADOS_CITA = ['Agendada', 'Atendida', 'Cancelada'] as const;

export interface FiltroCitas {
  /** '' significa todos los estados. */
  estado: string;
  /** Texto libre: nombre o cédula del paciente. */
  texto: string;
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function filtrarCitas(citas: readonly CitaListado[], filtro: FiltroCitas): CitaListado[] {
  const texto = normalizar(filtro.texto);
  return citas.filter((cita) => {
    if (filtro.estado && cita.estado !== filtro.estado) return false;
    if (!texto) return true;
    const campos = [cita.pacienteNombre ?? '', cita.pacienteDocumento ?? ''].map(normalizar);
    return campos.some((campo) => campo.includes(texto));
  });
}

export function contarPorEstado(citas: readonly CitaListado[]): Partial<Record<string, number>> {
  return citas.reduce<Partial<Record<string, number>>>((conteo, cita) => {
    conteo[cita.estado] = (conteo[cita.estado] ?? 0) + 1;
    return conteo;
  }, {});
}

export function ordenarPorHora(citas: readonly CitaListado[]): CitaListado[] {
  return [...citas].sort((a, b) => minutosDelDia(a.horaInicio) - minutosDelDia(b.horaInicio));
}

/** Historial: de la más reciente a la más antigua. */
export function ordenarRecientesPrimero(citas: readonly CitaListado[]): CitaListado[] {
  return [...citas].sort((a, b) => {
    const porFecha = b.fecha.substring(0, 10).localeCompare(a.fecha.substring(0, 10));
    return porFecha !== 0 ? porFecha : minutosDelDia(b.horaInicio) - minutosDelDia(a.horaInicio);
  });
}
