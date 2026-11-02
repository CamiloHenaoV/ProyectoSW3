export interface RegistroPacienteRequest {
  nombre: string;
  documentoIdentidad: string;
  telefono: string;
  email: string;
  password: string;
}

export interface Paciente {
  id: string;
  nombre: string;
  documentoIdentidad: string;
  telefono: string;
  email: string;
}

/** Resultado del autocompletado por cédula (RF5). */
export type PacienteResumen = Pick<Paciente, 'id' | 'nombre' | 'documentoIdentidad'>;
