import { Pipe, PipeTransform } from '@angular/core';
import { formatearHora } from '../../core/utils/fechas';

/** "08:30:00" → "08:30" */
@Pipe({ name: 'hora' })
export class HoraPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return formatearHora(valor);
  }
}
