import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOrigin, replaceDomain } from '../set-domain.mjs';

test('normaliza quitando la barra final', () => {
  assert.equal(normalizeOrigin('https://www.a.es/'), 'https://www.a.es');
  assert.equal(normalizeOrigin('http://a.es'), 'http://a.es');
});

test('rechaza lo que no es una URL http(s)', () => {
  assert.throws(() => normalizeOrigin('ftp://a.es'));
  assert.throws(() => normalizeOrigin('hola'));
});

test('reemplaza todas las apariciones del dominio', () => {
  const t = '<link href="https://www.x.es/"><loc>https://www.x.es/</loc>';
  assert.equal(replaceDomain(t, 'https://www.x.es', 'https://y.com'), '<link href="https://y.com/"><loc>https://y.com/</loc>');
});

test('no toca el email que comparte nombre de dominio', () => {
  const t = 'mailto:info@x.es https://www.x.es/';
  assert.equal(replaceDomain(t, 'https://www.x.es', 'https://y.com'), 'mailto:info@x.es https://y.com/');
});
