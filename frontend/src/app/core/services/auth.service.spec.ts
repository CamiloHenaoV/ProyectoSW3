import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const usuario = {
    id: '123',
    nombre: 'Ana García',
    email: 'ana@piedrazul.com',
    rol: 'Paciente'
  };

  const createJwtToken = (expSeconds: number): string => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ exp: expSeconds }));
    return `${header}.${payload}.signature`;
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should persist the token and user after login', () => {
    const token = createJwtToken(Math.floor(Date.now() / 1000) + 3600);

    service.login({ email: 'ana@piedrazul.com', password: 'secret123' }).subscribe();

    const request = httpMock.expectOne('http://localhost:5039/api/auth/login');
    expect(request.request.method).toBe('POST');

    request.flush({
      token,
      expiraEn: '1h',
      usuario
    });

    expect(service.getToken()).toBe(token);
    expect(service.getUsuario()).toEqual(usuario);
    expect(localStorage.getItem('citas_medicas_token')).toBe(token);
    expect(localStorage.getItem('citas_medicas_user')).toBe(JSON.stringify(usuario));
  });

  it('should invalidate an expired token and clear the session', () => {
    localStorage.setItem('citas_medicas_token', createJwtToken(Math.floor(Date.now() / 1000) - 30));
    localStorage.setItem('citas_medicas_user', JSON.stringify(usuario));

    expect(service.getToken()).toBeNull();
    expect(localStorage.getItem('citas_medicas_token')).toBeNull();
    expect(localStorage.getItem('citas_medicas_user')).toBeNull();
  });

  it('should return the correct route for each user role', () => {
    localStorage.setItem('citas_medicas_user', JSON.stringify({ ...usuario, rol: 'Paciente' }));
    expect(service.getHomeRoute()).toBe('/agendar');

    localStorage.setItem('citas_medicas_user', JSON.stringify({ ...usuario, rol: 'Agendador' }));
    expect(service.getHomeRoute()).toBe('/citas');

    localStorage.setItem('citas_medicas_user', JSON.stringify({ ...usuario, rol: 'Administrador' }));
    expect(service.getHomeRoute()).toBe('/admin/configuracion');

    localStorage.removeItem('citas_medicas_user');
    expect(service.getHomeRoute()).toBe('/login');
  });
});
