import { HttpClient } from '@angular/common/http';
import { EnvironmentProviders, Provider, inject, provideAppInitializer } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { environment } from '../../../environments/environment';
import { AUTH_PROVIDER, AuthProvider } from './auth-provider';
import { AuthService } from './auth.service';
import { KeycloakAuthProvider } from './keycloak-auth.provider';
import { LocalJwtAuthProvider } from './local-jwt-auth.provider';

/** Factory Method: decide qué estrategia de autenticación se inyecta. */
export function crearAuthProvider(): AuthProvider {
  const { auth, apiUrl } = environment;
  if (auth.proveedor === 'local') {
    return new LocalJwtAuthProvider(inject(HttpClient), apiUrl);
  }
  const origen = inject(DOCUMENT).location.origin;
  return new KeycloakAuthProvider(auth.keycloak, origen);
}

/** Registra el proveedor y restaura la sesión antes de la primera navegación. */
export function provideAuth(): (Provider | EnvironmentProviders)[] {
  return [
    { provide: AUTH_PROVIDER, useFactory: crearAuthProvider },
    provideAppInitializer(() => inject(AuthService).inicializar())
  ];
}
