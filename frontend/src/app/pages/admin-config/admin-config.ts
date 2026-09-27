import { Component, inject, signal } from '@angular/core';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { MedicosService } from '../../core/services/medicos.service';
import { ConfiguracionMedico, GuardarConfiguracionRequest } from '../../core/models/configuracion.model';
import { Medico } from '../../core/models/cita.model';
import { SelectField, SelectOption } from '../../shared/atoms/select-field/select-field';
import { FormularioConfiguracion } from '../../shared/organisms/formulario-configuracion/formulario-configuracion';

// RF3: Yo como administrador necesito configurar los parametros del sistema
// para que el agendamiento autonomo funcione acorde a la disponibilidad de cada medico/terapista.
@Component({
  selector: 'app-admin-config',
  imports: [SelectField, FormularioConfiguracion],
  templateUrl: './admin-config.html',
  styleUrl: './admin-config.scss'
})
export class AdminConfig {
  private configuracionService = inject(ConfiguracionService);
  private medicosService = inject(MedicosService);

  medicos = signal<Medico[]>([]);
  medicoId = signal('');
  configuracion = signal<ConfiguracionMedico | null>(null);
  mensaje = signal('');

  constructor() {
    this.medicosService.listar().subscribe((medicos) => this.medicos.set(medicos));
  }

  get opcionesMedicos(): SelectOption[] {
    return this.medicos().map((m) => ({ value: m.id, label: `${m.nombre} - ${m.especialidad}` }));
  }

  onMedicoSeleccionado(id: string): void {
    this.medicoId.set(id);
    this.mensaje.set('');

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
      },
      error: () => this.mensaje.set('Ocurrió un error al guardar la configuración.')
    });
  }
}
