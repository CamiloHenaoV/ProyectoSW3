import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, catchError, map, of, switchMap, tap } from 'rxjs';
import { MedicosService } from '../../core/services/medicos.service';
import { ReportesService } from '../../core/services/reportes.service';
import { Medico } from '../../core/models/cita.model';
import { ConsultaReporteCitas, ReporteCitasMensual } from '../../core/models/reporte.model';
import { formatearEntero } from '../../core/utils/escala-grafico';
import { MESES_CORTOS, MESES_LARGOS, aniosSeleccionables, prepararSeries, resumirReporte } from '../../core/utils/reporte-citas';
import { mensajeDeError } from '../../core/utils/http-errores';
import { SelectField, SelectOption } from '../../shared/atoms/select-field/select-field';
import { Button } from '../../shared/atoms/button/button';
import { GraficoBarrasAgrupadas } from '../../shared/organisms/grafico-barras-agrupadas/grafico-barras-agrupadas';
import { TablaReporteCitas } from '../../shared/organisms/tabla-reporte-citas/tabla-reporte-citas';

type Resultado = { reporte: ReporteCitasMensual; error?: undefined } | { reporte?: undefined; error: string };

// RF7: reporte gráfico de cantidad de citas por mes y médico/terapista, para un año elegido.
@Component({
  selector: 'app-reporte-citas',
  imports: [SelectField, Button, GraficoBarrasAgrupadas, TablaReporteCitas],
  templateUrl: './reporte-citas.html',
  styleUrl: './reporte-citas.scss'
})
export class ReporteCitas implements OnInit {
  private reportesService = inject(ReportesService);
  private medicosService = inject(MedicosService);

  private readonly consultas$ = new Subject<ConsultaReporteCitas>();

  readonly meses = MESES_CORTOS;
  readonly mesesLargos = MESES_LARGOS;
  readonly anioActual = new Date().getFullYear();
  readonly opcionesAnio: SelectOption[] = aniosSeleccionables(this.anioActual).map((a) => ({
    value: String(a),
    label: String(a)
  }));

  medicos = signal<Medico[]>([]);
  anio = signal(this.anioActual);
  medicoId = signal('');
  incluirCanceladas = signal(false);

  reporte = signal<ReporteCitasMensual | null>(null);
  cargando = signal(false);
  error = signal('');

  opcionesMedico = computed<SelectOption[]>(() => [
    { value: '', label: 'Todos los profesionales' },
    ...this.medicos().map((m) => ({ value: m.id, label: `${m.nombre} · ${m.especialidad}` }))
  ]);

  /** Orden estable para los colores: el del listado de médicos, no el del resultado. */
  private ordenColores = computed(() => this.medicos().map((m) => m.id));

  series = computed(() => {
    const reporte = this.reporte();
    return reporte ? prepararSeries(reporte.medicos, this.ordenColores()) : [];
  });

  resumen = computed(() => {
    const reporte = this.reporte();
    return reporte ? resumirReporte(reporte) : null;
  });

  subtitulo = computed(() => {
    const reporte = this.reporte();
    if (!reporte) return '';
    const alcance =
      reporte.medicos.length === 1 && this.medicoId() ? reporte.medicos[0].nombreMedico : 'Todos los profesionales';
    return `${alcance} · ${reporte.incluyeCanceladas ? 'incluye canceladas' : 'sin canceladas'}`;
  });

  tituloGrafico = computed(() => {
    const reporte = this.reporte();
    return reporte
      ? `Cantidad de citas por mes y profesional en ${reporte.anio}, ${this.subtitulo()}. Total: ${formatearEntero(reporte.total)} citas.`
      : '';
  });

  formatear = formatearEntero;

  constructor() {
    // Cada cambio de filtro dispara una consulta; switchMap descarta respuestas viejas
    // si el usuario cambia de año rápido, así el gráfico nunca muestra un año equivocado.
    this.consultas$
      .pipe(
        tap(() => {
          this.cargando.set(true);
          this.error.set('');
        }),
        switchMap((consulta) =>
          this.reportesService.citasPorMes(consulta).pipe(
            map((reporte): Resultado => ({ reporte })),
            catchError((err) => of<Resultado>({ error: mensajeDeError(err, 'No fue posible generar el reporte de citas.') }))
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((resultado) => {
        this.cargando.set(false);
        if (resultado.reporte) this.reporte.set(resultado.reporte);
        else this.error.set(resultado.error ?? '');
      });
  }

  ngOnInit(): void {
    this.medicosService.listar().subscribe({
      next: (medicos) => this.medicos.set(medicos),
      error: () => this.medicos.set([])
    });
    this.generar();
  }

  cambiarAnio(valor: string): void {
    this.anio.set(Number(valor));
    this.generar();
  }

  cambiarMedico(valor: string): void {
    this.medicoId.set(valor);
    this.generar();
  }

  cambiarCanceladas(evento: Event): void {
    this.incluirCanceladas.set((evento.target as HTMLInputElement).checked);
    this.generar();
  }

  generar(): void {
    this.consultas$.next({
      anio: this.anio(),
      incluirCanceladas: this.incluirCanceladas(),
      medicoId: this.medicoId() || undefined
    });
  }

  imprimir(): void {
    window.print();
  }
}
