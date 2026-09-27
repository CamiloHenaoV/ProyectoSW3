import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConfiguracionMedico, GuardarConfiguracionRequest } from '../models/configuracion.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/configuracion`;

  obtenerPorMedico(medicoId: string): Observable<ConfiguracionMedico> {
    return this.http.get<ConfiguracionMedico>(`${this.baseUrl}/${medicoId}`);
  }

  guardar(request: GuardarConfiguracionRequest): Observable<ConfiguracionMedico> {
    return this.http.put<ConfiguracionMedico>(this.baseUrl, request);
  }
}