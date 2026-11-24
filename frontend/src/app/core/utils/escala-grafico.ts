export interface EscalaEje {
  /** Valor que corresponde a la parte superior del área de trazado. */
  tope: number;
  /** Marcas del eje, de 0 al tope, en pasos "redondos" (1, 2, 5 × 10ⁿ). */
  marcas: number[];
}

/**
 * Eje vertical con marcas enteras y redondas para conteos.
 * escalaEje(37) → { tope: 40, marcas: [0, 10, 20, 30, 40] }
 */
export function escalaEje(maximo: number, divisiones = 4): EscalaEje {
  if (!Number.isFinite(maximo) || maximo <= 0) {
    return { tope: divisiones, marcas: Array.from({ length: divisiones + 1 }, (_, i) => i) };
  }

  const pasoCrudo = maximo / divisiones;
  const magnitud = 10 ** Math.floor(Math.log10(pasoCrudo));
  const multiplo = [1, 2, 5, 10].find((m) => m * magnitud >= pasoCrudo) ?? 10;
  // Un conteo nunca tiene marcas fraccionarias.
  const paso = Math.max(1, multiplo * magnitud);
  const tope = Math.ceil(maximo / paso) * paso;

  const marcas: number[] = [];
  for (let valor = 0; valor <= tope; valor += paso) marcas.push(valor);
  return { tope, marcas };
}

/** 1284 → "1.284" (separador de miles de Colombia). */
export function formatearEntero(valor: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor);
}
