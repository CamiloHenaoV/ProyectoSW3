import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { autenticadoGuard, invitadoGuard, rolesGuard } from './core/auth/auth.guards';
import { ROLES_AGENDA, ROLES_HISTORIAL, Rol } from './core/auth/roles';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: () => inject(AuthService).rutaInicio() },
  {
    path: 'login',
    canActivate: [invitadoGuard],
    title: 'Iniciar sesión · Piedrazul',
    loadComponent: () => import('./pages/login/login').then((m) => m.LoginPage)
  },
  {
    path: 'registro',
    canActivate: [invitadoGuard],
    title: 'Crear cuenta · Piedrazul',
    loadComponent: () => import('./pages/registro/registro').then((m) => m.RegistroPage)
  },
  {
    // RF2
    path: 'agendar',
    canActivate: [rolesGuard(Rol.Paciente)],
    title: 'Agendar cita · Piedrazul',
    loadComponent: () => import('./pages/agendar-cita/agendar-cita').then((m) => m.AgendarCita)
  },
  {
    path: 'mis-citas',
    canActivate: [rolesGuard(Rol.Paciente)],
    title: 'Mis citas · Piedrazul',
    loadComponent: () => import('./pages/mis-citas/mis-citas').then((m) => m.MisCitasPage)
  },
  {
    // RF1 + RF4
    path: 'citas',
    canActivate: [rolesGuard(...ROLES_AGENDA)],
    title: 'Agenda del día · Piedrazul',
    loadComponent: () => import('./pages/citas-medico/citas-medico').then((m) => m.CitasMedico)
  },
  {
    // RF5
    path: 'historial',
    canActivate: [rolesGuard(...ROLES_HISTORIAL)],
    title: 'Historial por cédula · Piedrazul',
    loadComponent: () => import('./pages/historial-paciente/historial-paciente').then((m) => m.HistorialPaciente)
  },
  {
    // RF3
    path: 'admin/configuracion',
    canActivate: [rolesGuard(Rol.Administrador)],
    title: 'Configuración · Piedrazul',
    loadComponent: () => import('./pages/admin-config/admin-config').then((m) => m.AdminConfig)
  },
  {
    path: 'no-autorizado',
    canActivate: [autenticadoGuard],
    title: 'Sin permiso · Piedrazul',
    loadComponent: () => import('./pages/no-autorizado/no-autorizado').then((m) => m.NoAutorizadoPage)
  },
  { path: '**', redirectTo: '' }
];
