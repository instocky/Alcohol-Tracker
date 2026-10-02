// Pure calculation: граммы спирта = объём × ABV × плотность этанола.
// Кратко — round до 2 знаков (снапшот в Event).

const ETHANOL_DENSITY = 0.789; // г/мл

export function computePureAlcohol(volume_ml: number, abv: number): number {
  const raw = volume_ml * (abv / 100) * ETHANOL_DENSITY;
  return Math.round(raw * 100) / 100;
}