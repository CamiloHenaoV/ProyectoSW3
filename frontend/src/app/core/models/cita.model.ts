export interface Medico {
  id: string;
  nombre: string;
  especialidad: string;
  activo: boolean;
}

export type EstadoCita = 'Agendada' | 'Cancelada' | 'Atendida' | 'Disponible' | string;

export interface CitaListado {
  id: string;
  medicoId: string;
  nombreMedico: string;
  fecha: string;
  horaInicio: string; // "HH:mm:ss"
  horaFin: string;
  estado: EstadoCita;
  pacienteId: string | null;
  pacienteNombre?: string | null;
  /** Cédula del paciente; opcional, se muestra y exporta si el backend la envía. */
  pacienteDocumento?: string | null;
  especialidadMedico?: string | null;
}

export interface FranjaDisponible {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

/** El paciente se toma del token en el backend; el frontend no lo envía. */
export interface AgendarCitaRequest {
  medicoId: string;
  fecha: string;
  horaInicio: string;
}

export interface ReagendarCitaRequest {
  fecha: string;
  horaInicio: string;
}
