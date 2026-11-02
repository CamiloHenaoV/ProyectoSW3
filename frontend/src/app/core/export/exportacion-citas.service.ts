import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { CitaListado } from '../models/cita.model';
import { ContextoExportacion } from './exportador-citas';
import { ExportadorFactory } from './exportador.factory';

export function nombreArchivo(contexto: ContextoExportacion, extension: string): string {
  const medico = contexto.medico
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `citas_${medico || 'profesional'}_${contexto.fecha}.${extension}`;
}

/** RF4: genera el archivo en el navegador y lo descarga. No requiere endpoint nuevo. */
@Injectable({ providedIn: 'root' })
export class ExportacionCitasService {
  private readonly fabrica = inject(ExportadorFactory);
  private readonly documento = inject(DOCUMENT);

  formatos() {
    return this.fabrica.disponibles().map(({ id, etiqueta }) => ({ value: id, label: etiqueta }));
  }

  exportar(citas: readonly CitaListado[], formatoId: string, contexto: ContextoExportacion): string {
    const exportador = this.fabrica.obtener(formatoId);
    const contenido = exportador.generar(citas, contexto);
    const archivo = nombreArchivo(contexto, exportador.extension);
    this.descargar(contenido, exportador.tipoMime, archivo);
    return archivo;
  }

  private descargar(contenido: string, tipoMime: string, archivo: string): void {
    const url = URL.createObjectURL(new Blob([contenido], { type: tipoMime }));
    const enlace = this.documento.createElement('a');
    enlace.href = url;
    enlace.download = archivo;
    enlace.rel = 'noopener';
    this.documento.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
