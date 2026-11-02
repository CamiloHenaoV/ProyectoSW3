import { claimTexto, decodificarPayload, extraerRoles, tokenExpirado } from './jwt.utils';

function base64Url(obj: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const token = (payload: unknown) => `${base64Url({ alg: 'RS256' })}.${base64Url(payload)}.firma`;

describe('jwt.utils', () => {
  it('decodifica payloads base64url con tildes', () => {
    expect(decodificarPayload(token({ name: 'Ana Muñoz Ñañez', sub: 'u-1' }))).toEqual({
      name: 'Ana Muñoz Ñañez',
      sub: 'u-1'
    });
  });

  it('devuelve null para tokens mal formados', () => {
    expect(decodificarPayload('no-es-un-jwt')).toBeNull();
    expect(decodificarPayload('a.%%%.c')).toBeNull();
  });

  it('detecta tokens expirados o sin exp', () => {
    const ahora = 1_700_000_000_000;
    expect(tokenExpirado({ exp: ahora / 1000 + 60 }, ahora)).toBe(false);
    expect(tokenExpirado({ exp: ahora / 1000 - 1 }, ahora)).toBe(true);
    expect(tokenExpirado({}, ahora)).toBe(true);
    expect(tokenExpirado(null, ahora)).toBe(true);
  });

  it('extrae roles de realm y de cliente en tokens de Keycloak', () => {
    const payload = {
      realm_access: { roles: ['Agendador', 'offline_access'] },
      resource_access: { 'piedrazul-frontend': { roles: ['Medico'] }, otro: { roles: ['X'] } }
    };
    expect(extraerRoles(payload, 'piedrazul-frontend')).toEqual(['Agendador', 'offline_access', 'Medico']);
  });

  it('extrae el rol del claim largo de ASP.NET (primer corte)', () => {
    const payload = { 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Administrador' };
    expect(extraerRoles(payload)).toEqual(['Administrador']);
  });

  it('claimTexto devuelve el primer claim no vacío', () => {
    expect(claimTexto({ name: '', preferred_username: 'ana' }, 'name', 'preferred_username')).toBe('ana');
    expect(claimTexto(null, 'name')).toBe('');
  });
});
