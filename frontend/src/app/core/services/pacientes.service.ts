import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Paciente, RegistroPacienteRequest } from '../models/paciente.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PacientesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/pacientes`;

  registrar(request: RegistroPacienteRequest): Observable<Paciente> {
    return this.http.post<Paciente>(`${this.baseUrl}/registro`, request);
  }
}