import { validarRegistro } from './formulario-registro-paciente';

describe('validarRegistro', () => {
  const valido = {
    nombre: 'Ana Gómez',
    documentoIdentidad: '1061234567',
    telefono: '3001234567',
    email: 'ana@correo.com',
    password: 'Segura2026'
  };

  it('acepta datos válidos', () => {
    expect(validarRegistro(valido)).toEqual({});
  });

  it('señala cada campo inválido', () => {
    const errores = validarRegistro({
      nombre: 'A',
      documentoIdentidad: '10.612.345',
      telefono: '12',
      email: 'ana@',
      password: 'corta'
    });
    expect(Object.keys(errores).sort()).toEqual(['documentoIdentidad', 'email', 'nombre', 'password', 'telefono']);
  });
});
