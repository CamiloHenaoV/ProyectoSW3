import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente, PacienteResumen, RegistroPacienteRequest } from '../models/paciente.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/pacientes`;

  registrar(request: RegistroPacienteRequest): Observable<Paciente> {
    return this.http.post<Paciente>(`${this.baseUrl}/registro`, request);
  }

  /** Autocompletado: pacientes cuya cédula empieza por el texto escrito. */
  buscarPorDocumento(prefijo: string, limite = 8): Observable<PacienteResumen[]> {
    const params = new HttpParams().set('documento', prefijo).set('limite', limite);
    return this.http.get<PacienteResumen[]>(`${this.baseUrl}/buscar`, { params });
  }
}
