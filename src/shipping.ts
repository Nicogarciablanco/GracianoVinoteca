const nationalZones = [
  { provinces: ['Córdoba', 'Santa Fe', 'Entre Ríos', 'San Luis', 'Santiago del Estero'],
    base: 6200, extraPackage: 1800, days: [2, 4] },
  { provinces: ['CABA', 'Buenos Aires', 'Catamarca', 'Chaco', 'Corrientes', 'Formosa',
    'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Salta', 'San Juan', 'Tucumán'],
    base: 8400, extraPackage: 2300, days: [3, 6] },
  { provinces: ['Chubut', 'Neuquén', 'Río Negro', 'Santa Cruz', 'Tierra del Fuego'],
    base: 11500, extraPackage: 3000, days: [5, 9] },
] as const;

export const provinces = nationalZones.flatMap(({ provinces }) => [...provinces])
  .sort((a, b) => a.localeCompare(b, 'es-AR'));

export const localQuote = { status: 'quoted', cost: 3500, days: [1, 2] } as const;
const unitsPerPackage = 6;

export type NationalDestination = {
  postal: string;
  province: string;
  locality: string;
  street: string;
  number: string;
  unit: string;
};
export type QuoteScenario = 'standard' | 'unavailable' | 'error';
export type Quote = { status: 'quoted'; cost: number; days: readonly [number, number] }
  | { status: 'idle' | 'invalid-postal' | 'needs-destination' | 'unavailable' | 'error' };

export const quoteFeedback = {
  idle: 'Ingresá un código postal de prueba para consultar el envío.',
  'invalid-postal': 'Ingresá 4 dígitos o un CPA completo, sin espacios ni guiones.',
  'needs-destination': 'La demo no identifica la localidad por código postal. Completá provincia y localidad.',
  unavailable: 'Destino sin cotización de ejemplo. Cambiá los datos o elegí otra forma de entrega.',
  error: 'No se pudo calcular el envío de ejemplo. Volvé a consultar.',
} satisfies Record<Exclude<Quote['status'], 'quoted'>, string>;

export const validPostal = (value: string) => /^(?:[0-9]{4}|[a-z][0-9]{4}[a-z]{3})$/i.test(value.trim());

export function quoteNational(
  destination: NationalDestination,
  units: number,
  scenario: QuoteScenario,
): Quote {
  if (!validPostal(destination.postal)) return { status: 'invalid-postal' };
  if (!destination.province || !destination.locality.trim()) return { status: 'needs-destination' };

  const zone = nationalZones.find(({ provinces }) => provinces.some((province) => province === destination.province));
  if (!zone || scenario === 'unavailable') return { status: 'unavailable' };
  if (scenario === 'error' || !Number.isSafeInteger(units) || units < 1) return { status: 'error' };

  const extraPackages = Math.ceil(units / unitsPerPackage) - 1;
  return { status: 'quoted', cost: zone.base + extraPackages * zone.extraPackage, days: zone.days };
}

export function exampleDays([min, max]: readonly [number, number]) {
  return `${min} a ${max} días hábiles`;
}
