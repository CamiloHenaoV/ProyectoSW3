import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TablaCitas } from './tabla-citas';
import { CitaListado } from '../../../core/models/cita.model';

// 2026-03-10 15:00 UTC = 10:00 en Colombia; el límite de 48 h es el 12/03 a las 10:00.
const AHORA = new Date('2026-03-10T15:00:00Z');

function cita(id: string, fecha: string, extra: Partial<CitaListado> = {}): CitaListado {
  return {
    id,
    medicoId: 'm1',
    nombreMedico: 'Dra. Ana Restrepo',
    fecha: `${fecha}T00:00:00`,
    horaInicio: '10:00:00',
    horaFin: '10:30:00',
    estado: 'Agendada',
    pacienteId: 'p1',
    pacienteNombre: 'Carlos Pérez',
    pacienteDocumento: '1032456789',
    ...extra
  };
}

describe('TablaCitas · cancelación (RF6)', () => {
  let fixture: ComponentFixture<TablaCitas>;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(AHORA);
    fixture = TestBed.createComponent(TablaCitas);
  });

  afterEach(() => vi.useRealTimers());

  function render(modo: 'paciente' | 'agenda', citas: CitaListado[]): HTMLElement {
    fixture.componentRef.setInput('modo', modo);
    fixture.componentRef.setInput('mostrarCancelar', true);
    fixture.componentRef.setInput('citas', citas);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  const botonCancelar = (fila: Element) =>
    Array.from(fila.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Cancelar');

  it('al paciente le habilita Cancelar cuando faltan 2 días o más', () => {
    const el = render('paciente', [cita('lejana', '2026-03-12')]); // justo 48 h
    const boton = botonCancelar(el.querySelector('tbody tr')!);

    expect(boton).toBeDefined();
    expect(boton!.disabled).toBe(false);
    expect(el.querySelector('.nota-plazo')).toBeNull();
  });

  it('al paciente le deshabilita Cancelar y explica el motivo cuando faltan menos de 2 días', () => {
    const el = render('paciente', [cita('cercana', '2026-03-11')]);
    const boton = botonCancelar(el.querySelector('tbody tr')!);

    expect(boton!.disabled).toBe(true);
    expect(el.querySelector('.nota-plazo')?.textContent).toContain('2 días de anticipación');
  });

  it('no emite el evento de cancelar cuando el botón está bloqueado', () => {
    const el = render('paciente', [cita('cercana', '2026-03-11')]);
    const emitir = vi.fn();
    fixture.componentInstance.cancelarCita.subscribe(emitir);

    botonCancelar(el.querySelector('tbody tr')!)!.click();

    expect(emitir).not.toHaveBeenCalled();
  });

  it('emite el id de la cita cuando se puede cancelar', () => {
    const el = render('paciente', [cita('lejana', '2026-03-20')]);
    const emitir = vi.fn();
    fixture.componentInstance.cancelarCita.subscribe(emitir);

    botonCancelar(el.querySelector('tbody tr')!)!.click();

    expect(emitir).toHaveBeenCalledWith('lejana');
  });

  it('al personal no le aplica el plazo de 2 días', () => {
    const el = render('agenda', [cita('cercana', '2026-03-10', { horaInicio: '11:00:00' })]);
    const boton = botonCancelar(el.querySelector('tbody tr')!);

    expect(boton!.disabled).toBe(false);
    expect(el.querySelector('.nota-plazo')).toBeNull();
  });

  it('no ofrece Cancelar en citas ya canceladas y muestra la justificación guardada', () => {
    const el = render('paciente', [
      cita('cancelada', '2026-03-20', { estado: 'Cancelada', motivoCancelacion: 'Tengo un viaje' })
    ]);

    expect(botonCancelar(el.querySelector('tbody tr')!)).toBeUndefined();
    expect(el.querySelector('.motivo')?.textContent).toContain('Tengo un viaje');
  });
});
