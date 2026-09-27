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
  min = input<string | number | null>(null);

  valueChange = output<string>();

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }
}
