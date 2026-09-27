export interface Medico {
  id: string;
  nombre: string;
  especialidad: string;
}

export interface CitaListado {
  id: string;
  medicoId: string;
  medicoNombre: string;
  fecha: string;
  horaInicio: string; // "HH:mm:ss"
  horaFin: string;
  estado: string;
  pacienteId: string | null;
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