import { Component, inject, signal } from '@angular/core';
import { CitasService } from '../../core/services/citas.service';
import { hoyLocal, sumarDias } from '../../core/utils/fechas';
import { mensajeDeError } from '../../core/utils/http-errores';
import { ordenarRecientesPrimero } from '../../core/utils/filtros-citas';
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

  citas = signal<CitaListado[]>([]);
  mensaje = signal('');
  mensajeEsError = signal(false);
  mensajeEsExito = signal(false);
  citaReagendando = signal<CitaListado | null>(null);
  fechaReagendar = signal(this.fechaManana());
  franjas = signal<FranjaDisponible[]>([]);
  franjaSeleccionada = signal<FranjaDisponible | null>(null);
  cargandoFranjas = signal(false);

  ngOnInit(): void {
    this.cargarCitas();
  }

  cancelar(citaId: string): void {
    if (!window.confirm('¿Confirmas que deseas cancelar esta cita?')) {
      return;
    }

    this.citasService.cancelar(citaId).subscribe({
      next: () => {
        this.avisar('La cita se canceló.', 'exito');
        this.cargarCitas(false);
      },
      error: (err) => this.avisar(mensajeDeError(err, 'No fue posible cancelar la cita.'), 'error')
    });
  }

  iniciarReagendamiento(citaId: string): void {
    const cita = this.citas().find((item) => item.id === citaId);
    if (!cita) {
      this.avisar('No se encontró la cita que deseas reagendar.', 'error');
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
          this.avisar('No hay horarios disponibles para esa fecha. Prueba con otra.');
        } else {
          this.mensaje.set('');
        }
      },
      error: () => {
        this.cargandoFranjas.set(false);
        this.avisar('No fue posible consultar los horarios disponibles.', 'error');
      }
    });
  }

  confirmarReagendamiento(): void {
    const cita = this.citaReagendando();
    const franja = this.franjaSeleccionada();
    if (!cita || !franja) {
      this.avisar('Selecciona una fecha y un horario disponible.', 'error');
      return;
    }

    this.citasService.reagendar(cita.id, {
      fecha: this.fechaReagendar(),
      horaInicio: franja.horaInicio
    }).subscribe({
      next: () => {
        this.citaReagendando.set(null);
        this.avisar('La cita se reagendó correctamente.', 'exito');
        this.cargarCitas(false);
      },
      error: (err) => this.avisar(mensajeDeError(err, 'No fue posible reagendar la cita.'), 'error')
    });
  }

  cancelarReagendamiento(): void {
    this.citaReagendando.set(null);
    this.franjas.set([]);
    this.franjaSeleccionada.set(null);
  }

  private fechaManana(): string {
    return sumarDias(hoyLocal(), 1);
  }

  private avisar(texto: string, tipo: 'info' | 'error' | 'exito' = 'info'): void {
    this.mensaje.set(texto);
    this.mensajeEsError.set(tipo === 'error');
    this.mensajeEsExito.set(tipo === 'exito');
  }

  private cargarCitas(limpiarMensaje = true): void {
    this.citasService.misCitas().subscribe({
      next: (citas) => {
        this.citas.set(ordenarRecientesPrimero(citas));
        if (limpiarMensaje) this.mensaje.set('');
      },
      error: (err) => this.avisar(mensajeDeError(err, 'No fue posible cargar tus citas en este momento.'), 'error')
    });
  }
}
