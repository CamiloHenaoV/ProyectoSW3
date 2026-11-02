import { Component, input, output, signal } from '@angular/core';
import { FormField } from '../../molecules/form-field/form-field';
import { Button } from '../../atoms/button/button';
import { RegistroPacienteRequest } from '../../../core/models/paciente.model';

type Campo = keyof RegistroPacienteRequest;

/** Validación en el cliente para dar retroalimentación inmediata; la API valida de nuevo. */
export function validarRegistro(r: RegistroPacienteRequest): Partial<Record<Campo, string>> {
  const errores: Partial<Record<Campo, string>> = {};
  if (r.nombre.trim().length < 3) errores.nombre = 'Escribe tu nombre completo.';
  if (!/^\d{5,12}$/.test(r.documentoIdentidad.trim())) errores.documentoIdentidad = 'La cédula debe tener entre 5 y 12 dígitos, sin puntos.';
  if (!/^\+?\d{7,15}$/.test(r.telefono.replace(/[\s-]/g, ''))) errores.telefono = 'Escribe un teléfono de 7 a 15 dígitos.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim())) errores.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  if (r.password.length < 8 || !/[A-Za-z]/.test(r.password) || !/\d/.test(r.password)) {
    errores.password = 'Usa al menos 8 caracteres, con letras y números.';
  }
  return errores;
}

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
  errores = signal<Partial<Record<Campo, string>>>({});

  onSubmit(): void {
    const request: RegistroPacienteRequest = {
      nombre: this.nombre.trim(),
      documentoIdentidad: this.documentoIdentidad.trim(),
      telefono: this.telefono.replace(/[\s-]/g, ''),
      email: this.email.trim().toLowerCase(),
      password: this.password
    };
    const errores = validarRegistro(request);
    this.errores.set(errores);
    if (!Object.keys(errores).length) {
      this.registrar.emit(request);
    }
  }
}
