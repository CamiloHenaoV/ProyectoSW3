import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-badge-estado',
  templateUrl: './badge-estado.html',
  styleUrl: './badge-estado.scss'
})
export class BadgeEstado {
  estado = input.required<string>();
  claseEstado = computed(() => this.estado().toLowerCase());
}
