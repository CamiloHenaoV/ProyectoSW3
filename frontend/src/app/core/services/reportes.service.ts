import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ConsultaReporteCitas, ReporteCitasMensual } from '../models/reporte.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/reportes`;

  /** RF7: cantidad de citas por mes y médico/terapista en un año. */
  citasPorMes(consulta: ConsultaReporteCitas): Observable<ReporteCitasMensual> {
    let params = new HttpParams()
      .set('anio', consulta.anio)
      .set('incluirCanceladas', consulta.incluirCanceladas);
    if (consulta.medicoId) params = params.set('medicoId', consulta.medicoId);
    return this.http.get<ReporteCitasMensual>(`${this.baseUrl}/citas-por-mes`, { params });
  }
}
