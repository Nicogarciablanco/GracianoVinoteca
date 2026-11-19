import assert from 'node:assert/strict';
import test from 'node:test';
import { demoCatalog } from '../src/catalog.ts';
import { assessCart, money, transferMessage } from '../src/commerce.ts';
import { provinces, quoteNational } from '../src/shipping.ts';

const destination = {
  postal: '0000',
  province: 'CABA',
  locality: 'Localidad de prueba',
  street: 'Calle de ejemplo',
  number: '123',
  unit: '2 B',
};

const national = (changes = {}) => ({
  mode: 'national', destination, requested: true, scenario: 'standard', ...changes,
});

test('accepts both postal formats and requests an explicit destination for either', () => {
  for (const postal of ['0000', 'X0000ABC']) {
    assert.deepEqual(quoteNational({ ...destination, postal, province: '', locality: '' }, 1, 'standard'),
      { status: 'needs-destination' });
    assert.equal(quoteNational({ ...destination, postal }, 1, 'standard').status, 'quoted');
  }
  assert.equal(quoteNational({ ...destination, postal: '1A' }, 1, 'standard').status, 'invalid-postal');
});

test('the fictional base table includes all 24 jurisdictions', () => {
  assert.equal(provinces.length, 24);
  assert.equal(new Set(provinces).size, 24);
  assert.ok(provinces.includes('CABA'));
  for (const province of provinces) {
    assert.equal(quoteNational({ ...destination, province }, 1, 'standard').status, 'quoted');
  }
});

test('updates shipping and total when the jurisdiction or package count changes', () => {
  const initial = assessCart(demoCatalog, { catena: 6 }, national());
  const more = assessCart(demoCatalog, { catena: 7 }, national());
  assert.equal(initial.shipping, 8400);
  assert.equal(more.shipping, 10_700);
  assert.equal(more.total, more.subtotal + more.shipping);
  const south = assessCart(demoCatalog, { catena: 7 },
    national({ destination: { ...destination, province: 'Santa Cruz' } }));
  assert.equal(south.shipping, 14_500);
  assert.deepEqual(south.quote.days, [5, 9]);
  assert.notEqual(more.total, south.total);
});

test('prevents confirmation on missing, unavailable, or failed quotes', () => {
  const attempts = [
    [national({ requested: false }), 'idle'],
    [national({ destination: { ...destination, postal: '' } }), 'invalid-postal'],
    [national({ destination: { ...destination, locality: '' } }), 'needs-destination'],
    [national({ scenario: 'unavailable' }), 'unavailable'],
    [national({ scenario: 'error' }), 'error'],
  ];
  for (const [delivery, status] of attempts) {
    const result = assessCart(demoCatalog, { catena: 1 }, delivery);
    assert.equal(result.quote.status, status);
    assert.equal(result.total, null);
    assert.equal(result.canConfirm, false);
    assert.equal(transferMessage(result, 'Destino de ejemplo', ''), null);
  }
});

test('uses the cart amounts and complete destination in the transfer preview', () => {
  const result = assessCart(demoCatalog, { catena: 2, rutini: 1 }, national());
  const address = 'Calle de ejemplo 123, piso/depto. 2 B, Localidad de prueba, CABA, CP 0000';
  const message = transferMessage(result, address, 'Feliz cumpleaños');
  assert.ok(message.includes('2 × Catena Malbec'));
  assert.ok(message.includes('1 × Rutini Malbec'));
  assert.ok(message.includes(address));
  assert.ok(message.includes(`Subtotal: ${money(result.subtotal)}`));
  assert.ok(message.includes(`Costo de envío de ejemplo: ${money(result.shipping)}`));
  assert.ok(message.includes('Plazo estimado de ejemplo: 3 a 6 días hábiles'));
  assert.ok(message.includes(`Total estimado de ejemplo: ${money(result.total)}`));
  assert.ok(message.includes('El local confirma'));
});
