export interface Medico {
  id: string;
  nombre: string;
  especialidad: string;
  activo: boolean;
}

export interface CitaListado {
  id: string;
  medicoId: string;
  nombreMedico: string;
  fecha: string;
  horaInicio: string; // "HH:mm:ss"
  horaFin: string;
  estado: string;
  pacienteId: string | null;
  pacienteNombre?: string | null;
}

export interface FranjaDisponible {
  fecha: string;
  horaInicio: string;
  horaFin: string;
}

export interface AgendarCitaRequest {
  medicoId: string;
  pacienteId: string;
  fecha: string;
  horaInicio: string;
}

export interface ReagendarCitaRequest {
  fecha: string;
  horaInicio: string;
}