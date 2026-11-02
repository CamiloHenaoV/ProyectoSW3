import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CitasService } from '../../core/services/citas.service';
import { MedicosService } from '../../core/services/medicos.service';
import { AuthService } from '../../core/auth/auth.service';
import { Rol } from '../../core/auth/roles';
import { CitaListado, Medico } from '../../core/models/cita.model';
import { ExportacionCitasService } from '../../core/export/exportacion-citas.service';
import { ESTADOS_CITA, contarPorEstado, filtrarCitas, ordenarPorHora } from '../../core/utils/filtros-citas';
import { fechaLarga, hoyLocal } from '../../core/utils/fechas';
import { mensajeDeError } from '../../core/utils/http-errores';
import { FiltroFechaMedico } from '../../shared/molecules/filtro-fecha-medico/filtro-fecha-medico';
import { FiltroEstados } from '../../shared/molecules/filtro-estados/filtro-estados';
import { TablaCitas } from '../../shared/organisms/tabla-citas/tabla-citas';
import { SelectField } from '../../shared/atoms/select-field/select-field';
import { InputField } from '../../shared/atoms/input-field/input-field';
import { Button } from '../../shared/atoms/button/button';

interface ConsultaRealizada {
  medicoId: string;
  medicoNombre: string;
  fecha: string;
}

// RF1: listar las citas de un médico/terapista en una fecha (filtros + tabla + cantidad).
// RF4: exportar esas citas a CSV para la jornada de atención.
@Component({
  selector: 'app-citas-medico',
  imports: [FiltroFechaMedico, FiltroEstados, TablaCitas, SelectField, InputField, Button],
  templateUrl: './citas-medico.html',
  styleUrl: './citas-medico.scss'
})
export class CitasMedico implements OnInit {
  private citasService = inject(CitasService);
  private medicosService = inject(MedicosService);
  private authService = inject(AuthService);
  private exportacion = inject(ExportacionCitasService);

  readonly estados = ESTADOS_CITA;
  readonly formatos = this.exportacion.formatos();

  medicos = signal<Medico[]>([]);
  medicoId = signal('');
  fecha = signal(hoyLocal());
  /** Un médico/terapista con claim medico_id solo ve su propia agenda. */
  medicoBloqueado = signal(false);

  citas = signal<CitaListado[]>([]);
  consulta = signal<ConsultaRealizada | null>(null);
  cargando = signal(false);
  error = signal('');

  filtroEstado = signal('');
  filtroTexto = signal('');
  formato = signal(this.formatos[0]?.value ?? 'csv-excel');
  avisoExportacion = signal('');

  esAdministrador = computed(() => this.authService.tieneRol(Rol.Administrador));
  puedeCancelar = computed(() => this.authService.tieneAlgunRol([Rol.Agendador, Rol.Administrador]));

  conteos = computed(() => contarPorEstado(this.citas()));
  citasVisibles = computed(() =>
    filtrarCitas(this.citas(), { estado: this.filtroEstado(), texto: this.filtroTexto() })
  );
  hayFiltros = computed(() => !!this.filtroEstado() || !!this.filtroTexto().trim());
  tituloResultados = computed(() => {
    const c = this.consulta();
    return c ? `${c.medicoNombre} · ${fechaLarga(c.fecha)}` : '';
  });
  mensajeVacio = computed(() =>
    this.citas().length
      ? 'Ninguna cita coincide con los filtros aplicados.'
      : 'Este profesional no tiene citas en la fecha seleccionada.'
  );

  ngOnInit(): void {
    const medicoPropio = this.authService.sesion()?.medicoId;
    if (medicoPropio && this.authService.tieneAlgunRol([Rol.Medico, Rol.Terapista])) {
      this.medicoId.set(medicoPropio);
      this.medicoBloqueado.set(true);
    }

    this.medicosService.listar().subscribe({
      next: (medicos) => {
        this.medicos.set(medicos);
        if (this.medicoBloqueado()) this.buscar();
      },
      error: (err) => this.error.set(mensajeDeError(err, 'No fue posible cargar el listado de médicos y terapistas.'))
    });
  }

  buscar(): void {
    if (!this.medicoId() || !this.fecha()) {
      this.error.set('Selecciona un médico o terapista y una fecha.');
      return;
    }

    const consulta: ConsultaRealizada = {
      medicoId: this.medicoId(),
      medicoNombre: this.medicos().find((m) => m.id === this.medicoId())?.nombre ?? 'Profesional',
      fecha: this.fecha()
    };

    this.error.set('');
    this.avisoExportacion.set('');
    this.cargando.set(true);
    this.citasService.listarPorMedicoYFecha(consulta.medicoId, consulta.fecha).subscribe({
      next: (citas) => {
        this.citas.set(ordenarPorHora(citas));
        this.consulta.set(consulta);
        this.filtroEstado.set('');
        this.filtroTexto.set('');
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(mensajeDeError(err, 'Ocurrió un error al consultar las citas.'));
      }
    });
  }

  exportar(): void {
    const consulta = this.consulta();
    const citas = this.citasVisibles();
    if (!consulta || !citas.length) return;

    try {
      const archivo = this.exportacion.exportar(citas, this.formato(), {
        medico: consulta.medicoNombre,
        fecha: consulta.fecha
      });
      this.avisoExportacion.set(`Se descargó ${archivo} con ${citas.length} cita(s).`);
    } catch {
      this.error.set('No fue posible generar el archivo de exportación.');
    }
  }

  cancelar(citaId: string): void {
    if (!window.confirm('¿Confirmas que deseas cancelar esta cita? El horario quedará libre para otro paciente.')) return;
    this.citasService.cancelar(citaId).subscribe({
      next: () => this.buscar(),
      error: (err) => this.error.set(mensajeDeError(err, 'No fue posible cancelar la cita.'))
    });
  }

  eliminar(citaId: string): void {
    if (!window.confirm('¿Confirmas que deseas eliminar esta cita? Esta acción no se puede deshacer.')) return;
    this.citasService.eliminar(citaId).subscribe({
      next: () => this.buscar(),
      error: (err) => this.error.set(mensajeDeError(err, 'No fue posible eliminar la cita.'))
    });
  }
}
