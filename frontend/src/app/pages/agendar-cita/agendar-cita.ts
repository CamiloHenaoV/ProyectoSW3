import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { CitasService } from '../../core/services/citas.service';
import { MedicosService } from '../../core/services/medicos.service';
import { CitaListado, FranjaDisponible, Medico } from '../../core/models/cita.model';
import { fechaLarga, formatearHora, hoyLocal, rangoDeDias, sumarDias } from '../../core/utils/fechas';
import { mensajeDeError } from '../../core/utils/http-errores';
import { SelectorFranjas } from '../../shared/organisms/selector-franjas/selector-franjas';
import { SelectorSemana, DiaDisponibilidad } from '../../shared/molecules/selector-semana/selector-semana';
import { SelectField, SelectOption } from '../../shared/atoms/select-field/select-field';
import { Button } from '../../shared/atoms/button/button';

const DIAS_POR_SEMANA = 7;
/** Tope de navegación; la ventana real la define el administrador (semanas habilitadas). */
const SEMANAS_MAXIMAS = 12;

// RF2: Yo como paciente necesito agendar una cita mediante la web.
// Flujo: profesional → día (con cupos visibles) → horario → confirmar.
@Component({
  selector: 'app-agendar-cita',
  imports: [SelectorFranjas, SelectorSemana, SelectField, Button, RouterLink],
  templateUrl: './agendar-cita.html',
  styleUrl: './agendar-cita.scss'
})
export class AgendarCita {
  private citasService = inject(CitasService);
  private medicosService = inject(MedicosService);
  private destroyRef = inject(DestroyRef);

  private readonly hoy = hoyLocal();
  /** Cache de franjas por "medicoId|fecha" para no repetir consultas al cambiar de día. */
  private cacheFranjas = new Map<string, FranjaDisponible[]>();
  private solicitudSemana = 0;
  /** El Map no es reactivo; este contador avisa a los computed cuando cambia. */
  private versionCache = signal(0);

  medicos = signal<Medico[]>([]);
  medicoId = signal('');
  inicioSemana = signal(this.hoy);
  dias = signal<DiaDisponibilidad[]>([]);
  fecha = signal('');
  franjaSeleccionada = signal<FranjaDisponible | null>(null);
  enviando = signal(false);
  citaConfirmada = signal<CitaListado | null>(null);
  error = signal('');

  opcionesMedicos = computed<SelectOption[]>(() =>
    this.medicos().map((m) => ({ value: m.id, label: `${m.nombre} · ${m.especialidad}` }))
  );
  medico = computed(() => this.medicos().find((m) => m.id === this.medicoId()) ?? null);
  franjas = computed(() => {
    this.versionCache();
    return this.cacheFranjas.get(this.clave(this.medicoId(), this.fecha())) ?? [];
  });
  cargandoSemana = computed(() => this.dias().some((d) => d.disponibles === null));
  semanaSinCupos = computed(
    () => !this.cargandoSemana() && this.dias().length > 0 && this.dias().every((d) => !d.disponibles || d.disponibles < 0)
  );
  puedeRetroceder = computed(() => this.inicioSemana() > this.hoy);
  puedeAvanzar = computed(() => this.inicioSemana() < sumarDias(this.hoy, DIAS_POR_SEMANA * (SEMANAS_MAXIMAS - 1)));
  fechaTexto = computed(() => (this.fecha() ? fechaLarga(this.fecha()) : ''));
  horaTexto = computed(() => formatearHora(this.franjaSeleccionada()?.horaInicio));

  constructor() {
    this.medicosService.listar().subscribe({
      next: (medicos) => this.medicos.set(medicos.filter((m) => m.activo !== false)),
      error: (err) => this.error.set(mensajeDeError(err, 'No se pudo cargar la lista de profesionales.'))
    });
    this.destroyRef.onDestroy(() => this.solicitudSemana++);
  }

  elegirMedico(id: string): void {
    this.medicoId.set(id);
    this.inicioSemana.set(this.hoy);
    this.reiniciarSeleccion();
    this.cargarSemana();
  }

  cambiarSemana(direccion: 1 | -1): void {
    const nuevoInicio = sumarDias(this.inicioSemana(), direccion * DIAS_POR_SEMANA);
    this.inicioSemana.set(nuevoInicio < this.hoy ? this.hoy : nuevoInicio);
    this.reiniciarSeleccion();
    this.cargarSemana();
  }

  elegirDia(fecha: string): void {
    this.fecha.set(fecha);
    this.franjaSeleccionada.set(null);
  }

  confirmarCita(): void {
    const franja = this.franjaSeleccionada();
    if (!franja || !this.medicoId() || !this.fecha()) {
      this.error.set('Elige un profesional, un día y un horario antes de confirmar.');
      return;
    }

    this.enviando.set(true);
    this.error.set('');
    this.citasService
      .agendar({ medicoId: this.medicoId(), fecha: this.fecha(), horaInicio: franja.horaInicio })
      .subscribe({
        next: (cita) => {
          this.enviando.set(false);
          this.citaConfirmada.set(cita);
          this.cacheFranjas.clear();
          this.versionCache.update((v) => v + 1);
        },
        error: (err) => {
          this.enviando.set(false);
          this.error.set(mensajeDeError(err, 'No fue posible agendar la cita.'));
          if (err?.status === 409) {
            // Otro paciente tomó la franja: refrescamos la disponibilidad.
            this.cacheFranjas.clear();
            this.versionCache.update((v) => v + 1);
            this.franjaSeleccionada.set(null);
            this.cargarSemana(this.fecha());
          }
        }
      });
  }

  agendarOtra(): void {
    this.citaConfirmada.set(null);
    this.reiniciarSeleccion();
    if (this.medicoId()) this.cargarSemana();
  }

  private reiniciarSeleccion(): void {
    this.fecha.set('');
    this.franjaSeleccionada.set(null);
    this.error.set('');
  }

  /** Consulta en paralelo las franjas de los 7 días visibles para mostrar los cupos. */
  private cargarSemana(mantenerFecha?: string): void {
    const medicoId = this.medicoId();
    if (!medicoId) return;

    const solicitud = ++this.solicitudSemana;
    const fechas = rangoDeDias(this.inicioSemana(), DIAS_POR_SEMANA);
    this.dias.set(fechas.map((fecha) => ({ fecha, disponibles: null })));

    forkJoin(
      fechas.map((fecha) =>
        this.citasService.obtenerFranjasDisponibles(medicoId, fecha).pipe(
          map((franjas) => ({ fecha, franjas: franjas as FranjaDisponible[] | null })),
          catchError(() => of({ fecha, franjas: null }))
        )
      )
    ).subscribe((resultados) => {
      if (solicitud !== this.solicitudSemana) return; // respuesta vieja: el usuario ya cambió de profesional o semana

      for (const { fecha, franjas } of resultados) {
        if (franjas) this.cacheFranjas.set(this.clave(medicoId, fecha), franjas);
      }
      this.versionCache.update((v) => v + 1);
      this.dias.set(resultados.map(({ fecha, franjas }) => ({ fecha, disponibles: franjas ? franjas.length : -1 })));

      const preferida = mantenerFecha && resultados.find((r) => r.fecha === mantenerFecha && r.franjas?.length);
      const primeraConCupo = resultados.find((r) => r.franjas?.length);
      this.fecha.set((preferida || primeraConCupo)?.fecha ?? '');
    });
  }

  private clave(medicoId: string, fecha: string): string {
    return `${medicoId}|${fecha}`;
  }
}
