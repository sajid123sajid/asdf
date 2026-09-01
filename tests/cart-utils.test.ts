import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeCartLines } from '../src/lib/cart-utils.ts';

test('normalizeCartLines removes invalid and stale entries', () => {
  const cart = [
    { slug: 'valid-item', qty: 2 },
    { slug: '', qty: 1 },
    { slug: 'valid-item', qty: 0 },
    { slug: 'stale-item', qty: 1 },
    { slug: 'another-valid', qty: 3 },
    { qty: 2 },
  ];

  const result = normalizeCartLines(cart, new Set(['valid-item', 'another-valid']));

  assert.deepEqual(result, [
    { slug: 'valid-item', qty: 2 },
    { slug: 'another-valid', qty: 3 },
  ]);
});
