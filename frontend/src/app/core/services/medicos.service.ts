import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Medico } from '../models/cita.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MedicosService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/medicos`;

  listar(incluirInactivos = false): Observable<Medico[]> {
    const params = new HttpParams().set('incluirInactivos', incluirInactivos);
    return this.http.get<Medico[]>(this.baseUrl, { params });
  }

  actualizarEstado(medicoId: string, activo: boolean): Observable<Medico> {
    return this.http.put<Medico>(`${this.baseUrl}/${medicoId}/estado`, { activo });
  }
}