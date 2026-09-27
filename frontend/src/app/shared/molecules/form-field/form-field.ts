import { Component, input, output } from '@angular/core';
import { InputField } from '../../atoms/input-field/input-field';

@Component({
  selector: 'app-form-field',
  imports: [InputField],
  templateUrl: './form-field.html',
  styleUrl: './form-field.scss'
})
export class FormField {
  label = input.required<string>();
  type = input<string>('text');
  name = input<string>('');
  value = input<string>('');
  placeholder = input<string>('');
  required = input(false);
  error = input<string>('');

  valueChange = output<string>();
}
