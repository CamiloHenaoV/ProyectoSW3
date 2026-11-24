import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReportesService } from './reportes.service';
import { environment } from '../../../environments/environment';

describe('ReportesService (RF7)', () => {
  let servicio: ReportesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(ReportesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('envía el año y si se incluyen canceladas', () => {
    servicio.citasPorMes({ anio: 2026, incluirCanceladas: false }).subscribe();
    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/reportes/citas-por-mes`);
    expect(req.request.params.get('anio')).toBe('2026');
    expect(req.request.params.get('incluirCanceladas')).toBe('false');
    expect(req.request.params.has('medicoId')).toBe(false);
    req.flush({});
  });

  it('filtra por profesional solo cuando se elige uno', () => {
    servicio.citasPorMes({ anio: 2025, incluirCanceladas: true, medicoId: 'm1' }).subscribe();
    const req = http.expectOne((r) => r.url.endsWith('/reportes/citas-por-mes'));
    expect(req.request.params.get('medicoId')).toBe('m1');
    req.flush({});
  });
});
