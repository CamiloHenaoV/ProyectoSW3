import { CitaListado } from '../models/cita.model';
import { fechaCorta, formatearHora } from '../utils/fechas';

export interface ColumnaExportable {
  encabezado: string;
  valor: (cita: CitaListado, indice: number) => string;
}

/** Columnas pensadas para la planilla de la jornada: orden de llegada a la consulta. */
export const COLUMNAS_JORNADA: readonly ColumnaExportable[] = [
  { encabezado: 'N.º', valor: (_, i) => String(i + 1) },
  { encabezado: 'Fecha', valor: (c) => fechaCorta(c.fecha) },
  { encabezado: 'Hora inicio', valor: (c) => formatearHora(c.horaInicio) },
  { encabezado: 'Hora fin', valor: (c) => formatearHora(c.horaFin) },
  { encabezado: 'Paciente', valor: (c) => c.pacienteNombre ?? '' },
  { encabezado: 'Cédula', valor: (c) => c.pacienteDocumento ?? '' },
  { encabezado: 'Médico/terapista', valor: (c) => c.nombreMedico ?? '' },
  { encabezado: 'Estado', valor: (c) => c.estado },
  { encabezado: 'Asistió', valor: () => '' }
];
