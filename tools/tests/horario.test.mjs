import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

// El módulo de la web es un script clásico (sin export) que también se puede cargar con require.
const require = createRequire(import.meta.url);
const { getStatus, statusLabel, formatTime } = require('../../sitio/js/horario.js');

test('formatTime escribe horas sin cero inicial', () => {
  assert.equal(formatTime(450), '7:30');
  assert.equal(formatTime(480), '8:00');
  assert.equal(formatTime(1020), '17:00');
});

test('lunes 10:00 en verano (UTC+1): abierto hasta las 17:00', () => {
  const s = getStatus(new Date('2026-09-21T09:00:00Z'));
  assert.equal(s.open, true);
  assert.equal(s.closesAt, 1020);
  assert.equal(statusLabel(s), 'Abierto ahora, cierra a las 17:00');
});

test('lunes 7:00: cerrado, abre hoy', () => {
  assert.equal(statusLabel(getStatus(new Date('2026-09-21T06:00:00Z'))), 'Cerrado, abrimos hoy a las 7:30');
});

test('lunes 17:00 exacto: ya cerrado, abre mañana', () => {
  const s = getStatus(new Date('2026-09-21T16:00:00Z'));
  assert.equal(s.open, false);
  assert.equal(statusLabel(s), 'Cerrado, abrimos mañana a las 7:30');
});

test('sábado 12:00: abierto hasta las 13:00', () => {
  assert.equal(statusLabel(getStatus(new Date('2026-09-26T11:00:00Z'))), 'Abierto ahora, cierra a las 13:00');
});

test('sábado 14:00: cerrado, abre el lunes', () => {
  assert.equal(statusLabel(getStatus(new Date('2026-09-26T13:00:00Z'))), 'Cerrado, abrimos el lunes a las 7:30');
});

test('domingo: cerrado, abre mañana', () => {
  assert.equal(statusLabel(getStatus(new Date('2026-09-27T10:00:00Z'))), 'Cerrado, abrimos mañana a las 7:30');
});

test('invierno (UTC+0): lunes 7:30 ya está abierto', () => {
  assert.equal(getStatus(new Date('2026-12-14T07:30:00Z')).open, true);
});

test('viernes 18:00: cerrado, abre mañana sábado a las 8:00', () => {
  assert.equal(statusLabel(getStatus(new Date('2026-09-25T17:00:00Z'))), 'Cerrado, abrimos mañana a las 8:00');
});
