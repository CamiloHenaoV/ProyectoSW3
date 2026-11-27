import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-textarea-field',
  templateUrl: './textarea-field.html',
  styleUrl: './textarea-field.scss'
})
export class TextareaField {
  value = input<string>('');
  name = input<string>('');
  placeholder = input<string>('');
  rows = input(4);
  maxLength = input<number | null>(null);
  required = input(false);
  disabled = input(false);
  invalid = input(false);
  ariaLabel = input<string>('');
  ariaDescribedBy = input<string>('');

  valueChange = output<string>();

  onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.valueChange.emit(target.value);
  }
}
