import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MisCitasPage } from './mis-citas';
import { CitaListado } from '../../core/models/cita.model';
import { environment } from '../../../environments/environment';

// 2026-03-10 15:00 UTC = 10:00 en Colombia; el límite de 48 h es el 12/03 a las 10:00.
const AHORA = new Date('2026-03-10T15:00:00Z');
const URL_MIS_CITAS = `${environment.apiUrl}/citas/mis-citas`;
const URL_CANCELAR = `${environment.apiUrl}/citas/lejana/cancelar`;

const lejana: CitaListado = {
  id: 'lejana',
  medicoId: 'm1',
  nombreMedico: 'Dra. Ana Restrepo',
  fecha: '2026-03-20T00:00:00',
  horaInicio: '09:00:00',
  horaFin: '09:30:00',
  estado: 'Agendada',
  pacienteId: 'p1'
};
const cercana: CitaListado = { ...lejana, id: 'cercana', fecha: '2026-03-11T00:00:00' };

describe('MisCitasPage · cancelar cita (RF6)', () => {
  let fixture: ComponentFixture<MisCitasPage>;
  let http: HttpTestingController;
  let el: HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AHORA);
    TestBed.configureTestingModule({
      imports: [MisCitasPage],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MisCitasPage);
    el = fixture.nativeElement;
    fixture.detectChanges();
    http.expectOne(URL_MIS_CITAS).flush([lejana, cercana]);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  const boton = (texto: string) =>
    Array.from(el.querySelectorAll('button')).find((b) => b.textContent?.trim() === texto);

  const escribirMotivo = (texto: string) => {
    const area = el.querySelector('textarea')!;
    area.value = texto;
    area.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const abrirFormulario = () => {
    boton('Cancelar')!.click();
    fixture.detectChanges();
  };

  it('abre un formulario de justificación en lugar de cancelar de inmediato', () => {
    abrirFormulario();

    expect(el.querySelector('.cancelar-panel')).not.toBeNull();
    expect(el.querySelector('textarea')).not.toBeNull();
    http.expectNone(URL_CANCELAR);
  });

  it('no cancela si la justificación está vacía y muestra el error', () => {
    abrirFormulario();
    escribirMotivo('    ');

    boton('Confirmar cancelación')!.click();
    fixture.detectChanges();

    http.expectNone(URL_CANCELAR);
    expect(el.querySelector('.error-campo')?.textContent).toContain('justificación');
  });

  it('envía la justificación, cierra el formulario y recarga las citas', () => {
    abrirFormulario();
    escribirMotivo('Tengo un viaje');

    boton('Confirmar cancelación')!.click();
    const req = http.expectOne(URL_CANCELAR);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ motivo: 'Tengo un viaje' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    http.expectOne(URL_MIS_CITAS).flush([{ ...lejana, estado: 'Cancelada', motivoCancelacion: 'Tengo un viaje' }, cercana]);
    fixture.detectChanges();

    expect(el.querySelector('.cancelar-panel')).toBeNull();
    expect(el.querySelector('.aviso--exito')?.textContent).toContain('se canceló');
    expect(el.querySelector('.motivo')?.textContent).toContain('Tengo un viaje');
  });

  it('muestra dentro del formulario el error que devuelve la API (409)', () => {
    abrirFormulario();
    escribirMotivo('Tengo un viaje');

    boton('Confirmar cancelación')!.click();
    http
      .expectOne(URL_CANCELAR)
      .flush({ detail: 'Solo puedes cancelar una cita con al menos 2 días (48 horas) de anticipación.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(el.querySelector('.cancelar-panel .aviso--error')?.textContent).toContain('48 horas');
    expect(el.querySelector('.cancelar-panel')).not.toBeNull();
  });

  it('«Volver» descarta el formulario sin cancelar', () => {
    abrirFormulario();

    boton('Volver')!.click();
    fixture.detectChanges();

    expect(el.querySelector('.cancelar-panel')).toBeNull();
    http.expectNone(URL_CANCELAR);
  });

  it('no abre el formulario para una cita con menos de 2 días y explica la regla', () => {
    fixture.componentInstance.cancelar('cercana');
    fixture.detectChanges();

    expect(el.querySelector('.cancelar-panel')).toBeNull();
    expect(el.querySelector('.aviso--error')?.textContent).toContain('2 días');
  });
});
