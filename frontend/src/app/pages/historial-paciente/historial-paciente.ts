import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, catchError, debounceTime, distinctUntilChanged, finalize, of, switchMap, tap } from 'rxjs';
import { CitasService } from '../../core/services/citas.service';
import { PacientesService } from '../../core/services/pacientes.service';
import { CitaListado } from '../../core/models/cita.model';
import { PacienteResumen } from '../../core/models/paciente.model';
import { ESTADOS_CITA, contarPorEstado, filtrarCitas, ordenarRecientesPrimero } from '../../core/utils/filtros-citas';
import { fechaLarga, formatearHora, hoyLocal } from '../../core/utils/fechas';
import { mensajeDeError } from '../../core/utils/http-errores';
import { AutocompletarPaciente } from '../../shared/molecules/autocompletar-paciente/autocompletar-paciente';
import { FiltroEstados } from '../../shared/molecules/filtro-estados/filtro-estados';
import { TablaCitas } from '../../shared/organisms/tabla-citas/tabla-citas';

const ESPERA_AUTOCOMPLETAR_MS = 300;

@Component({
  selector: 'app-historial-paciente',
  imports: [AutocompletarPaciente, FiltroEstados, TablaCitas],
  templateUrl: './historial-paciente.html',
  styleUrl: './historial-paciente.scss'
})
export class HistorialPaciente {
  private citasService = inject(CitasService);
  private pacientesService = inject(PacientesService);

  private readonly busqueda$ = new Subject<string>();
  readonly estados = ESTADOS_CITA;

  sugerencias = signal<PacienteResumen[]>([]);
  buscandoSugerencias = signal(false);

  documentoConsultado = signal('');
  paciente = signal<PacienteResumen | null>(null);
  historial = signal<CitaListado[]>([]);
  cargando = signal(false);
  error = signal('');
  filtroEstado = signal('');

  conteos = computed(() => contarPorEstado(this.historial()));
  citasVisibles = computed(() => filtrarCitas(this.historial(), { estado: this.filtroEstado(), texto: '' }));
  nombrePaciente = computed(
    () => this.paciente()?.nombre ?? this.historial().find((c) => c.pacienteNombre)?.pacienteNombre ?? ''
  );
  proximaCita = computed(() => {
    const hoy = hoyLocal();
    return [...this.historial()]
      .filter((c) => c.estado === 'Agendada' && c.fecha.substring(0, 10) >= hoy)
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.horaInicio.localeCompare(b.horaInicio))[0] ?? null;
  });
  textoProximaCita = computed(() => {
    const cita = this.proximaCita();
    return cita ? `${fechaLarga(cita.fecha)}, ${formatearHora(cita.horaInicio)} con ${cita.nombreMedico}` : '';
  });

  constructor() {
    // Autocompletado: espera a que el usuario deje de escribir y cancela búsquedas viejas.
    this.busqueda$
      .pipe(
        debounceTime(ESPERA_AUTOCOMPLETAR_MS),
        distinctUntilChanged(),
        tap(() => this.buscandoSugerencias.set(true)),
        switchMap((prefijo) =>
          this.pacientesService.buscarPorDocumento(prefijo).pipe(
            catchError(() => of([] as PacienteResumen[])),
            finalize(() => this.buscandoSugerencias.set(false))
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((pacientes) => this.sugerencias.set(pacientes));
  }

  buscarSugerencias(prefijo: string): void {
    this.busqueda$.next(prefijo);
  }

  seleccionarPaciente(paciente: PacienteResumen): void {
    this.paciente.set(paciente);
    this.consultarHistorial(paciente.documentoIdentidad);
  }

  consultarDocumento(documento: string): void {
    const coincidencia = this.sugerencias().find((p) => p.documentoIdentidad === documento) ?? null;
    this.paciente.set(coincidencia);
    this.consultarHistorial(documento);
  }

  private consultarHistorial(documento: string): void {
    this.documentoConsultado.set(documento);
    this.cargando.set(true);
    this.error.set('');
    this.filtroEstado.set('');
    this.historial.set([]);

    this.citasService.historialPorDocumento(documento).subscribe({
      next: (citas) => {
        this.historial.set(ordenarRecientesPrimero(citas));
        this.cargando.set(false);
      },
      error: (err: unknown) => {
        this.cargando.set(false);
        this.error.set(
          err instanceof HttpErrorResponse && err.status === 404
            ? `No hay ningún paciente registrado con la cédula ${documento}.`
            : mensajeDeError(err, 'No fue posible consultar el historial del paciente.')
        );
      }
    });
  }
}
