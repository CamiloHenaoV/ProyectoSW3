import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';

import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';

describe('app routes', () => {
  let authService: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    hasRole: ReturnType<typeof vi.fn>;
  };
  let router: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = {
      isAuthenticated: vi.fn(),
      hasRole: vi.fn()
    };
    router = {
      createUrlTree: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('should redirect unauthenticated users to the login page', () => {
    authService.isAuthenticated.mockReturnValue(false);
    router.createUrlTree.mockImplementation((commands: unknown[]) => ({ commands } as unknown as UrlTree));

    const agendarRoute = routes.find((route) => route.path === 'agendar');
    const guard = (agendarRoute?.canActivate as Array<() => boolean | UrlTree>)[0];

    const result = TestBed.runInInjectionContext(() => guard());

    expect(result).toEqual({ commands: ['/login'] });
  });

  it('should allow only pacientes to access patient routes', () => {
    authService.isAuthenticated.mockReturnValue(true);
    authService.hasRole.mockImplementation((role: string) => role === 'Paciente');

    const agendarRoute = routes.find((route) => route.path === 'agendar');
    const guards = agendarRoute?.canActivate as Array<() => boolean | UrlTree>;

    const result = TestBed.runInInjectionContext(() => guards[1]());

    expect(result).toBe(true);
  });

  it('should expose the main public routes', () => {
    expect(routes.some((route) => route.path === 'login')).toBe(true);
    expect(routes.some((route) => route.path === 'registro')).toBe(true);
    expect(routes.some((route) => route.path === 'agendar')).toBe(true);
    expect(routes.some((route) => route.path === 'citas')).toBe(true);
    expect(routes.some((route) => route.path === 'admin/configuracion')).toBe(true);
  });
});
