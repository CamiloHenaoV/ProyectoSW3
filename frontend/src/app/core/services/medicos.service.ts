import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Medico } from '../models/cita.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MedicosService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/medicos`;

  listar(): Observable<Medico[]> {
    return this.http.get<Medico[]>(this.baseUrl);
  }
}