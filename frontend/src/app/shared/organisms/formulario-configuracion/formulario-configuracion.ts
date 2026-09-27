import { Component, effect, input, output } from '@angular/core';
import { InputField } from '../../atoms/input-field/input-field';
import { Button } from '../../atoms/button/button';
import { ConfiguracionMedico, GuardarConfiguracionRequest } from '../../../core/models/configuracion.model';

interface DiaSemana {
  valor: number;
  nombre: string;
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
    { valor: 0, nombre: 'Domingo' }, { valor: 1, nombre: 'Lunes' }, { valor: 2, nombre: 'Martes' },
    { valor: 3, nombre: 'Miércoles' }, { valor: 4, nombre: 'Jueves' }, { valor: 5, nombre: 'Viernes' },
    { valor: 6, nombre: 'Sábado' }
  ];

  diasSeleccionados = new Set<number>();
  horaInicio = '08:00';
  horaFin = '12:00';
  intervaloMinutos = '30';
  semanasHabilitadas = '4';

  constructor() {
    // Sincroniza el formulario cada vez que llega una configuracion existente (edicion)
    effect(() => {
      const config = this.configuracion();
      if (config) {
        this.diasSeleccionados = new Set(config.diasAtencion);
        this.horaInicio = config.horaInicio.substring(0, 5);
        this.horaFin = config.horaFin.substring(0, 5);
        this.intervaloMinutos = String(config.intervaloMinutos);
        this.semanasHabilitadas = String(config.semanasHabilitadas);
      } else {
        this.diasSeleccionados = new Set();
      }
    });
  }

  toggleDia(valor: number): void {
    this.diasSeleccionados.has(valor) ? this.diasSeleccionados.delete(valor) : this.diasSeleccionados.add(valor);
  }

  onSubmit(): void {
    this.guardar.emit({
      medicoId: this.medicoId(),
      diasAtencion: Array.from(this.diasSeleccionados),
      horaInicio: `${this.horaInicio}:00`,
      horaFin: `${this.horaFin}:00`,
      intervaloMinutos: Number(this.intervaloMinutos),
      semanasHabilitadas: Number(this.semanasHabilitadas)
    });
  }
}
