// Cambia el dominio de la web en todos los archivos que lo usan (canonical, Open Graph,
// JSON-LD, sitemap y robots). Uso: node tools/set-domain.mjs https://www.tudominio.es
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function normalizeOrigin(url) {
  let u;
  try { u = new URL(url); } catch { throw new Error(`No es una URL válida: ${url}`); }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error(`Debe empezar por http:// o https://: ${url}`);
  return u.origin;
}

export function replaceDomain(text, from, to) {
  return text.split(normalizeOrigin(from)).join(normalizeOrigin(to));
}

const here = dirname(fileURLToPath(import.meta.url));
const FILES = ['index.html', 'sitemap.xml', 'robots.txt'];

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const configPath = join(here, 'domain.json');
  const config = JSON.parse(readFileSync(configPath, 'utf8'));
  const to = normalizeOrigin(process.argv[2] || '');
  for (const f of FILES) {
    const p = join(here, '..', f);
    writeFileSync(p, replaceDomain(readFileSync(p, 'utf8'), config.domain, to));
    console.log('actualizado', f);
  }
  writeFileSync(configPath, JSON.stringify({ domain: to }, null, 2) + '\n');
  console.log(`Dominio cambiado: ${config.domain} -> ${to}`);
}
