// Prepara los logotipos de los proveedores para la web.
// Entrada: tools/logos-src (el archivo tal cual lo publica cada marca).
// Salida: assets/logos/<marca>.webp, recortado, a la misma altura y con fondo transparente,
// listo para las placas blancas de la sección «Nuestros proveedores».
import sharp from 'sharp';
import { mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'logos-src');
const out = join(here, '../assets/logos');
mkdirSync(out, { recursive: true });

const H = 220;          // altura de render (la placa lo muestra a 110 px: pantallas 2x)
const W = 560;          // ancho máximo para los logotipos muy apaisados

// Ajustes por marca. `white` recolorea al color de marca un logotipo que la empresa solo
// publica en blanco (su web tiene la cabecera oscura); las placas de la web son blancas.
const TWEAKS = {
  crearplast: { white: '#1d2430' },
  wilo: { white: '#009c82' },
};

async function paint(file, color) {
  // Mancha sólida recortada con el alfa del original: el mismo dibujo, en otro color.
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  for (let i = 0; i < data.length; i += info.channels) {
    data[i] = rgb[0]; data[i + 1] = rgb[1]; data[i + 2] = rgb[2];
  }
  return sharp(data, { raw: info });
}

const report = [];
for (const name of readdirSync(src).sort()) {
  const slug = name.replace(extname(name), '');
  const file = join(src, name);
  const tweak = TWEAKS[slug] || {};

  let img;
  if (tweak.white) img = await paint(file, tweak.white);
  else img = sharp(file, { density: 400 });

  const dest = join(out, slug + '.webp');
  await img
    .trim({ threshold: 6 })
    .resize({ height: H, width: W, fit: 'inside', withoutEnlargement: false, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ nearLossless: true, quality: 72, effort: 6 })
    .toFile(dest);

  const meta = await sharp(dest).metadata();
  report.push([slug, `${meta.width}x${meta.height}`, (statSync(dest).size / 1024).toFixed(1) + ' KB']);
}

writeFileSync(join(out, 'README.txt'), 'Logotipos de cada fabricante, tomados de su propia web.\nSe generan con: node tools/logos.mjs\n');
for (const r of report) console.log(r[0].padEnd(14), r[1].padEnd(11), r[2]);
