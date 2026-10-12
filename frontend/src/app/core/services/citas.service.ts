import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AgendarCitaRequest, CitaListado, FranjaDisponible, ReagendarCitaRequest } from '../models/cita.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CitasService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/citas`;

  listarPorMedicoYFecha(medicoId: string, fecha: string): Observable<CitaListado[]> {
    const params = new HttpParams().set('medicoId', medicoId).set('fecha', fecha);
    return this.http.get<CitaListado[]>(this.baseUrl, { params });
  }

  misCitas(): Observable<CitaListado[]> {
    return this.http.get<CitaListado[]>(`${this.baseUrl}/mis-citas`);
  }

  obtenerFranjasDisponibles(medicoId: string, fecha: string): Observable<FranjaDisponible[]> {
    const params = new HttpParams().set('medicoId', medicoId).set('fecha', fecha);
    return this.http.get<FranjaDisponible[]>(`${this.baseUrl}/franjas-disponibles`, { params });
  }

  agendar(request: AgendarCitaRequest): Observable<CitaListado> {
    return this.http.post<CitaListado>(`${this.baseUrl}/agendar`, request);
  }

  cancelar(id: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}/cancelar`, {});
  }

  reagendar(id: string, request: ReagendarCitaRequest): Observable<CitaListado> {
    return this.http.put<CitaListado>(`${this.baseUrl}/${id}/reagendar`, request);
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}