/** RF7: refleja ReporteCitasMensualDto del backend. Los arreglos mensuales tienen 12 posiciones (0 = enero). */
export interface SerieCitasMedico {
  medicoId: string;
  nombreMedico: string;
  especialidad: string;
  citasPorMes: number[];
  total: number;
}

export interface ReporteCitasMensual {
  anio: number;
  incluyeCanceladas: boolean;
  medicos: SerieCitasMedico[];
  totalesPorMes: number[];
  total: number;
}

export interface ConsultaReporteCitas {
  anio: number;
  incluirCanceladas: boolean;
  /** Vacío = todos los profesionales. */
  medicoId?: string;
}
