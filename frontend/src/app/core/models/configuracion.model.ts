export interface ConfiguracionMedico {
  id: string;
  medicoId: string;
  diasAtencion: number[]; // 0=Domingo .. 6=Sabado
  horaInicio: string;
  horaFin: string;
  intervaloMinutos: number;
  semanasHabilitadas: number;
}

export interface GuardarConfiguracionRequest {
  medicoId: string;
  diasAtencion: number[];
  horaInicio: string;
  horaFin: string;
  intervaloMinutos: number;
  semanasHabilitadas: number;
}