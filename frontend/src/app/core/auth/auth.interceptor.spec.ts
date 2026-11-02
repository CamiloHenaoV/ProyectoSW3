import { HttpErrorResponse, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let auth: { obtenerToken: ReturnType<typeof vi.fn>; descartarSesion: ReturnType<typeof vi.fn> };
  let router: { navigateByUrl: ReturnType<typeof vi.fn> };

  const ejecutar = (req: HttpRequest<unknown>, next: ReturnType<typeof vi.fn>) =>
    TestBed.runInInjectionContext(() => firstValueFrom(authInterceptor(req, next as unknown as HttpHandlerFn)));

  beforeEach(() => {
    auth = { obtenerToken: vi.fn().mockResolvedValue('token-valido'), descartarSesion: vi.fn() };
    router = { navigateByUrl: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('agrega el Bearer token a las peticiones hacia la API', async () => {
    const next = vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })));
    await ejecutar(new HttpRequest('GET', 'http://localhost:5039/api/citas'), next);
    const enviada = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(enviada.headers.get('Authorization')).toBe('Bearer token-valido');
  });

  it('no envía el token a otros dominios (p. ej. Keycloak o fuentes)', async () => {
    const next = vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })));
    await ejecutar(new HttpRequest('GET', 'https://fonts.googleapis.com/css'), next);
    expect((next.mock.calls[0][0] as HttpRequest<unknown>).headers.has('Authorization')).toBe(false);
    expect(auth.obtenerToken).not.toHaveBeenCalled();
  });

  it('envía la petición sin cabecera si no hay token', async () => {
    auth.obtenerToken.mockResolvedValueOnce(null);
    const next = vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })));
    await ejecutar(new HttpRequest('GET', 'http://localhost:5039/api/medicos'), next);
    expect((next.mock.calls[0][0] as HttpRequest<unknown>).headers.has('Authorization')).toBe(false);
  });

  it('ante un 401 descarta la sesión y va al login', async () => {
    const next = vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401 })));
    await expect(ejecutar(new HttpRequest('GET', 'http://localhost:5039/api/citas'), next)).rejects.toBeTruthy();
    expect(auth.descartarSesion).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('ante un 403 deja que la pantalla muestre el error', async () => {
    const next = vi.fn().mockReturnValue(throwError(() => new HttpErrorResponse({ status: 403 })));
    await expect(ejecutar(new HttpRequest('GET', 'http://localhost:5039/api/citas'), next)).rejects.toBeTruthy();
    expect(auth.descartarSesion).not.toHaveBeenCalled();
  });
});
