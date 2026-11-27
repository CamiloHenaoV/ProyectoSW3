import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CitasService } from './citas.service';
import { environment } from '../../../environments/environment';

describe('CitasService · cancelar (RF6)', () => {
  let servicio: CitasService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/citas/cita-1/cancelar`;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(CitasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía la justificación (sin espacios en los extremos) en el cuerpo', () => {
    servicio.cancelar('cita-1', '  No puedo asistir  ').subscribe();
    const req = http.expectOne(url);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ motivo: 'No puedo asistir' });
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('envía un cuerpo vacío cuando no hay motivo (cancelación del personal)', () => {
    servicio.cancelar('cita-1').subscribe();
    const req = http.expectOne(url);
    expect(req.request.body).toEqual({});
    req.flush(null, { status: 204, statusText: 'No Content' });
  });

  it('no envía un motivo compuesto solo por espacios', () => {
    servicio.cancelar('cita-1', '   ').subscribe();
    const req = http.expectOne(url);
    expect(req.request.body).toEqual({});
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});
