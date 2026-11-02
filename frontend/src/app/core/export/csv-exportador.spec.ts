import { CitaListado } from '../models/cita.model';
import { CsvExportador } from './csv-exportador';

const cita = (parcial: Partial<CitaListado>): CitaListado => ({
  id: '1',
  medicoId: 'm1',
  nombreMedico: 'Dra. Ana Restrepo',
  fecha: '2026-11-03T00:00:00',
  horaInicio: '08:00:00',
  horaFin: '08:30:00',
  estado: 'Agendada',
  pacienteId: 'p1',
  pacienteNombre: 'Juan Pérez',
  pacienteDocumento: '10612345',
  ...parcial
});

const contexto = { medico: 'Dra. Ana Restrepo', fecha: '2026-11-03' };

describe('CsvExportador', () => {
  const excel = new CsvExportador({ id: 'csv-excel', etiqueta: 'Excel', separador: ';', incluirBom: true });
  const estandar = new CsvExportador({ id: 'csv', etiqueta: 'Estándar', separador: ',', incluirBom: false });

  it('genera encabezado y una fila por cita, numeradas en orden', () => {
    const csv = estandar.generar([cita({}), cita({ id: '2', horaInicio: '08:30:00', horaFin: '09:00:00' })], contexto);
    const lineas = csv.trimEnd().split('\r\n');
    expect(lineas[0]).toBe('N.º,Fecha,Hora inicio,Hora fin,Paciente,Cédula,Médico/terapista,Estado,Asistió');
    expect(lineas[1]).toBe('1,03/11/2026,08:00,08:30,Juan Pérez,10612345,Dra. Ana Restrepo,Agendada,');
    expect(lineas[2].startsWith('2,03/11/2026,08:30,09:00')).toBe(true);
  });

  it('agrega BOM UTF-8 y usa ";" en el formato para Excel', () => {
    const csv = excel.generar([cita({})], contexto);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.split('\r\n')[1]).toContain('1;03/11/2026;08:00');
  });

  it('escapa separadores, comillas y saltos de línea (RFC 4180)', () => {
    const csv = estandar.generar([cita({ pacienteNombre: 'Pérez, "Juanito"\nJr' })], contexto);
    expect(csv).toContain('"Pérez, ""Juanito""\nJr"');
  });

  it('neutraliza la inyección de fórmulas en hojas de cálculo', () => {
    const csv = estandar.generar([cita({ pacienteNombre: '=HYPERLINK("http://malo")' })], contexto);
    expect(csv).toContain(`"'=HYPERLINK(""http://malo"")"`);
    expect(estandar.generar([cita({ pacienteNombre: '+57 300' })], contexto)).toContain(",'+57 300,");
  });

  it('deja vacías las columnas que el backend no envía', () => {
    const csv = estandar.generar([cita({ pacienteDocumento: undefined, pacienteNombre: null })], contexto);
    expect(csv.split('\r\n')[1]).toBe('1,03/11/2026,08:00,08:30,,,Dra. Ana Restrepo,Agendada,');
  });

  it('genera solo el encabezado si no hay citas', () => {
    expect(estandar.generar([], contexto).trimEnd().split('\r\n')).toHaveLength(1);
  });
});
