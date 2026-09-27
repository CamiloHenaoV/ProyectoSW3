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