import { Component, inject, signal } from '@angular/core';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { MedicosService } from '../../core/services/medicos.service';
import { ConfiguracionMedico, GuardarConfiguracionRequest } from '../../core/models/configuracion.model';
import { Medico } from '../../core/models/cita.model';
import { SelectField, SelectOption } from '../../shared/atoms/select-field/select-field';
import { Button } from '../../shared/atoms/button/button';
import { FormularioConfiguracion } from '../../shared/organisms/formulario-configuracion/formulario-configuracion';
import { mensajeDeError } from '../../core/utils/http-errores';

// RF3: Yo como administrador necesito configurar los parametros del sistema
// para que el agendamiento autonomo funcione acorde a la disponibilidad de cada medico/terapista.
@Component({
  selector: 'app-admin-config',
  imports: [SelectField, Button, FormularioConfiguracion],
  templateUrl: './admin-config.html',
  styleUrl: './admin-config.scss'
})
export class AdminConfig {
  private configuracionService = inject(ConfiguracionService);
  private medicosService = inject(MedicosService);

  medicos = signal<Medico[]>([]);
  configuraciones = signal<ConfiguracionMedico[]>([]);
  medicoId = signal('');
  configuracion = signal<ConfiguracionMedico | null>(null);
  mensaje = signal('');
  mensajeEsError = signal(false);

  constructor() {
    this.medicosService.listar(true).subscribe({
      next: (medicos) => this.medicos.set(medicos),
      error: (err) => this.avisarError(mensajeDeError(err, 'No fue posible cargar los médicos y terapistas.'))
    });
    this.cargarConfiguraciones();
  }

  get opcionesMedicos(): SelectOption[] {
    return this.medicos()
      .filter((medico) => medico.activo)
      .map((medico) => ({ value: medico.id, label: `${medico.nombre} · ${medico.especialidad}` }));
  }

  onMedicoSeleccionado(id: string): void {
    this.medicoId.set(id);
    this.mensaje.set('');
    this.configuracion.set(null);

    if (!id) {
      return;
    }

    this.configuracionService.obtenerPorMedico(id).subscribe({
      next: (config) => this.configuracion.set(config),
      error: () => this.configuracion.set(null) // aun no existe configuracion para este medico
    });
  }

  guardar(request: GuardarConfiguracionRequest): void {
    this.configuracionService.guardar(request).subscribe({
      next: (config) => {
        this.configuracion.set(config);
        this.avisar('Configuración guardada. Los pacientes ya ven la nueva disponibilidad.');
        this.cargarConfiguraciones();
      },
      error: (err) => this.avisarError(mensajeDeError(err, 'Ocurrió un error al guardar la configuración.'))
    });
  }

  editar(configuracion: ConfiguracionMedico): void {
    this.medicoId.set(configuracion.medicoId);
    this.configuracion.set(configuracion);
    this.mensaje.set('');
  }

  cambiarEstado(configuracion: ConfiguracionMedico): void {
    const medico = this.medicos().find((item) => item.id === configuracion.medicoId);
    if (!medico) {
      this.avisarError('No fue posible encontrar el médico o terapista.');
      return;
    }

    const nuevoEstado = !medico.activo;
    const accion = nuevoEstado ? 'activar' : 'desactivar';
    if (!window.confirm(`¿Confirmas que deseas ${accion} a ${medico.nombre}?`)) {
      return;
    }

    this.medicosService.actualizarEstado(medico.id, nuevoEstado).subscribe({
      next: (medicoActualizado) => {
        this.medicos.update((medicos) =>
          medicos.map((item) => item.id === medicoActualizado.id ? medicoActualizado : item)
        );
        if (!medicoActualizado.activo && this.medicoId() === medicoActualizado.id) {
          this.medicoId.set('');
          this.configuracion.set(null);
        }
        this.avisar(`${medico.nombre} quedó ${nuevoEstado ? 'activo' : 'inactivo'}.`);
      },
      error: (err) => this.avisarError(mensajeDeError(err, `Ocurrió un error al ${accion} a ${medico.nombre}.`))
    });
  }

  estaActivo(medicoId: string): boolean {
    return this.medicos().find((medico) => medico.id === medicoId)?.activo ?? true;
  }

  nombreMedico(medicoId: string): string {
    const medico = this.medicos().find((item) => item.id === medicoId);
    return medico ? `${medico.nombre} · ${medico.especialidad}` : medicoId;
  }

  private cargarConfiguraciones(): void {
    this.configuracionService.listar().subscribe({
      next: (configuraciones) => this.configuraciones.set(configuraciones),
      error: (err) => this.avisarError(mensajeDeError(err, 'No fue posible cargar las configuraciones existentes.'))
    });
  }

  private avisar(texto: string): void {
    this.mensaje.set(texto);
    this.mensajeEsError.set(false);
  }

  private avisarError(texto: string): void {
    this.mensaje.set(texto);
    this.mensajeEsError.set(true);
  }
}
