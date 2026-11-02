import { HttpErrorResponse } from '@angular/common/http';

/**
 * Traduce un error HTTP a un mensaje para el usuario. Usa el detalle que
 * envía la API (ProblemDetails.detail o { mensaje }) cuando existe.
 */
export function mensajeDeError(error: unknown, porDefecto: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return porDefecto;
  }

  if (error.status === 0) {
    return 'No hay conexión con el servidor. Verifica que la API esté en ejecución.';
  }
  if (error.status === 403) {
    return 'Tu rol no tiene permiso para realizar esta acción.';
  }

  const cuerpo = error.error as { detail?: unknown; mensaje?: unknown } | null;
  const detalle = cuerpo?.detail ?? cuerpo?.mensaje;
  return typeof detalle === 'string' && detalle.trim() ? detalle : porDefecto;
}
