import { Component, input, output } from '@angular/core';
import { Button } from '../../atoms/button/button';
import { FormField } from '../../molecules/form-field/form-field';
import { LoginRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-formulario-login',
  imports: [FormField, Button],
  templateUrl: './formulario-login.html',
  styleUrl: './formulario-login.scss'
})
export class FormularioLogin {
  enviando = input(false);
  login = output<LoginRequest>();

  email = '';
  password = '';

  onSubmit(): void {
    this.login.emit({
      email: this.email,
      password: this.password
    });
  }
}
