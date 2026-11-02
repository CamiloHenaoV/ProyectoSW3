import { CitaListado } from '../models/cita.model';
import { contarPorEstado, filtrarCitas, ordenarPorHora, ordenarRecientesPrimero } from './filtros-citas';

const cita = (id: string, parcial: Partial<CitaListado>): CitaListado => ({
  id,
  medicoId: 'm1',
  nombreMedico: 'Dra. Ana',
  fecha: '2026-11-03',
  horaInicio: '08:00:00',
  horaFin: '08:30:00',
  estado: 'Agendada',
  pacienteId: 'p',
  ...parcial
});

const citas = [
  cita('1', { horaInicio: '10:00:00', pacienteNombre: 'José Ramírez', pacienteDocumento: '1061001' }),
  cita('2', { horaInicio: '08:00:00', pacienteNombre: 'María López', estado: 'Cancelada', pacienteDocumento: '2002' }),
  cita('3', { horaInicio: '09:00:00', pacienteNombre: 'Andrés Ruiz', estado: 'Atendida' })
];

describe('filtros de citas', () => {
  it('filtra por estado', () => {
    expect(filtrarCitas(citas, { estado: 'Cancelada', texto: '' }).map((c) => c.id)).toEqual(['2']);
  });

  it('filtra por nombre sin importar tildes ni mayúsculas, o por cédula', () => {
    expect(filtrarCitas(citas, { estado: '', texto: 'jose ramirez' }).map((c) => c.id)).toEqual(['1']);
    expect(filtrarCitas(citas, { estado: '', texto: '1061' }).map((c) => c.id)).toEqual(['1']);
  });

  it('combina estado y texto', () => {
    expect(filtrarCitas(citas, { estado: 'Agendada', texto: 'maría' })).toEqual([]);
  });

  it('cuenta las citas por estado', () => {
    expect(contarPorEstado(citas)).toEqual({ Agendada: 1, Cancelada: 1, Atendida: 1 });
  });

  it('ordena por hora sin modificar el arreglo original', () => {
    expect(ordenarPorHora(citas).map((c) => c.id)).toEqual(['2', '3', '1']);
    expect(citas[0].id).toBe('1');
  });

  it('ordena el historial de la más reciente a la más antigua', () => {
    const historial = [
      cita('a', { fecha: '2026-09-01', horaInicio: '08:00:00' }),
      cita('b', { fecha: '2026-11-10', horaInicio: '08:00:00' }),
      cita('c', { fecha: '2026-11-10', horaInicio: '15:00:00' })
    ];
    expect(ordenarRecientesPrimero(historial).map((c) => c.id)).toEqual(['c', 'b', 'a']);
  });
});
