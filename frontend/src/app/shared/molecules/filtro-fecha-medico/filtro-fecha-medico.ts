import { Component, computed, input, output } from '@angular/core';
import { SelectField, SelectOption } from '../../atoms/select-field/select-field';
import { InputField } from '../../atoms/input-field/input-field';
import { Button } from '../../atoms/button/button';
import { Medico } from '../../../core/models/cita.model';

@Component({
  selector: 'app-filtro-fecha-medico',
  imports: [SelectField, InputField, Button],
  templateUrl: './filtro-fecha-medico.html',
  styleUrl: './filtro-fecha-medico.scss'
})
export class FiltroFechaMedico {
  medicos = input.required<Medico[]>();
  medicoId = input<string>('');
  fecha = input<string>('');

  medicoIdChange = output<string>();
  fechaChange = output<string>();
  buscar = output<void>();

  opciones = computed<SelectOption[]>(() =>
    this.medicos().map((m) => ({ value: m.id, label: `${m.nombre} - ${m.especialidad}` }))
  );
}
