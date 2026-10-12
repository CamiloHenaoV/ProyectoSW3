import { Component, inject, signal } from '@angular/core';
import { CitasService } from '../../core/services/citas.service';
import { AuthService } from '../../core/services/auth.service';
import { CitaListado, FranjaDisponible } from '../../core/models/cita.model';
import { TablaCitas } from '../../shared/organisms/tabla-citas/tabla-citas';
import { SelectorFranjas } from '../../shared/organisms/selector-franjas/selector-franjas';
import { InputField } from '../../shared/atoms/input-field/input-field';
import { Button } from '../../shared/atoms/button/button';

@Component({
  selector: 'app-mis-citas',
  imports: [TablaCitas, SelectorFranjas, InputField, Button],
  templateUrl: './mis-citas.html',
  styleUrl: './mis-citas.scss'
})
export class MisCitasPage {
  private citasService = inject(CitasService);
  private authService = inject(AuthService);

  citas = signal<CitaListado[]>([]);
  mensaje = signal('');
  citaReagendando = signal<CitaListado | null>(null);
  fechaReagendar = signal(this.fechaManana());
  franjas = signal<FranjaDisponible[]>([]);
  franjaSeleccionada = signal<FranjaDisponible | null>(null);
  cargandoFranjas = signal(false);

  ngOnInit(): void {
    const usuario = this.authService.getUsuario();
    if (!usuario) {
      this.mensaje.set('Debes iniciar sesión para ver tus citas.');
      return;
    }

    this.cargarCitas();
  }

  cancelar(citaId: string): void {
    if (!window.confirm('¿Confirmas que deseas cancelar esta cita?')) {
      return;
    }

    this.citasService.cancelar(citaId).subscribe({
      next: () => this.cargarCitas(),
      error: () => this.mensaje.set('No fue posible cancelar la cita.')
    });
  }

  iniciarReagendamiento(citaId: string): void {
    const cita = this.citas().find((item) => item.id === citaId);
    if (!cita) {
      this.mensaje.set('No se encontró la cita que deseas reagendar.');
      return;
    }

    this.citaReagendando.set(cita);
    this.fechaReagendar.set(this.fechaManana());
    this.franjas.set([]);
    this.franjaSeleccionada.set(null);
    this.mensaje.set('');
  }

  buscarFranjas(): void {
    const cita = this.citaReagendando();
    if (!cita || !this.fechaReagendar()) {
      return;
    }

    this.cargandoFranjas.set(true);
    this.franjaSeleccionada.set(null);
    this.citasService.obtenerFranjasDisponibles(cita.medicoId, this.fechaReagendar()).subscribe({
      next: (franjas) => {
        this.franjas.set(franjas);
        this.cargandoFranjas.set(false);
        if (!franjas.length) {
          this.mensaje.set('No hay horarios disponibles para esa fecha. Prueba con otra.');
        } else {
          this.mensaje.set('');
        }
      },
      error: () => {
        this.cargandoFranjas.set(false);
        this.mensaje.set('No fue posible consultar los horarios disponibles.');
      }
    });
  }

  confirmarReagendamiento(): void {
    const cita = this.citaReagendando();
    const franja = this.franjaSeleccionada();
    if (!cita || !franja) {
      this.mensaje.set('Selecciona una fecha y un horario disponible.');
      return;
    }

    this.citasService.reagendar(cita.id, {
      fecha: this.fechaReagendar(),
      horaInicio: franja.horaInicio
    }).subscribe({
      next: () => {
        this.citaReagendando.set(null);
        this.mensaje.set('La cita se reagendó correctamente.');
        this.cargarCitas();
      },
      error: (error) => this.mensaje.set(
        error?.error?.detail ?? error?.error?.mensaje ?? 'No fue posible reagendar la cita.'
      )
    });
  }

  cancelarReagendamiento(): void {
    this.citaReagendando.set(null);
    this.franjas.set([]);
    this.franjaSeleccionada.set(null);
  }

  private fechaManana(): string {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    const anio = manana.getFullYear();
    const mes = String(manana.getMonth() + 1).padStart(2, '0');
    const dia = String(manana.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private cargarCitas(): void {
    this.citasService.misCitas().subscribe({
      next: (citas) => {
        this.citas.set(citas);
        if (!citas.length) {
          this.mensaje.set('Todavía no tienes citas agendadas.');
        } else {
          this.mensaje.set('');
        }
      },
      error: () => {
        this.mensaje.set('No fue posible cargar tus citas en este momento.');
      }
    });
  }
}
