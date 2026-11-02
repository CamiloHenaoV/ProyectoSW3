import { TestBed } from '@angular/core/testing';
import { AUTH_PROVIDER, AuthProvider } from './auth-provider';
import { AuthService } from './auth.service';
import { Rol } from './roles';
import { SesionUsuario } from './sesion.model';

describe('AuthService (fachada)', () => {
  const sesion: SesionUsuario = {
    id: 'kc-1',
    nombre: 'Laura Gómez',
    email: 'agendador@example.com',
    roles: [Rol.Agendador],
    medicoId: null
  };

  let proveedor: { [K in keyof AuthProvider]: K extends 'usaFormularioPropio' ? boolean : ReturnType<typeof vi.fn> };
  let service: AuthService;

  beforeEach(() => {
    proveedor = {
      usaFormularioPropio: false,
      inicializar: vi.fn().mockResolvedValue(sesion),
      iniciarSesion: vi.fn().mockResolvedValue(sesion),
      cerrarSesion: vi.fn().mockResolvedValue(undefined),
      obtenerToken: vi.fn().mockResolvedValue('token-123')
    };
    TestBed.configureTestingModule({ providers: [{ provide: AUTH_PROVIDER, useValue: proveedor }] });
    service = TestBed.inject(AuthService);
  });

  it('arranca sin sesión y la restaura al inicializar', async () => {
    expect(service.autenticado()).toBe(false);
    await service.inicializar();
    expect(service.autenticado()).toBe(true);
    expect(service.sesion()?.nombre).toBe('Laura Gómez');
  });

  it('consulta roles de la sesión', async () => {
    await service.inicializar();
    expect(service.tieneRol(Rol.Agendador)).toBe(true);
    expect(service.tieneRol(Rol.Administrador)).toBe(false);
    expect(service.tieneAlgunRol([Rol.Medico, Rol.Agendador])).toBe(true);
  });

  it('calcula la ruta de inicio según la sesión', async () => {
    expect(service.rutaInicio()).toBe('/login');
    await service.inicializar();
    expect(service.rutaInicio()).toBe('/citas');
  });

  it('delega el login con credenciales al proveedor', async () => {
    await service.iniciarSesion({ email: 'a@b.co', password: 'x' });
    expect(proveedor.iniciarSesion).toHaveBeenCalledWith({ email: 'a@b.co', password: 'x' });
    expect(service.autenticado()).toBe(true);
  });

  it('cierra y descarta la sesión', async () => {
    await service.inicializar();
    await service.cerrarSesion();
    expect(service.autenticado()).toBe(false);
    expect(proveedor.cerrarSesion).toHaveBeenCalled();

    await service.inicializar();
    service.descartarSesion();
    expect(service.autenticado()).toBe(false);
  });

  it('obtiene el token del proveedor', async () => {
    await expect(service.obtenerToken()).resolves.toBe('token-123');
  });
});
