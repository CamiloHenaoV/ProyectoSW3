export interface LoginRequest {
  email: string;
  password: string;
}

export interface UsuarioAutenticadoDto {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export interface AuthResponse {
  token: string;
  expiraEn: string;
  usuario: UsuarioAutenticadoDto;
}
