import { Component, input, output } from '@angular/core';
import { FormField } from '../../molecules/form-field/form-field';
import { Button } from '../../atoms/button/button';
import { RegistroPacienteRequest } from '../../../core/models/paciente.model';

@Component({
  selector: 'app-formulario-registro-paciente',
  imports: [FormField, Button],
  templateUrl: './formulario-registro-paciente.html',
  styleUrl: './formulario-registro-paciente.scss'
})
export class FormularioRegistroPaciente {
  enviando = input(false);
  registrar = output<RegistroPacienteRequest>();

  nombre = '';
  documentoIdentidad = '';
  telefono = '';
  email = '';
  password = '';

  onSubmit(): void {
    this.registrar.emit({
      nombre: this.nombre,
      documentoIdentidad: this.documentoIdentidad,
      telefono: this.telefono,
      email: this.email,
      password: this.password
    });
  }
}
