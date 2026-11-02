import { CitaListado } from '../models/cita.model';
import { COLUMNAS_JORNADA, ColumnaExportable } from './columnas-cita';
import { ContextoExportacion, ExportadorCitas } from './exportador-citas';

export interface OpcionesCsv {
  id: string;
  etiqueta: string;
  separador: ',' | ';' | '\t';
  /** BOM UTF-8 para que Excel muestre bien tildes y eñes. */
  incluirBom: boolean;
  columnas?: readonly ColumnaExportable[];
}

const BOM = '\uFEFF';
/** Caracteres con los que una hoja de cálculo interpreta una celda como fórmula. */
const INICIO_FORMULA = /^[=+\-@\t\r]/;

export class CsvExportador implements ExportadorCitas {
  readonly id: string;
  readonly etiqueta: string;
  readonly extension = 'csv';
  readonly tipoMime = 'text/csv;charset=utf-8';

  private readonly separador: string;
  private readonly incluirBom: boolean;
  private readonly columnas: readonly ColumnaExportable[];

  constructor(opciones: OpcionesCsv) {
    this.id = opciones.id;
    this.etiqueta = opciones.etiqueta;
    this.separador = opciones.separador;
    this.incluirBom = opciones.incluirBom;
    this.columnas = opciones.columnas ?? COLUMNAS_JORNADA;
  }

  generar(citas: readonly CitaListado[], _contexto: ContextoExportacion): string {
    const encabezado = this.columnas.map((c) => this.celda(c.encabezado));
    const filas = citas.map((cita, i) => this.columnas.map((c) => this.celda(c.valor(cita, i))));
    const contenido = [encabezado, ...filas].map((fila) => fila.join(this.separador)).join('\r\n');
    return (this.incluirBom ? BOM : '') + contenido + '\r\n';
  }

  /**
   * Escapa una celda según RFC 4180 y neutraliza la inyección de fórmulas
   * (CSV injection, OWASP): un nombre como "=HYPERLINK(...)" se exporta como texto.
   */
  private celda(valor: string): string {
    let texto = valor ?? '';
    if (INICIO_FORMULA.test(texto)) {
      texto = `'${texto}`;
    }
    const requiereComillas =
      texto.includes(this.separador) || texto.includes('"') || texto.includes('\n') || texto.includes('\r');
    return requiereComillas ? `"${texto.replace(/"/g, '""')}"` : texto;
  }
}
