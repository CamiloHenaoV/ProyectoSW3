import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse, LoginRequest, UsuarioAutenticadoDto } from '../models/auth.model';

const TOKEN_KEY = 'citas_medicas_token';
const USER_KEY = 'citas_medicas_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, request).pipe(
      tap((response) => this.guardarSesion(response))
    );
  }

  guardarSesion(response: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.usuario));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getToken(): string | null {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return null;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1] ?? ''));
      const exp = Number(payload.exp ?? 0) * 1000;
      if (!Number.isFinite(exp) || Date.now() >= exp) {
        this.logout();
        return null;
      }
    } catch {
      this.logout();
      return null;
    }

    return token;
  }

  getUsuario(): UsuarioAutenticadoDto | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as UsuarioAutenticadoDto;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasRole(role: string): boolean {
    const usuario = this.getUsuario();
    return !!usuario && usuario.rol === role;
  }

  getHomeRoute(): string {
    const usuario = this.getUsuario();
    if (!usuario) {
      return '/login';
    }

    if (usuario.rol === 'Paciente') {
      return '/agendar';
    }

    if (usuario.rol === 'Agendador') {
      return '/citas';
    }

    return '/admin/configuracion';
  }
}
