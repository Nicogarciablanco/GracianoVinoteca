import assert from 'node:assert/strict';
import test from 'node:test';
import { assessCart, shippingFee } from '../src/commerce.ts';
import { demoCatalog } from '../src/catalog.ts';

test('keeps the missing line visible and suggests branches that can fulfill the quantity', () => {
  const cart = { catena: 5 };
  const initial = assessCart(demoCatalog, cart, { mode: 'pickup', branch: 'ituzaingo' });
  assert.equal(initial.canConfirm, false);
  assert.equal(initial.lines[0].quantity, 5);
  assert.deepEqual(initial.lines[0].availableAt.map(({ id }) => id), ['trejo']);
  assert.equal(assessCart(demoCatalog, cart, { mode: 'pickup', branch: 'trejo' }).canConfirm, true);
  assert.equal(assessCart(demoCatalog, { catena: 4 }, { mode: 'pickup', branch: 'rio-negro' }).canConfirm, true);
});

test('selects the first branch that can fulfill a shipment and includes delivery once', () => {
  const result = assessCart(demoCatalog, { catena: 2, rutini: 1 }, { mode: 'shipping' });
  assert.equal(result.source?.id, 'trejo');
  assert.equal(result.subtotal, 66_900);
  assert.equal(result.total, 66_900 + shippingFee);
  assert.equal(result.canConfirm, true);
});

test('does not combine stock from different branches to fulfill an order', () => {
  const result = assessCart(demoCatalog, { catena: 5, trumpeter: 5 }, { mode: 'shipping' });
  assert.ok(result.lines.every(({ availableAt }) => availableAt.length === 1));
  assert.equal(result.source, undefined);
  assert.equal(result.canConfirm, false);
});

test('does not confirm an empty cart or silently discard a removed product', () => {
  const delivery = { mode: 'pickup', branch: 'ituzaingo' };
  assert.equal(assessCart(demoCatalog, {}, delivery).canConfirm, false);
  const stale = assessCart(demoCatalog, { 'example-removed': 2 }, delivery);
  assert.equal(stale.canConfirm, false);
  assert.equal(stale.lines[0].id, 'example-removed');
});
