export type PayloadJwt = Record<string, unknown>;

const CLAIM_ROL_ASPNET = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

/** Decodifica el payload de un JWT (base64url) sin validar la firma. */
export function decodificarPayload(token: string): PayloadJwt | null {
  const partes = token.split('.');
  if (partes.length < 2 || !partes[1]) {
    return null;
  }

  try {
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const relleno = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binario = atob(relleno);
    const bytes = Uint8Array.from(binario, (c) => c.charCodeAt(0));
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    return payload && typeof payload === 'object' ? (payload as PayloadJwt) : null;
  } catch {
    return null;
  }
}

export function tokenExpirado(payload: PayloadJwt | null, ahoraMs = Date.now()): boolean {
  const exp = Number(payload?.['exp'] ?? 0) * 1000;
  return !Number.isFinite(exp) || exp <= ahoraMs;
}

function comoLista(valor: unknown): string[] {
  if (Array.isArray(valor)) return valor.filter((v): v is string => typeof v === 'string');
  if (typeof valor === 'string') return [valor];
  return [];
}

/**
 * Extrae los roles de un token, sin importar quién lo emitió:
 * - Keycloak: realm_access.roles y resource_access[clientId].roles
 * - ASP.NET (primer corte): claim "role" o el URI largo de ClaimTypes.Role
 */
export function extraerRoles(payload: PayloadJwt | null, clientId?: string): string[] {
  if (!payload) return [];

  const realm = payload['realm_access'] as { roles?: unknown } | undefined;
  const recursos = payload['resource_access'] as Record<string, { roles?: unknown }> | undefined;
  const delCliente = clientId ? recursos?.[clientId]?.roles : undefined;

  return [
    ...comoLista(realm?.roles),
    ...comoLista(delCliente),
    ...comoLista(payload['role']),
    ...comoLista(payload['roles']),
    ...comoLista(payload[CLAIM_ROL_ASPNET])
  ];
}

export function claimTexto(payload: PayloadJwt | null, ...claves: string[]): string {
  for (const clave of claves) {
    const valor = payload?.[clave];
    if (typeof valor === 'string' && valor.trim()) return valor;
  }
  return '';
}
