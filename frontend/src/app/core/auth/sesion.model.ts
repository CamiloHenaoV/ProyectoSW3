import { Rol } from './roles';

export interface SesionUsuario {
  /** Identificador del usuario en el proveedor de identidad (claim sub). */
  id: string;
  nombre: string;
  email: string;
  roles: Rol[];
  /** Id del médico/terapista vinculado al usuario (claim opcional medico_id). */
  medicoId: string | null;
}

export interface CredencialesLogin {
  email: string;
  password: string;
}
