import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const isVercelBuild = process.env.VERCEL === '1';

const values = {
  API_URL: process.env.API_URL?.trim() || 'http://localhost:5039/api',
  KEYCLOAK_URL: process.env.KEYCLOAK_URL?.trim() || 'http://localhost:8080',
  KEYCLOAK_REALM: process.env.KEYCLOAK_REALM?.trim() || 'piedrazul',
  KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID?.trim() || 'piedrazul-frontend'
};

if (isVercelBuild) {
  const missing = Object.entries(values)
    .filter(([name]) => !process.env[name]?.trim())
    .map(([name]) => name);

  if (missing.length > 0) {
    throw new Error(`Missing Vercel environment variables: ${missing.join(', ')}`);
  }

  for (const name of ['API_URL', 'KEYCLOAK_URL']) {
    let url;
    try {
      url = new URL(values[name]);
    } catch {
      throw new Error(`${name} must be an absolute URL.`);
    }

    if (url.protocol !== 'https:' || url.hostname === 'localhost') {
      throw new Error(`${name} must use a public HTTPS URL in Vercel.`);
    }

    if (url.username || url.password) {
      throw new Error(`${name} must not contain embedded credentials.`);
    }
  }

  if (new URL(values.API_URL).pathname.replace(/\/+$/, '') !== '/api') {
    throw new Error('API_URL must end in /api.');
  }
}

const environment = {
  production: true,
  apiUrl: values.API_URL.replace(/\/+$/, ''),
  auth: {
    proveedor: 'keycloak',
    keycloak: {
      url: values.KEYCLOAK_URL.replace(/\/+$/, ''),
      realm: values.KEYCLOAK_REALM,
      clientId: values.KEYCLOAK_CLIENT_ID
    }
  }
};

const outputPath = fileURLToPath(
  new URL('../src/environments/environment.production.generated.ts', import.meta.url)
);
const source = [
  "import { ConfiguracionEntorno } from './environment.model';",
  '',
  `export const environment: ConfiguracionEntorno = ${JSON.stringify(environment, null, 2)};`,
  ''
].join('\n');

writeFileSync(outputPath, source, 'utf8');
console.log('Generated production frontend configuration.');
