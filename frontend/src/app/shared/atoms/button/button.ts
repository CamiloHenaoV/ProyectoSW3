import { Component, input, output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

@Component({
  selector: 'app-button',
  templateUrl: './button.html',
  styleUrl: './button.scss'
})
export class Button {
  label = input.required<string>();
  variant = input<ButtonVariant>('primary');
  disabled = input(false);
  type = input<'button' | 'submit'>('button');

  clicked = output<void>();

  onClick(): void {
    if (!this.disabled()) {
      this.clicked.emit();
    }
  }
}
