import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AUTH_PROVIDER } from './core/auth/auth-provider';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        {
          provide: AUTH_PROVIDER,
          useValue: {
            usaFormularioPropio: false,
            inicializar: async () => null,
            iniciarSesion: async () => null,
            cerrarSesion: async () => undefined,
            obtenerToken: async () => null
          }
        }
      ]
    }).compileComponents();
  });

  it('crea la aplicación', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('muestra el título y, sin sesión, los enlaces de acceso', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('h1')?.textContent).toContain('Citas Médicas');
    expect(html.querySelector('nav')?.textContent).toContain('Iniciar sesión');
  });
});
