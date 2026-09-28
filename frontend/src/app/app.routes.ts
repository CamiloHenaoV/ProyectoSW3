import { inject } from '@angular/core';
import { CanActivateFn, Routes, Router, UrlTree } from '@angular/router';
import { AuthService } from './core/services/auth.service';

const authGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

const pacienteGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated() && authService.hasRole('Paciente')
    ? true
    : router.createUrlTree(['/login']);
};

const agendadorGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated() && authService.hasRole('Agendador')
    ? true
    : router.createUrlTree(['/login']);
};

const adminGuard: CanActivateFn = (): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);
  return authService.isAuthenticated() && authService.hasRole('Administrador')
    ? true
    : router.createUrlTree(['/login']);
};

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
    canActivate: [authGuard, pacienteGuard],
    loadComponent: () => import('./pages/mis-citas/mis-citas').then((m) => m.MisCitasPage)
  },
  {
    path: 'citas',
    canActivate: [authGuard, agendadorGuard],
    loadComponent: () => import('./pages/citas-medico/citas-medico').then((m) => m.CitasMedico)
  },
  {
    path: 'agendar',
    canActivate: [authGuard, pacienteGuard],
    loadComponent: () => import('./pages/agendar-cita/agendar-cita').then((m) => m.AgendarCita)
  },
  {
    path: 'admin/configuracion',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./pages/admin-config/admin-config').then((m) => m.AdminConfig)
  }
];
