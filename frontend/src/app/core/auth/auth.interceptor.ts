import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

/**
 * Eslabón de la cadena de interceptores HTTP (patrón Chain of Responsibility):
 * adjunta el Bearer token solo a peticiones hacia nuestra API y, ante un 401,
 * descarta la sesión y envía al login. Los 403 se dejan pasar para que cada
 * pantalla muestre el mensaje adecuado.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  return from(authService.obtenerToken()).pipe(
    switchMap((token) => next(token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req)),
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        authService.descartarSesion();
        router.navigateByUrl('/login');
      }
      return throwError(() => error);
    })
  );
};
