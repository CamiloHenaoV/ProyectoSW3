import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { AuthService } from './auth.service';
import { autenticadoGuard, invitadoGuard, rolesGuard } from './auth.guards';
import { Rol } from './roles';

describe('guards de autenticación y autorización', () => {
  let auth: {
    autenticado: ReturnType<typeof vi.fn>;
    tieneAlgunRol: ReturnType<typeof vi.fn>;
    rutaInicio: ReturnType<typeof vi.fn>;
  };

  const correr = (guard: any) =>
    TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  const url = (resultado: unknown) => TestBed.inject(Router).serializeUrl(resultado as UrlTree);

  beforeEach(() => {
    auth = { autenticado: vi.fn(), tieneAlgunRol: vi.fn(), rutaInicio: vi.fn() };
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: AuthService, useValue: auth }] });
  });

  it('autenticadoGuard envía al login si no hay sesión', () => {
    auth.autenticado.mockReturnValue(false);
    expect(url(correr(autenticadoGuard))).toBe('/login');
    auth.autenticado.mockReturnValue(true);
    expect(correr(autenticadoGuard)).toBe(true);
  });

  it('rolesGuard deja pasar solo a los roles permitidos', () => {
    auth.autenticado.mockReturnValue(true);
    auth.tieneAlgunRol.mockImplementation((roles: Rol[]) => roles.includes(Rol.Agendador));
    expect(correr(rolesGuard(Rol.Agendador, Rol.Medico))).toBe(true);
  });

  it('rolesGuard envía a /no-autorizado a un usuario autenticado sin el rol', () => {
    auth.autenticado.mockReturnValue(true);
    auth.tieneAlgunRol.mockReturnValue(false);
    expect(url(correr(rolesGuard(Rol.Administrador)))).toBe('/no-autorizado');
  });

  it('rolesGuard envía al login si no hay sesión', () => {
    auth.autenticado.mockReturnValue(false);
    expect(url(correr(rolesGuard(Rol.Paciente)))).toBe('/login');
  });

  it('invitadoGuard redirige al inicio del rol si ya hay sesión', () => {
    auth.autenticado.mockReturnValue(true);
    auth.rutaInicio.mockReturnValue('/citas');
    expect(url(correr(invitadoGuard))).toBe('/citas');
    auth.autenticado.mockReturnValue(false);
    expect(correr(invitadoGuard)).toBe(true);
  });
});
