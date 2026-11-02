import { Component, effect, input, output, signal } from '@angular/core';
import { InputField } from '../../atoms/input-field/input-field';
import { Button } from '../../atoms/button/button';
import { ConfiguracionMedico, GuardarConfiguracionRequest } from '../../../core/models/configuracion.model';
import { minutosDelDia } from '../../../core/utils/fechas';

interface DiaSemana {
  valor: number;
  nombre: string;
}

export function validarConfiguracion(c: GuardarConfiguracionRequest): string[] {
  const errores: string[] = [];
  if (!c.diasAtencion.length) errores.push('Selecciona al menos un día de atención.');

  const horasValidas =
    !!c.horaInicio && !!c.horaFin && minutosDelDia(c.horaFin) > minutosDelDia(c.horaInicio);
  if (!horasValidas) {
    errores.push('La hora de fin debe ser posterior a la hora de inicio.');
  }

  const intervaloValido =
    Number.isInteger(c.intervaloMinutos) && c.intervaloMinutos >= 5 && c.intervaloMinutos <= 240;
  if (!intervaloValido) {
    errores.push('El intervalo entre citas debe estar entre 5 y 240 minutos.');
  }

  // Solo tiene sentido comparar duración e intervalo cuando ambos son válidos.
  if (horasValidas && intervaloValido && minutosDelDia(c.horaFin) - minutosDelDia(c.horaInicio) < c.intervaloMinutos) {
    errores.push('La franja horaria es más corta que el intervalo entre citas.');
  }
  if (!Number.isInteger(c.semanasHabilitadas) || c.semanasHabilitadas < 1 || c.semanasHabilitadas > 52) {
    errores.push('Las semanas habilitadas deben estar entre 1 y 52.');
  }
  return errores;
}

@Component({
  selector: 'app-formulario-configuracion',
  imports: [InputField, Button],
  templateUrl: './formulario-configuracion.html',
  styleUrl: './formulario-configuracion.scss'
})
export class FormularioConfiguracion {
  medicoId = input.required<string>();
  configuracion = input<ConfiguracionMedico | null>(null);

  guardar = output<GuardarConfiguracionRequest>();

  diasSemana: DiaSemana[] = [
    { valor: 1, nombre: 'Lunes' }, { valor: 2, nombre: 'Martes' }, { valor: 3, nombre: 'Miércoles' },
    { valor: 4, nombre: 'Jueves' }, { valor: 5, nombre: 'Viernes' }, { valor: 6, nombre: 'Sábado' },
    { valor: 0, nombre: 'Domingo' }
  ];

  diasSeleccionados = signal(new Set<number>());
  horaInicio = signal('08:00');
  horaFin = signal('12:00');
  intervaloMinutos = signal('30');
  semanasHabilitadas = signal('4');
  errores = signal<string[]>([]);

  constructor() {
    // Sincroniza el formulario cada vez que llega una configuración existente (edición)
    effect(() => {
      const config = this.configuracion();
      this.errores.set([]);
      if (config) {
        this.diasSeleccionados.set(new Set(config.diasAtencion));
        this.horaInicio.set(config.horaInicio.substring(0, 5));
        this.horaFin.set(config.horaFin.substring(0, 5));
        this.intervaloMinutos.set(String(config.intervaloMinutos));
        this.semanasHabilitadas.set(String(config.semanasHabilitadas));
      } else {
        this.diasSeleccionados.set(new Set());
      }
    });
  }

  toggleDia(valor: number): void {
    const dias = new Set(this.diasSeleccionados());
    dias.has(valor) ? dias.delete(valor) : dias.add(valor);
    this.diasSeleccionados.set(dias);
  }

  onSubmit(): void {
    const request: GuardarConfiguracionRequest = {
      medicoId: this.medicoId(),
      diasAtencion: Array.from(this.diasSeleccionados()).sort(),
      horaInicio: `${this.horaInicio()}:00`,
      horaFin: `${this.horaFin()}:00`,
      intervaloMinutos: Number(this.intervaloMinutos()),
      semanasHabilitadas: Number(this.semanasHabilitadas())
    };

    const errores = validarConfiguracion(request);
    this.errores.set(errores);
    if (!errores.length) {
      this.guardar.emit(request);
    }
  }
}
