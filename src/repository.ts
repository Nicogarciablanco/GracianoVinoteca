import { demoCatalog } from './catalog.ts';
import { branches, categories, maxQuantity } from './commerce.ts';
import type { Cart, Product } from './commerce.ts';

const catalogKey = 'graciano-react-catalog-v1';
const cartKey = 'graciano-react-cart-v1';
const imageName = /^[a-z0-9-]+\.(?:png|jpe?g|webp)$/i;
const photoData = /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/]+=*$/i;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validProduct(value: unknown): value is Product {
  if (!record(value) || !record(value.stock)) return false;
  const stock = value.stock;
  return typeof value.id === 'string' && /^[a-z0-9-]{1,70}$/.test(value.id)
    && ['name', 'brand', 'variety', 'size', 'origin', 'description'].every(
      (field) => typeof value[field] === 'string' && value[field].length <= 600,
    )
    && typeof value.name === 'string' && value.name.trim().length > 0
    && categories.some((category) => category === value.category)
    && typeof value.price === 'number' && Number.isSafeInteger(value.price)
    && value.price > 0 && value.price <= 100_000_000
    && Array.isArray(value.images) && value.images.length <= 5
    && value.images.every((name) => typeof name === 'string' && imageName.test(name))
    && (value.photo === undefined || (typeof value.photo === 'string'
      && value.photo.length <= 1_400_000 && photoData.test(value.photo)))
    && branches.every(({ id }) => {
      const quantity = stock[id];
      return typeof quantity === 'number' && Number.isInteger(quantity)
        && quantity >= 0 && quantity <= 9999;
    });
}

export const demoRepository = {
  loadCatalog(): Product[] {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(catalogKey) ?? 'null');
      if (Array.isArray(saved) && saved.length > 0 && saved.every(validProduct)
        && new Set(saved.map(({ id }) => id)).size === saved.length) return saved;
    } catch {
      // The sample catalog also works when storage is unavailable.
    }
    return demoCatalog;
  },
  saveCatalog(products: Product[]) {
    if (!products.every(validProduct)) throw new Error('Revisá los datos del producto.');
    localStorage.setItem(catalogKey, JSON.stringify(products));
  },
  restoreCatalog() {
    localStorage.removeItem(catalogKey);
    return demoCatalog;
  },
  loadCart(): Cart {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(cartKey) ?? '{}');
      if (record(saved)) {
        return Object.fromEntries(Object.entries(saved).filter((entry): entry is [string, number] => {
          const [id, quantity] = entry;
          return /^[a-z0-9-]{1,70}$/.test(id) && typeof quantity === 'number'
          && Number.isInteger(quantity) && quantity > 0 && quantity <= maxQuantity;
        }));
      }
    } catch {
      // Invalid or unavailable storage starts with an empty cart.
    }
    return {};
  },
  saveCart(cart: Cart) {
    localStorage.setItem(cartKey, JSON.stringify(cart));
  },
};
