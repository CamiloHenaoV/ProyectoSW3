import { Component, input, output } from '@angular/core';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select-field',
  templateUrl: './select-field.html',
  styleUrl: './select-field.scss'
})
export class SelectField {
  options = input<SelectOption[]>([]);
  value = input<string>('');
  placeholder = input<string>('Selecciona una opción');
  name = input<string>('');

  valueChange = output<string>();

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.valueChange.emit(target.value);
  }
}
