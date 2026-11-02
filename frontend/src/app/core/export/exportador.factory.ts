import { Injectable } from '@angular/core';
import { CsvExportador } from './csv-exportador';
import { ExportadorCitas } from './exportador-citas';

/**
 * Patrón Factory (registro de estrategias): entrega el exportador según su id.
 * Para un formato nuevo basta con registrarlo aquí.
 */
@Injectable({ providedIn: 'root' })
export class ExportadorFactory {
  private readonly exportadores = new Map<string, ExportadorCitas>();

  constructor() {
    // Excel en configuración regional de Colombia usa ";" como separador de listas.
    this.registrar(new CsvExportador({ id: 'csv-excel', etiqueta: 'CSV para Excel (;)', separador: ';', incluirBom: true }));
    this.registrar(new CsvExportador({ id: 'csv', etiqueta: 'CSV estándar (,)', separador: ',', incluirBom: false }));
  }

  registrar(exportador: ExportadorCitas): void {
    this.exportadores.set(exportador.id, exportador);
  }

  obtener(id: string): ExportadorCitas {
    const exportador = this.exportadores.get(id);
    if (!exportador) {
      throw new Error(`Formato de exportación no soportado: ${id}`);
    }
    return exportador;
  }

  disponibles(): ExportadorCitas[] {
    return [...this.exportadores.values()];
  }
}
