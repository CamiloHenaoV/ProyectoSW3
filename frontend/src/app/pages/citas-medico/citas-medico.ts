import { Component, OnInit, inject, signal } from '@angular/core';
import { CitasService } from '../../core/services/citas.service';
import { MedicosService } from '../../core/services/medicos.service';
import { CitaListado, Medico } from '../../core/models/cita.model';
import { FiltroFechaMedico } from '../../shared/molecules/filtro-fecha-medico/filtro-fecha-medico';
import { TablaCitas } from '../../shared/organisms/tabla-citas/tabla-citas';

// RF1: Yo como agendador de citas necesito listar las citas medicas
// de un determinado medico/terapista en una fecha determinada.
@Component({
  selector: 'app-citas-medico',
  imports: [FiltroFechaMedico, TablaCitas],
  templateUrl: './citas-medico.html',
  styleUrl: './citas-medico.scss'
})
export class CitasMedico implements OnInit {
  private citasService = inject(CitasService);
  private medicosService = inject(MedicosService);

  medicos = signal<Medico[]>([]);
  citas = signal<CitaListado[]>([]);
  medicoId = signal('');
  fecha = signal(new Date().toISOString().substring(0, 10));
  mensajeError = signal('');
  cargando = signal(false);

  ngOnInit(): void {
    this.medicosService.listar().subscribe({
      next: (medicos) => this.medicos.set(medicos),
      error: () => this.mensajeError.set('No fue posible cargar el listado de médicos/terapistas.')
    });
  }

  buscar(): void {
    if (!this.medicoId() || !this.fecha()) {
      this.mensajeError.set('Selecciona un médico/terapista y una fecha.');
      return;
    }
    this.mensajeError.set('');
    this.cargando.set(true);

    this.citasService.listarPorMedicoYFecha(this.medicoId(), this.fecha()).subscribe({
      next: (citas) => {
        this.citas.set(citas);
        this.cargando.set(false);
      },
      error: () => {
        this.mensajeError.set('Ocurrió un error al consultar las citas.');
        this.cargando.set(false);
      }
    });
  }
}
