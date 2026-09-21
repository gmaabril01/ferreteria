import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const site = new URL('../../', import.meta.url);
const html = readFileSync(new URL('index.html', site), 'utf8');
const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
const graph = ldMatch ? JSON.parse(ldMatch[1])['@graph'] : [];

test('un solo h1 y contiene el nombre de la empresa', () => {
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  assert.match(html, /<h1[^>]*>[\s\S]*Suministros José Luis Cabrera S\.L\.[\s\S]*<\/h1>/);
});

test('title y meta description con longitud adecuada', () => {
  const title = html.match(/<title>([^<]+)<\/title>/)[1];
  assert.ok(title.length >= 40 && title.length <= 65, `title: ${title.length}`);
  assert.match(title, /Ferretería/);
  const desc = html.match(/<meta name="description" content="([^"]+)"/)[1];
  assert.ok(desc.length >= 120 && desc.length <= 160, `description: ${desc.length}`);
});

test('canonical, Open Graph e idioma', () => {
  assert.match(html, /<html lang="es"/);
  assert.match(html, /<link rel="canonical" href="https:\/\/[^"]+\/">/);
  for (const p of ['og:title', 'og:description', 'og:image', 'og:url', 'og:locale']) assert.match(html, new RegExp(`property="${p}"`));
});

test('todas las imágenes tienen alt, tamaño y existen', () => {
  const imgs = html.match(/<img\b[^>]*>/g);
  assert.ok(imgs.length >= 10);
  for (const tag of imgs) {
    assert.match(tag, /\balt="[^"]+"/, tag);
    assert.match(tag, /\bwidth="\d+"/, tag);
    assert.match(tag, /\bheight="\d+"/, tag);
    const src = tag.match(/\bsrc="([^"]+)"/)[1];
    assert.ok(existsSync(new URL(src, site)), `falta ${src}`);
  }
});

test('solo imágenes WebP en el contenido', () => {
  const srcs = [...html.matchAll(/\b(?:src|srcset)="([^"]+)"/g)].map((m) => m[1]).join(' ');
  assert.doesNotMatch(srcs, /\.(jpe?g|png)\b/);
});

test('JSON-LD: organización y tres locales sin reseñas autopublicadas', () => {
  const org = graph.find((n) => n['@type'] === 'Organization');
  assert.equal(org.legalName, 'Suministros José Luis Cabrera S.L.');
  assert.ok(org.sameAs.includes('https://www.instagram.com/suministrosjlc/'));
  assert.ok(org.sameAs.includes('https://www.facebook.com/profile.php?id=100063592417095&locale=es_ES'));
  const stores = graph.filter((n) => ['HardwareStore', 'HomeAndConstructionBusiness'].includes(n['@type']));
  assert.equal(stores.length, 3);
  assert.deepEqual(stores.map((s) => s.address.postalCode).sort(), ['35570', '35572', '35572']);
  for (const s of stores) assert.equal(s.openingHoursSpecification.length, 2);
  assert.ok(!JSON.stringify(graph).includes('"Review"'));
  assert.ok(!JSON.stringify(graph).includes('aggregateRating'));
});

test('texto de Sobre nosotros literal', () => {
  const text = 'Suministros José Luis Cabrera, es una empresa familiar Canaria, la cual nace en la década de los 90, después de una larga trayectoria de su socio fundador. Nace con el firme propósito de dar soluciones a sus clientes, con la máxima garantía de calidad y compromiso, especialistas en puertas de garaje y automatismos, piscinas, fontanería, tuberías de PVC, ferretería, fundición y construcción. Actualmente con 2 puntos de venta y una exposición, en la isla.';
  assert.ok(html.includes(text));
});

test('reseñas literales', () => {
  for (const r of [
    'Sitio genial para comprar lo necesario para tus reformas y arreglos en casa. Calidad a buen precio',
    'Mucha variedad, buena atención y calidad/precio',
    'Siempre compramos allí los artículos de fontanería, ferretería, piscinas etc.',
    'Si te falta cualquier cosa.. allí lo encuentras y si nooo... te lo consiguen',
  ]) assert.ok(html.includes(r), r);
});

test('17 proveedores enlazados en pestaña nueva con noopener', () => {
  const block = html.match(/<ul class="suppliers-list"[\s\S]*?<\/ul>/)[0];
  const links = block.match(/<a\b[^>]*>/g);
  assert.equal(links.length, 17);
  for (const a of links) {
    assert.match(a, /target="_blank"/);
    assert.match(a, /rel="noopener"/);
  }
});

test('contacto, horario y Google Maps', () => {
  for (const s of ['tel:+34928524060', 'tel:+34928349021', 'mailto:info@suministrosjoseluiscabrera.es', 'https://www.instagram.com/suministrosjlc/']) {
    assert.ok(html.includes(s), s);
  }
  assert.equal((html.match(/https:\/\/www\.google\.com\/maps\/search\/\?api=1&amp;query=/g) || []).length >= 3, true);
  for (const s of ['7:30 a 17:00', '8:00 a 13:00', 'Cerrado']) assert.ok(html.includes(s), s);
});

test('scripts clásicos con defer y versión, sin módulos', () => {
  assert.doesNotMatch(html, /type="module"/);
  for (const tag of html.match(/<script\b[^>]*\bsrc="[^"]+"[^>]*>/g)) {
    assert.match(tag, /\bdefer\b/, tag);
    assert.match(tag, /\?v=\d{8}/, tag);
  }
  assert.match(html, /href="styles\.css\?v=\d{8}"/);
});

test('sin guiones largos en el texto de la web', () => {
  assert.doesNotMatch(html, /—/);
});
