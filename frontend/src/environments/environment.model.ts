export type ProveedorAutenticacion = 'keycloak' | 'local';

export interface ConfiguracionKeycloak {
  url: string;
  realm: string;
  clientId: string;
}

export interface ConfiguracionEntorno {
  production: boolean;
  apiUrl: string;
  auth: {
    proveedor: ProveedorAutenticacion;
    keycloak: ConfiguracionKeycloak;
  };
}
