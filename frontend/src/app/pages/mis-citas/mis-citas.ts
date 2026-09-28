import { Component, inject, signal } from '@angular/core';
import { CitasService } from '../../core/services/citas.service';
import { AuthService } from '../../core/services/auth.service';
import { CitaListado } from '../../core/models/cita.model';
import { TablaCitas } from '../../shared/organisms/tabla-citas/tabla-citas';

@Component({
  selector: 'app-mis-citas',
  imports: [TablaCitas],
  templateUrl: './mis-citas.html',
  styleUrl: './mis-citas.scss'
})
export class MisCitasPage {
  private citasService = inject(CitasService);
  private authService = inject(AuthService);

  citas = signal<CitaListado[]>([]);
  mensaje = signal('');

  ngOnInit(): void {
    const usuario = this.authService.getUsuario();
    if (!usuario) {
      this.mensaje.set('Debes iniciar sesión para ver tus citas.');
      return;
    }

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
