import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.RegistroPage)
  },
  {
    path: 'mis-citas',
    loadComponent: () => import('./pages/mis-citas/mis-citas').then((m) => m.MisCitasPage)
  },
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
