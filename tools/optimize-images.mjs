// Convierte las fotos originales del cliente (carpeta raíz del proyecto) a WebP responsive
// para sitio/assets/img, extrae el logo sin fondo y genera favicons e imagen para redes.
import sharp from 'sharp';
import { mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const img = join(root, 'sitio/assets/img');
const icons = join(root, 'sitio/assets/icons');
mkdirSync(img, { recursive: true });
mkdirSync(icons, { recursive: true });

const PHOTOS = {
  '1tienda.jpeg': 'tias-fachada',
  '1out.png': 'tias-edificio',
  '1roll.png': 'tias-material-electrico',
  '1tube.png': 'tias-almacen-fontaneria',
  '2tienda.jpeg': 'playa-blanca-fachada',
  '2door.png': 'playa-blanca-barbacoas',
  '2int.png': 'playa-blanca-piscinas',
  '2rollos.png': 'playa-blanca-tuberia-pvc',
  'elocal.jpeg': 'exposicion-puertas-automatismos',
};
const WIDTHS = [640, 1024, 1600];
const PICON = { r: 20, g: 18, b: 16, alpha: 1 };

const report = [];
const kb = (p) => (statSync(p).size / 1024).toFixed(0) + ' KB';

const manifest = {};
for (const [src, slug] of Object.entries(PHOTOS)) {
  const { width } = await sharp(join(root, src)).metadata();
  const sizes = WIDTHS.filter((w) => w <= width);
  // Añade el ancho nativo solo si aporta algo (>15 % más que el mayor generado).
  if (width < 1600 && width > (sizes.at(-1) || 0) * 1.15) sizes.push(width);
  manifest[slug] = [];
  for (const w of sizes) {
    const name = `${slug}-${w}.webp`;
    const out = join(img, name);
    const res = await sharp(join(root, src)).rotate().flatten({ background: '#ffffff' })
      .resize({ width: w }).webp({ quality: 78, effort: 6 }).toFile(out);
    manifest[slug].push({ w: res.width, h: res.height, file: name });
    report.push([name, `${res.width}x${res.height}`, kb(out)]);
  }
}
writeFileSync(join(here, 'img-manifest.json'), JSON.stringify(manifest, null, 2));

// ---- Logo: fondo blanco -> transparente (relleno desde los bordes) ----
const { data, info } = await sharp(join(root, 'LOGO.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const isBgish = (i) => data[i] > 238 && data[i + 1] > 238 && data[i + 2] > 238;
const bg = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
while (stack.length) {
  const p = stack.pop();
  if (bg[p] || !isBgish(p * 4)) continue;
  bg[p] = 1;
  const x = p % W, y = (p / W) | 0;
  if (x > 0) stack.push(p - 1);
  if (x < W - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - W);
  if (y < H - 1) stack.push(p + W);
}
for (let p = 0; p < W * H; p++) {
  const i = p * 4;
  if (bg[p]) { data[i + 3] = 0; continue; }
  // Borde antialiasado junto al fondo: alfa según lo blanco que sea el píxel.
  const x = p % W, y = (p / W) | 0;
  const nearBg = (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
  if (nearBg) {
    const m = Math.min(data[i], data[i + 1], data[i + 2]);
    if (m > 200) data[i + 3] = Math.round(255 * (255 - m) / 55);
  }
}
const logo = sharp(data, { raw: { width: W, height: H, channels: 4 } }).trim();
const logoPng = await logo.png().toBuffer();
for (const w of [320, 640]) {
  const out = join(img, `logo-jlc-${w}.webp`);
  await sharp(logoPng).resize({ width: w, withoutEnlargement: false }).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(out);
  report.push([`logo-jlc-${w}.webp`, kb(out)]);
}
const logoMeta = await sharp(logoPng).metadata();
report.push(['logo (recortado)', `${logoMeta.width}x${logoMeta.height}`]);

// ---- Favicons (PNG, requerido por los navegadores) ----
async function icon(size, pad, background) {
  const inner = Math.round(size * (1 - pad * 2));
  const mark = await sharp(logoPng).resize({ width: inner, height: inner, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: mark, gravity: 'center' }]).png({ compressionLevel: 9 });
}
const clear = { r: 0, g: 0, b: 0, alpha: 0 };
await (await icon(32, 0.02, clear)).toFile(join(icons, 'favicon-32.png'));
await (await icon(180, 0.12, PICON)).toFile(join(icons, 'apple-touch-icon.png'));
await (await icon(192, 0.12, PICON)).toFile(join(icons, 'icon-192.png'));
await (await icon(512, 0.12, PICON)).toFile(join(icons, 'icon-512.png'));
report.push(['favicons', 'ok']);

// ---- Imagen para redes (Open Graph 1200x630) ----
const ogW = 1200, ogH = 630;
const shade = Buffer.from(`<svg width="${ogW}" height="${ogH}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#141210" stop-opacity=".05"/><stop offset=".55" stop-color="#141210" stop-opacity=".35"/>
    <stop offset="1" stop-color="#141210" stop-opacity=".92"/></linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/></svg>`);
// La fachada ya muestra el rótulo y el logo: no se superpone nada más.
const ogOut = join(root, 'sitio/og-image.jpg');
await sharp(join(root, '1tienda.jpeg')).resize(ogW, ogH, { fit: 'cover', position: 'top' })
  .composite([{ input: shade }])
  .jpeg({ quality: 82, mozjpeg: true }).toFile(ogOut);
report.push(['og-image.jpg', kb(ogOut)]);

console.table(report);
