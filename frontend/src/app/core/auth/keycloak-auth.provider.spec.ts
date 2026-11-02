import { ClienteKeycloak, KeycloakAuthProvider } from './keycloak-auth.provider';
import { Rol } from './roles';

describe('KeycloakAuthProvider (adaptador)', () => {
  const config = { url: 'http://localhost:8080', realm: 'piedrazul', clientId: 'piedrazul-frontend' };
  type Simulado<T> = { [K in keyof T]: T[K] extends (...args: never[]) => unknown ? ReturnType<typeof vi.fn> : T[K] };
  let cliente: Simulado<ClienteKeycloak>;

  const crear = () =>
    new KeycloakAuthProvider(config, 'http://localhost:4200', () => cliente as unknown as ClienteKeycloak);

  beforeEach(() => {
    cliente = {
      init: vi.fn().mockResolvedValue(true),
      login: vi.fn().mockResolvedValue(undefined),
      logout: vi.fn().mockResolvedValue(undefined),
      updateToken: vi.fn().mockResolvedValue(false),
      token: 'access-token',
      tokenParsed: {
        sub: 'kc-42',
        name: 'Dra. Ana Restrepo',
        email: 'medico@example.com',
        medico_id: '650000000000000000000001',
        realm_access: { roles: ['Medico', 'default-roles-piedrazul'] }
      },
      onTokenExpired: undefined
    } as unknown as Simulado<ClienteKeycloak>;
  });

  it('inicializa con check-sso y PKCE S256', async () => {
    await crear().inicializar();
    expect(cliente.init).toHaveBeenCalledWith(
      expect.objectContaining({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: 'http://localhost:4200/silent-check-sso.html'
      })
    );
  });

  it('construye la sesión a partir del token de Keycloak', async () => {
    const sesion = await crear().inicializar();
    expect(sesion).toEqual({
      id: 'kc-42',
      nombre: 'Dra. Ana Restrepo',
      email: 'medico@example.com',
      roles: [Rol.Medico],
      medicoId: '650000000000000000000001'
    });
  });

  it('devuelve null si no hay sesión o Keycloak no responde', async () => {
    cliente.init.mockResolvedValueOnce(false);
    await expect(crear().inicializar()).resolves.toBeNull();
    cliente.init.mockRejectedValueOnce(new Error('caído'));
    await expect(crear().inicializar()).resolves.toBeNull();
  });

  it('renueva el token antes de entregarlo', async () => {
    const proveedor = crear();
    await expect(proveedor.obtenerToken()).resolves.toBe('access-token');
    expect(cliente.updateToken).toHaveBeenCalledWith(30);
  });

  it('devuelve null si la renovación falla (sesión expirada en Keycloak)', async () => {
    cliente.updateToken.mockRejectedValueOnce(new Error('expirada'));
    await expect(crear().obtenerToken()).resolves.toBeNull();
  });

  it('redirige a Keycloak para login y logout', async () => {
    const proveedor = crear();
    await proveedor.iniciarSesion();
    expect(cliente.login).toHaveBeenCalledWith({ redirectUri: 'http://localhost:4200/login' });
    await proveedor.cerrarSesion();
    expect(cliente.logout).toHaveBeenCalledWith({ redirectUri: 'http://localhost:4200/login' });
  });
});
