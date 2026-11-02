import { HttpErrorResponse } from '@angular/common/http';
import { mensajeDeError } from './http-errores';

describe('mensajeDeError', () => {
  it('usa el detail de ProblemDetails o el mensaje de la API', () => {
    expect(mensajeDeError(new HttpErrorResponse({ status: 409, error: { detail: 'La franja ya fue tomada.' } }), 'x')).toBe(
      'La franja ya fue tomada.'
    );
    expect(mensajeDeError(new HttpErrorResponse({ status: 400, error: { mensaje: 'Falta el médico.' } }), 'x')).toBe(
      'Falta el médico.'
    );
  });

  it('da mensajes claros para falta de conexión y falta de permisos', () => {
    expect(mensajeDeError(new HttpErrorResponse({ status: 0 }), 'x')).toContain('No hay conexión');
    expect(mensajeDeError(new HttpErrorResponse({ status: 403 }), 'x')).toContain('no tiene permiso');
  });

  it('usa el mensaje por defecto en los demás casos', () => {
    expect(mensajeDeError(new HttpErrorResponse({ status: 500 }), 'Algo falló.')).toBe('Algo falló.');
    expect(mensajeDeError(new Error('otro'), 'Algo falló.')).toBe('Algo falló.');
  });
});
