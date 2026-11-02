import { CitaListado } from '../models/cita.model';

export interface ContextoExportacion {
  medico: string;
  fecha: string;
}

/**
 * Patrón Strategy: cada formato de exportación implementa esta interfaz.
 * Agregar un formato nuevo (TSV, JSON, etc.) no exige modificar la pantalla
 * ni el servicio de exportación (principio abierto/cerrado).
 */
export interface ExportadorCitas {
  readonly id: string;
  readonly etiqueta: string;
  readonly extension: string;
  readonly tipoMime: string;
  generar(citas: readonly CitaListado[], contexto: ContextoExportacion): string;
}
