import { ROLES_REPORTES, Rol, filtrarRolesDelSistema, rutaInicioPorRoles } from './roles';

describe('roles', () => {
  it('descarta roles técnicos de Keycloak y duplicados', () => {
    expect(filtrarRolesDelSistema(['default-roles-piedrazul', 'Paciente', 'uma_authorization', 'Paciente'])).toEqual([
      Rol.Paciente
    ]);
  });

  it('elige la pantalla de inicio según el rol de mayor alcance', () => {
    expect(rutaInicioPorRoles([Rol.Paciente])).toBe('/agendar');
    expect(rutaInicioPorRoles([Rol.Agendador])).toBe('/citas');
    expect(rutaInicioPorRoles([Rol.Medico])).toBe('/citas');
    expect(rutaInicioPorRoles([Rol.Terapista])).toBe('/citas');
    expect(rutaInicioPorRoles([Rol.Agendador, Rol.Administrador])).toBe('/admin/configuracion');
    expect(rutaInicioPorRoles([])).toBe('/no-autorizado');
  });

  it('el reporte de citas por mes (RF7) es para médicos, terapistas y administrador, no para pacientes', () => {
    expect(ROLES_REPORTES).toEqual([Rol.Medico, Rol.Terapista, Rol.Administrador]);
    expect(ROLES_REPORTES).not.toContain(Rol.Paciente);
  });
});
