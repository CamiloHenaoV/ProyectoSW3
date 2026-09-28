import { HttpErrorResponse, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from './auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let authService: {
    getToken: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };
  let router: {
    navigateByUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = {
      getToken: vi.fn(),
      logout: vi.fn()
    };
    router = {
      navigateByUrl: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('should add the Bearer token to API requests', () => {
    authService.getToken.mockReturnValue('valid-token');
    const request = new HttpRequest('GET', 'http://localhost:5039/api/pacientes');
    const next = vi.fn().mockReturnValue(of(new HttpResponse({ status: 200, body: [] })));

    TestBed.runInInjectionContext(() => {
      authInterceptor(request, next).subscribe();
    });

    expect(next).toHaveBeenCalledTimes(1);
    const cloned = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(cloned.headers.get('Authorization')).toBe('Bearer valid-token');
  });

  it('should logout and redirect to login on 401 responses', () => {
    authService.getToken.mockReturnValue('expired-token');
    const request = new HttpRequest('GET', 'http://localhost:5039/api/pacientes');
    const next = vi.fn().mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' }))
    );

    TestBed.runInInjectionContext(() => {
      authInterceptor(request, next).subscribe({ error: () => undefined });
    });

    expect(authService.logout).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
