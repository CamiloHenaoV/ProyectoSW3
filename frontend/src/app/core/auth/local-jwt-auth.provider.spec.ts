import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { LocalJwtAuthProvider, TOKEN_KEY, USER_KEY } from './local-jwt-auth.provider';

describe('LocalJwtAuthProvider (estrategia del primer corte)', () => {
  const apiUrl = 'http://localhost:5039/api';
  const usuario = { id: '123', nombre: 'Ana García', email: 'ana@piedrazul.com', rol: 'Paciente' };
  const jwt = (expSegundos: number) =>
    `${btoa(JSON.stringify({ alg: 'HS256' }))}.${btoa(JSON.stringify({ exp: expSegundos }))}.firma`;

  let proveedor: LocalJwtAuthProvider;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    proveedor = new LocalJwtAuthProvider(TestBed.inject(HttpClient), apiUrl);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('guarda token y usuario tras el login y devuelve la sesión', async () => {
    const token = jwt(Math.floor(Date.now() / 1000) + 3600);
    const promesa = proveedor.iniciarSesion({ email: usuario.email, password: 'secreta123' });

    const req = http.expectOne(`${apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush({ token, expiraEn: '1h', usuario });

    const sesion = await promesa;
    expect(sesion?.roles).toEqual(['Paciente']);
    expect(localStorage.getItem(TOKEN_KEY)).toBe(token);
    await expect(proveedor.obtenerToken()).resolves.toBe(token);
  });

  it('no restaura la sesión si el token expiró', async () => {
    localStorage.setItem(TOKEN_KEY, jwt(Math.floor(Date.now() / 1000) - 30));
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
    await expect(proveedor.inicializar()).resolves.toBeNull();
    await expect(proveedor.obtenerToken()).resolves.toBeNull();
  });

  it('exige credenciales y limpia el almacenamiento al cerrar sesión', async () => {
    await expect(proveedor.iniciarSesion()).rejects.toThrow();
    localStorage.setItem(TOKEN_KEY, 'x');
    await proveedor.cerrarSesion();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(localStorage.getItem(USER_KEY)).toBeNull();
  });
});
