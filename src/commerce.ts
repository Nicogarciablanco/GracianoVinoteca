import { exampleDays, localQuote, quoteNational } from './shipping.ts';
import type { NationalDestination, Quote, QuoteScenario } from './shipping.ts';

export const branches = [
  { id: 'ituzaingo', name: 'Ituzaingó 1167', area: 'Nueva Córdoba' },
  { id: 'trejo', name: 'Obispo Trejo 1119', area: 'Nueva Córdoba' },
  { id: 'rio-negro', name: 'Río Negro 4370 · Local 6', area: 'Córdoba Capital' },
] as const;

export type Branch = (typeof branches)[number];
export type BranchId = Branch['id'];
export const categories = ['Tintos', 'Blancos', 'Espumantes', 'Destilados', 'Regalos'] as const;
export type Category = (typeof categories)[number];
export type Product = {
  id: string;
  name: string;
  brand: string;
  category: Category;
  variety: string;
  size: string;
  origin: string;
  description: string;
  price: number;
  images: string[];
  photo?: string;
  stock: Record<BranchId, number>;
};
export type Cart = Record<string, number>;
export type Delivery = { mode: 'pickup'; branch: BranchId }
  | { mode: 'shipping' }
  | { mode: 'national'; destination: NationalDestination; requested: boolean; scenario: QuoteScenario };
export type Payment = 'mercado-pago' | 'transfer' | 'cash';
export const maxQuantity = 24;
export const shippingFee = localQuote.cost;

export const money = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
}).format;

export function productImage(product: Product, index = 0) {
  return (index === 0 && product.photo) || '/assets/' + (product.images[index] ?? 'graciano-logo.png');
}

export function assessCart(catalog: readonly Product[], cart: Cart, delivery: Delivery) {
  const lines = Object.entries(cart).map(([id, quantity]) => {
    const product = catalog.find((item) => item.id === id);
    const availableAt = branches.filter((branch) => (product?.stock[branch.id] ?? 0) >= quantity);
    return { id, quantity, product, availableAt, amount: (product?.price ?? 0) * quantity };
  });
  const eligibleBranches = branches.filter((branch) =>
    lines.length > 0 && lines.every((line) => line.availableAt.some((location) => location.id === branch.id)),
  );
  const source = delivery.mode === 'pickup'
    ? branches.find((branch) => branch.id === delivery.branch)
    : eligibleBranches[0];
  const subtotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const quote: Quote | null = delivery.mode === 'pickup' ? null
    : delivery.mode === 'shipping' ? (lines.length ? localQuote : null)
      : delivery.requested ? quoteNational(delivery.destination, lines.reduce((sum, line) => sum + line.quantity, 0), delivery.scenario)
        : { status: 'idle' };
  const shipping = quote === null ? 0 : quote.status === 'quoted' ? quote.cost : null;
  return {
    lines,
    eligibleBranches,
    source,
    subtotal,
    quote,
    shipping,
    total: shipping === null ? null : subtotal + shipping,
    canConfirm: shipping !== null && Boolean(source && eligibleBranches.some((branch) => branch.id === source.id)),
  };
}


export function transferMessage(
  assessment: ReturnType<typeof assessCart>,
  destination: string,
  dedication: string,
) {
  const { canConfirm, lines, subtotal, shipping, total, quote } = assessment;
  if (!canConfirm || total === null || shipping === null) return null;

  return [
    'Hola Graciano, este es mi pedido de ejemplo para pagar por transferencia:',
    ...lines.map(({ product, quantity, amount }) => `${quantity} × ${product?.name} · ${money(amount)}`),
    '',
    `Destino: ${destination}`,
    `Subtotal: ${money(subtotal)}`,
    `Costo de envío de ejemplo: ${shipping === 0 ? 'Sin costo (retiro)' : money(shipping)}`,
    ...(quote?.status === 'quoted' ? [`Plazo estimado de ejemplo: ${exampleDays(quote.days)}`] : []),
    `Total estimado de ejemplo: ${money(total)}`,
    ...(dedication.trim() ? [`Dedicatoria: ${dedication.trim()}`] : []),
    '',
    'El local confirma la disponibilidad, la entrega y la acreditación del pago.',
  ].join('\n');
}
