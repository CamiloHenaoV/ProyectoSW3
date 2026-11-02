import { TestBed } from '@angular/core/testing';
import { AutocompletarPaciente } from './autocompletar-paciente';

describe('AutocompletarPaciente', () => {
  const pacientes = [
    { id: 'p1', nombre: 'Juan Pérez', documentoIdentidad: '1061001' },
    { id: 'p2', nombre: 'Laura Ruiz', documentoIdentidad: '1061002' }
  ];

  async function montar() {
    const fixture = TestBed.createComponent(AutocompletarPaciente);
    fixture.componentRef.setInput('sugerencias', pacientes);
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const escribir = async (texto: string) => {
      input.value = texto;
      input.dispatchEvent(new Event('input'));
      await fixture.whenStable();
    };
    const tecla = async (key: string) => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key }));
      await fixture.whenStable();
    };
    return { fixture, input, escribir, tecla };
  }

  it('pide sugerencias solo desde el mínimo de caracteres', async () => {
    const { fixture, escribir } = await montar();
    const buscar = vi.fn();
    fixture.componentInstance.buscar.subscribe(buscar);

    await escribir('10');
    expect(buscar).not.toHaveBeenCalled();
    await escribir('106');
    expect(buscar).toHaveBeenCalledWith('106');
  });

  it('muestra las sugerencias y permite elegir con el teclado', async () => {
    const { fixture, escribir, tecla } = await montar();
    const seleccionar = vi.fn();
    fixture.componentInstance.seleccionar.subscribe(seleccionar);

    await escribir('1061');
    expect(fixture.nativeElement.querySelectorAll('[role="option"]')).toHaveLength(2);

    await tecla('ArrowDown');
    await tecla('ArrowDown');
    await tecla('Enter');
    expect(seleccionar).toHaveBeenCalledWith(pacientes[1]);
    expect(fixture.componentInstance.texto()).toBe('1061002');
  });

  it('consulta la cédula escrita si no se elige una sugerencia', async () => {
    const { fixture, escribir, tecla } = await montar();
    const consultar = vi.fn();
    fixture.componentInstance.consultar.subscribe(consultar);

    await escribir('99887766');
    await tecla('Escape');
    await tecla('Enter');
    expect(consultar).toHaveBeenCalledWith('99887766');
  });

  it('descarta caracteres que no pueden ir en una cédula', async () => {
    const { fixture, escribir } = await montar();
    await escribir('10.61 ;<script>');
    expect(fixture.componentInstance.texto()).toBe('1061script');
  });
});
