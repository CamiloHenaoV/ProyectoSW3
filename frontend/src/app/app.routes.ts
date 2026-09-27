import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'citas', pathMatch: 'full' },
  {
    path: 'citas',
    loadComponent: () => import('./pages/citas-medico/citas-medico').then((m) => m.CitasMedico)
  },
  {
    path: 'agendar',
    loadComponent: () => import('./pages/agendar-cita/agendar-cita').then((m) => m.AgendarCita)
  },
  {
    path: 'admin/configuracion',
    loadComponent: () => import('./pages/admin-config/admin-config').then((m) => m.AdminConfig)
  }
];
