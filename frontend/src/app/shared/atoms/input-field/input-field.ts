import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-input-field',
  templateUrl: './input-field.html',
  styleUrl: './input-field.scss'
})
export class InputField {
  value = input<string>('');
  type = input<string>('text');
  name = input<string>('');
  placeholder = input<string>('');
  required = input(false);
  disabled = input(false);
  min = input<string | number | null>(null);
  max = input<string | number | null>(null);
  ariaLabel = input<string>('');

  valueChange = output<string>();

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }
}
