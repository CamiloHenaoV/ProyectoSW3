import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Rol } from './roles';

/** Exige sesión iniciada; si no, envía al login. */
export const autenticadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticado() ? true : inject(Router).createUrlTree(['/login']);
};

/**
 * Exige al menos uno de los roles indicados. Un usuario autenticado sin el
 * rol va a /no-autorizado (no al login, para no generar un ciclo).
 * La validación definitiva siempre la hace la API (401/403).
 */
export function rolesGuard(...roles: Rol[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.autenticado()) return router.createUrlTree(['/login']);
    return auth.tieneAlgunRol(roles) ? true : router.createUrlTree(['/no-autorizado']);
  };
}

/** Para login y registro: si ya hay sesión, lleva a la pantalla de inicio del rol. */
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.autenticado() ? inject(Router).parseUrl(auth.rutaInicio()) : true;
};
