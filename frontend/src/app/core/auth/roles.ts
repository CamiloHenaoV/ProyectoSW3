/**
 * Roles del sistema. Deben coincidir con los realm roles de Keycloak
 * y con las constantes de Shared/Security/Roles.cs del backend.
 */
export const Rol = {
  Paciente: 'Paciente',
  Agendador: 'Agendador',
  Administrador: 'Administrador',
  Medico: 'Medico',
  Terapista: 'Terapista'
} as const;

export type Rol = (typeof Rol)[keyof typeof Rol];

const ROLES_VALIDOS = new Set<string>(Object.values(Rol));

/** Quienes consultan la agenda de un profesional (RF1) y la exportan (RF4). */
export const ROLES_AGENDA: readonly Rol[] = [Rol.Agendador, Rol.Administrador, Rol.Medico, Rol.Terapista];

/** Quienes consultan el historial de citas de un paciente por cédula (RF5). */
export const ROLES_HISTORIAL: readonly Rol[] = [Rol.Agendador, Rol.Administrador, Rol.Medico, Rol.Terapista];

export const ETIQUETA_ROL: Record<Rol, string> = {
  Paciente: 'Paciente',
  Agendador: 'Agendador',
  Administrador: 'Administrador',
  Medico: 'Médico',
  Terapista: 'Terapista'
};

/** Descarta roles técnicos de Keycloak (offline_access, uma_authorization, default-roles-*). */
export function filtrarRolesDelSistema(roles: readonly string[]): Rol[] {
  return [...new Set(roles.filter((rol) => ROLES_VALIDOS.has(rol)))] as Rol[];
}

/** Pantalla de inicio según el rol de mayor alcance que tenga el usuario. */
export function rutaInicioPorRoles(roles: readonly Rol[]): string {
  if (roles.includes(Rol.Administrador)) return '/admin/configuracion';
  if (roles.some((rol) => ROLES_AGENDA.includes(rol))) return '/citas';
  if (roles.includes(Rol.Paciente)) return '/agendar';
  return '/no-autorizado';
}
