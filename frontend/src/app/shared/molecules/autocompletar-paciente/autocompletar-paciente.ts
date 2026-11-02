import { Component, computed, input, output, signal } from '@angular/core';
import { PacienteResumen } from '../../../core/models/paciente.model';

let contador = 0;

/**
 * Campo de cédula con sugerencias (combobox accesible, navegable con teclado).
 * Es presentacional: emite el texto a buscar y la página decide cómo consultar.
 */
@Component({
  selector: 'app-autocompletar-paciente',
  templateUrl: './autocompletar-paciente.html',
  styleUrl: './autocompletar-paciente.scss'
})
export class AutocompletarPaciente {
  sugerencias = input<PacienteResumen[]>([]);
  cargando = input(false);
  minimoCaracteres = input(3);

  /** Texto escrito (ya con el mínimo de caracteres) para pedir sugerencias. */
  buscar = output<string>();
  /** El usuario eligió un paciente de la lista. */
  seleccionar = output<PacienteResumen>();
  /** El usuario pidió consultar la cédula escrita sin elegir sugerencia. */
  consultar = output<string>();

  readonly idInput = `autocompletar-paciente-${++contador}`;
  readonly idLista = `${this.idInput}-lista`;

  texto = signal('');
  abierta = signal(false);
  indiceActivo = signal(-1);

  mostrarLista = computed(
    () => this.abierta() && this.texto().trim().length >= this.minimoCaracteres()
  );

  alEscribir(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value.replace(/[^\dA-Za-z-]/g, '');
    this.texto.set(valor);
    this.abierta.set(true);
    this.indiceActivo.set(-1);
    if (valor.trim().length >= this.minimoCaracteres()) {
      this.buscar.emit(valor.trim());
    }
  }

  alPresionarTecla(evento: KeyboardEvent): void {
    const total = this.sugerencias().length;
    switch (evento.key) {
      case 'ArrowDown':
        evento.preventDefault();
        this.abierta.set(true);
        if (total) this.indiceActivo.set((this.indiceActivo() + 1) % total);
        break;
      case 'ArrowUp':
        evento.preventDefault();
        if (total) this.indiceActivo.set((this.indiceActivo() - 1 + total) % total);
        break;
      case 'Enter': {
        evento.preventDefault();
        const activa = this.sugerencias()[this.indiceActivo()];
        if (this.mostrarLista() && activa) {
          this.elegir(activa);
        } else {
          this.consultarTexto();
        }
        break;
      }
      case 'Escape':
        this.cerrarLista();
        break;
    }
  }

  elegir(paciente: PacienteResumen): void {
    this.texto.set(paciente.documentoIdentidad);
    this.cerrarLista();
    this.seleccionar.emit(paciente);
  }

  consultarTexto(): void {
    const valor = this.texto().trim();
    if (!valor) return;
    this.cerrarLista();
    this.consultar.emit(valor);
  }

  cerrarLista(): void {
    this.abierta.set(false);
    this.indiceActivo.set(-1);
  }
}
