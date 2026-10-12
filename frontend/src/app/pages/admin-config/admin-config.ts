import { Component, inject, signal } from '@angular/core';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { MedicosService } from '../../core/services/medicos.service';
import { ConfiguracionMedico, GuardarConfiguracionRequest } from '../../core/models/configuracion.model';
import { Medico } from '../../core/models/cita.model';
import { SelectField, SelectOption } from '../../shared/atoms/select-field/select-field';
import { Button } from '../../shared/atoms/button/button';
import { FormularioConfiguracion } from '../../shared/organisms/formulario-configuracion/formulario-configuracion';

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

  constructor() {
    this.medicosService.listar(true).subscribe({
      next: (medicos) => this.medicos.set(medicos),
      error: () => this.mensaje.set('No fue posible cargar los médicos/terapistas.')
    });
    this.cargarConfiguraciones();
  }

  get opcionesMedicos(): SelectOption[] {
    return this.medicos()
      .filter((medico) => medico.activo)
      .map((medico) => ({ value: medico.id, label: `${medico.nombre} - ${medico.especialidad}` }));
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
        this.mensaje.set('Configuración guardada correctamente.');
        this.cargarConfiguraciones();
      },
      error: () => this.mensaje.set('Ocurrió un error al guardar la configuración.')
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
      this.mensaje.set('No fue posible encontrar el médico/terapista.');
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
        this.mensaje.set(`Médico/terapista ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`);
      },
      error: () => this.mensaje.set(`Ocurrió un error al ${accion} al médico/terapista.`)
    });
  }

  estaActivo(medicoId: string): boolean {
    return this.medicos().find((medico) => medico.id === medicoId)?.activo ?? true;
  }

  nombreMedico(medicoId: string): string {
    const medico = this.medicos().find((item) => item.id === medicoId);
    return medico ? `${medico.nombre} - ${medico.especialidad}` : medicoId;
  }

  private cargarConfiguraciones(): void {
    this.configuracionService.listar().subscribe({
      next: (configuraciones) => this.configuraciones.set(configuraciones),
      error: () => this.mensaje.set('No fue posible cargar las configuraciones existentes.')
    });
  }
}
