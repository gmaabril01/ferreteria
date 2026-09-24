# Web Suministros José Luis Cabrera — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Web estática de una página, premium y muy visual (3D real), con SEO local, para Suministros José Luis Cabrera S.L.

**Architecture:** `sitio/` contiene HTML semántico con todo el contenido (SEO sin JS), un CSS con tokens y módulos ES
que añaden la capa animada (Lenis + GSAP ScrollTrigger) y 3D (Three.js procedural, máx. 3 contextos WebGL).
`tools/` contiene los scripts Node (vendorizado, imágenes, dominio, servidor local) y los tests `node --test`.

**Tech Stack:** HTML5, CSS moderno, JS ES modules + import map, three (npm), gsap + ScrollTrigger, lenis,
@fontsource-variable (archivo, instrument-sans, jetbrains-mono), sharp, Node 24 (`node --test`).

**Spec:** `docs/superpowers/specs/2026-09-21-web-suministros-design.md`

## Global Constraints

- Nombre: `Suministros José Luis Cabrera S.L.` · Eslogan: `Todo lo que tu obra necesita.`
- Dominio provisional: `https://www.suministrosjoseluiscabrera.es` (solo en `tools/domain.json` + archivos que reescribe `set-domain`).
- Teléfonos: `928 52 40 60` → `tel:+34928524060`; `928 34 90 21` → `tel:+34928349021`. Email: `info@suministrosjoseluiscabrera.es`.
- Facebook: `https://www.facebook.com/profile.php?id=100063592417095&locale=es_ES` · Instagram: `https://www.instagram.com/suministrosjlc/`
- Horario: L–V 7:30–17:00 · S 8:00–13:00 · D cerrado · zona `Atlantic/Canary`.
- Textos del cliente literales («Sobre nosotros», 3 reseñas). Sin estrellas/autores inventados. Sin schema `Review`.
- Colores: `--bg #0f0e0d`, `--bg-2 #161514`, `--surface #1c1a19`, `--text #ece8e1`, `--text-dim #a8a29a`,
  `--red #b8352c`, `--red-ink #d9675b`, `--steel #8d8f93`. Contraste de texto ≥ 4,5:1.
- Sin recursos de terceros en tiempo de ejecución (sin CDN, sin Google Fonts). Enlaces externos con `rel="noopener"`.
- Máximo 3 contextos WebGL; pausa fuera de pantalla; `prefers-reduced-motion` respetado; sin JS el contenido es completo.

## File Map

| Archivo | Responsabilidad |
|---|---|
| `tools/package.json` | dependencias de desarrollo y scripts (`test`, `vendor`, `images`, `serve`, `domain`) |
| `tools/vendor.mjs` | copia three/addons, gsap, lenis y woff2 a `sitio/vendor` y `sitio/fonts` |
| `tools/optimize-images.mjs` | fotos → WebP 640/1024/1600 con nombres descriptivos; logo transparente; favicons; og-image |
| `tools/serve.mjs` | servidor estático sin dependencias para previsualizar `sitio/` |
| `tools/set-domain.mjs` + `tools/domain.json` | reemplazo del dominio en `index.html`, `sitemap.xml`, `robots.txt` |
| `tools/tests/*.test.mjs` | tests de horario, dominio y SEO del HTML |
| `sitio/index.html` | contenido completo, meta, JSON-LD, import map |
| `sitio/css/styles.css` | tokens, tipografía, layout, componentes y visuales CSS |
| `sitio/js/main.js` | arranque y UI general |
| `sitio/js/ui/horario.js` | lógica pura de horario + render |
| `sitio/js/ui/productos.js` | scroll horizontal y visuales de paneles |
| `sitio/js/ui/marquee.js` | proveedores |
| `sitio/js/three/stage.js` | renderer por elemento, entorno PBR, visibilidad, resize |
| `sitio/js/three/hardware.js` | geometrías/materiales procedurales |
| `sitio/js/three/intro.js` | caja de herramientas + inicio |
| `sitio/js/three/mini.js` | engranajes y llave |

---

### Task 1: Tooling, librerías y assets optimizados

**Files:** Create `tools/package.json`, `tools/vendor.mjs`, `tools/optimize-images.mjs`, `tools/serve.mjs`, `.claude/launch.json`

**Interfaces:**
- Produces: `sitio/vendor/three/three.module.min.js`, `sitio/vendor/three/addons/{geometries/RoundedBoxGeometry.js,environments/RoomEnvironment.js,utils/BufferGeometryUtils.js}`,
  `sitio/vendor/gsap/{gsap.min.js,ScrollTrigger.min.js}`, `sitio/vendor/lenis/lenis.min.js`, `sitio/fonts/*.woff2`,
  `sitio/img/<slug>-{640,1024,1600}.webp`, `sitio/img/logo.png` (transparente), `sitio/icons/*`, `sitio/og-image.jpg`.
- Slugs: `1tienda→tias-fachada`, `1out→tias-edificio`, `1roll→tias-material-electrico`, `1tube→tias-almacen-fontaneria`,
  `2tienda→playa-blanca-fachada`, `2door→playa-blanca-barbacoas`, `2int→playa-blanca-piscinas`, `2rollos→playa-blanca-tuberia-pvc`,
  `elocal→exposicion-puertas-automatismos`.

- [ ] Step 1: `tools/package.json` (`"type":"module"`, devDeps `sharp`, `three`, `gsap`, `lenis`, `@fontsource-variable/archivo`, `@fontsource-variable/instrument-sans`, `@fontsource-variable/jetbrains-mono`); `npm install` en `tools/`.
- [ ] Step 2: `vendor.mjs` copia los archivos listados; `node vendor.mjs` y comprobar que existen.
- [ ] Step 3: `optimize-images.mjs`: WebP q≈78 en 3 anchos sin ampliar; logo: píxeles casi blancos conectados al borde → alfa 0 (flood fill), recorte y 512 px; favicons 32/180/192/512; og-image 1200×630 de `1tienda` con viñeta oscura. Ejecutar y listar tamaños.
- [ ] Step 4: `serve.mjs` (http nativo, tipos MIME, `sitio/` como raíz, puerto 5173) + `.claude/launch.json`.
- [ ] Step 5: Commit `chore: tooling, librerías y assets`.

### Task 2: Lógica de horario (TDD)

**Files:** Create `sitio/js/ui/horario.js`, Test `tools/tests/horario.test.mjs`

**Interfaces:**
- Produces: `HORARIO: Array<{open:number,close:number}|null>` (índice = `Date.getDay()`, minutos desde 00:00);
  `canaryNow(date): {day:number, minutes:number}`; `getStatus(date): {open:boolean, day:number, minutes:number, closesAt:number|null, next:{day:number, minutes:number, inDays:number}|null}`;
  `formatTime(min): string` (`450→"7:30"`, `1020→"17:00"`); `statusLabel(status): string`; `renderHorario(root: Element): void`.

- [ ] Step 1: Tests:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getStatus, statusLabel, formatTime } from '../../sitio/js/ui/horario.js';

test('formatTime', () => { assert.equal(formatTime(450), '7:30'); assert.equal(formatTime(1020), '17:00'); assert.equal(formatTime(480), '8:00'); });
test('lunes 10:00 (verano, UTC+1) abierto', () => {
  const s = getStatus(new Date('2026-09-21T09:00:00Z'));
  assert.equal(s.open, true); assert.equal(s.closesAt, 1020);
  assert.equal(statusLabel(s), 'Abierto ahora · cierra a las 17:00');
});
test('lunes 7:00 cerrado, abre hoy', () => {
  assert.equal(statusLabel(getStatus(new Date('2026-09-21T06:00:00Z'))), 'Cerrado · abrimos hoy a las 7:30');
});
test('lunes 17:00 exacto cerrado, abre mañana', () => {
  const s = getStatus(new Date('2026-09-21T16:00:00Z'));
  assert.equal(s.open, false); assert.equal(statusLabel(s), 'Cerrado · abrimos mañana a las 7:30');
});
test('sábado 12:00 abierto hasta 13:00', () => {
  assert.equal(statusLabel(getStatus(new Date('2026-09-26T11:00:00Z'))), 'Abierto ahora · cierra a las 13:00');
});
test('sábado 14:00 cerrado, abre el lunes', () => {
  assert.equal(statusLabel(getStatus(new Date('2026-09-26T13:00:00Z'))), 'Cerrado · abrimos el lunes a las 7:30');
});
test('domingo cerrado, abre mañana', () => {
  assert.equal(statusLabel(getStatus(new Date('2026-09-27T10:00:00Z'))), 'Cerrado · abrimos mañana a las 7:30');
});
test('invierno UTC+0: lunes 7:30 abierto', () => {
  assert.equal(getStatus(new Date('2026-12-14T07:30:00Z')).open, true);
});
```

- [ ] Step 2: `node --test tools/tests/` → FAIL (módulo inexistente).
- [ ] Step 3: Implementar con `Intl.DateTimeFormat('en-GB',{timeZone:'Atlantic/Canary',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})`; `next` busca el siguiente día con horario (0–7 días); etiqueta usa `hoy`/`mañana`/`el <día>`. `renderHorario` es la única función que toca el DOM (no se ejecuta en tests).
- [ ] Step 4: Tests → PASS. Step 5: Commit `feat: lógica de horario`.

### Task 3: Script de dominio (TDD)

**Files:** Create `tools/set-domain.mjs`, `tools/domain.json`, Test `tools/tests/set-domain.test.mjs`

**Interfaces:** Produces `normalizeOrigin(url): string` (lanza `Error` si no es http/https; quita `/` final) y
`replaceDomain(text, from, to): string`. CLI: `node tools/set-domain.mjs https://www.ejemplo.es`.

- [ ] Step 1: Tests:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeOrigin, replaceDomain } from '../set-domain.mjs';

test('normaliza', () => { assert.equal(normalizeOrigin('https://www.a.es/'), 'https://www.a.es'); });
test('rechaza no-http', () => { assert.throws(() => normalizeOrigin('ftp://a.es')); assert.throws(() => normalizeOrigin('hola')); });
test('reemplaza todas', () => {
  const t = '<link href="https://www.x.es/"><loc>https://www.x.es/</loc>';
  assert.equal(replaceDomain(t, 'https://www.x.es', 'https://y.com'), '<link href="https://y.com/"><loc>https://y.com/</loc>');
});
```

- [ ] Step 2: FAIL. Step 3: implementar (split/join; CLI solo si `import.meta.url` es el script ejecutado; actualiza `domain.json`). Step 4: PASS. Step 5: Commit.

### Task 4: HTML completo + SEO (TDD sobre el HTML)

**Files:** Create `sitio/index.html`, `sitio/robots.txt`, `sitio/sitemap.xml`, `sitio/site.webmanifest`, `sitio/.htaccess`, Test `tools/tests/seo.test.mjs`

**Interfaces:** Produces IDs de sección `#intro #inicio #productos #tiendas #horario #contacto #nosotros #resenas #proveedores`;
ganchos `data-*` para JS: `[data-intro-stage]`, `[data-hero-canvas]`, `[data-h-track]`, `[data-panel="<clave>"]`,
`[data-horario]`, `[data-map-pin]`, `[data-gallery]`, `[data-marquee]`, `[data-tilt]`, `[data-magnetic]`, `[data-stage="gears|wrench"]`, `[data-reveal]`.

- [ ] Step 1: Tests (lectura del archivo + regex/JSON):

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../../sitio/index.html', import.meta.url), 'utf8');
const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
const graph = ld['@graph'];

test('un solo h1 con el nombre', () => {
  const h1 = html.match(/<h1[\s>]/g) || []; assert.equal(h1.length, 1);
  assert.match(html, /<h1[^>]*>[\s\S]*Suministros José Luis Cabrera S\.L\.[\s\S]*<\/h1>/);
});
test('title y description', () => {
  const title = html.match(/<title>([^<]+)<\/title>/)[1]; assert.ok(title.length <= 70, title.length);
  const desc = html.match(/<meta name="description" content="([^"]+)"/)[1]; assert.ok(desc.length >= 120 && desc.length <= 160, desc.length);
});
test('todas las img tienen alt no vacío', () => {
  for (const tag of html.match(/<img\b[^>]*>/g)) assert.match(tag, /alt="[^"]+"/, tag);
});
test('JSON-LD: organización y 3 locales', () => {
  const org = graph.find(n => n['@type'] === 'Organization');
  assert.equal(org.legalName, 'Suministros José Luis Cabrera S.L.');
  assert.ok(org.sameAs.includes('https://www.instagram.com/suministrosjlc/'));
  const stores = graph.filter(n => ['HardwareStore', 'HomeAndConstructionBusiness'].includes(n['@type']));
  assert.equal(stores.length, 3);
  assert.deepEqual(stores.map(s => s.address.postalCode).sort(), ['35570', '35572', '35572']);
  for (const s of stores) assert.ok(s.openingHoursSpecification.length === 2);
  assert.ok(!graph.some(n => n['@type'] === 'Review'));
});
test('texto literal de Sobre nosotros', () => {
  assert.ok(html.includes('Suministros José Luis Cabrera, es una empresa familiar Canaria, la cual nace en la década de los 90, después de una larga trayectoria de su socio fundador.'));
  assert.ok(html.includes('Actualmente con 2 puntos de venta y una exposición, en la isla.'));
});
test('reseñas literales', () => {
  for (const r of ['Sitio genial para comprar lo necesario para tus reformas y arreglos en casa. Calidad a buen precio',
    'Mucha variedad, buena atención y calidad/precio', 'Siempre compramos allí los artículos de fontanería, ferretería, piscinas etc.',
    'Si te falta cualquier cosa.. allí lo encuentras y si nooo... te lo consiguen']) assert.ok(html.includes(r), r);
});
test('17 proveedores enlazados con noopener', () => {
  const block = html.match(/<ul class="suppliers-list"[\s\S]*?<\/ul>/)[0];
  const links = block.match(/<a\b[^>]*>/g); assert.equal(links.length, 17);
  for (const a of links) assert.match(a, /rel="noopener"/);
});
test('contacto', () => {
  for (const s of ['tel:+34928524060', 'tel:+34928349021', 'mailto:info@suministrosjoseluiscabrera.es']) assert.ok(html.includes(s));
});
```

- [ ] Step 2: FAIL. Step 3: escribir `index.html` completo (secciones del spec, `<picture>`/`srcset` WebP con `width`/`height`,
  `loading="lazy"` salvo el inicio, import map `three` y `three/addons/`, `<noscript>`), `robots.txt`, `sitemap.xml`,
  `site.webmanifest`, `.htaccess` (mod_deflate/brotli + `Cache-Control` para assets). Step 4: PASS. Step 5: Commit.

### Task 5: Sistema visual CSS y layout estático

**Files:** Create `sitio/css/styles.css`

- [ ] Step 1: Invocar `frontend-design` y `impeccable` para la dirección; `@font-face` locales con `font-display: swap`; tokens; escala tipográfica fluida (`clamp`); retícula de plano.
- [ ] Step 2: Estilos de cada sección en estado sin JS (legible y completo), incluidos visuales CSS: placas atornilladas, tornillos SVG, regla del horario, tarjetas de tiendas, reseñas, pie. Móvil primero, sin scroll horizontal a 375 px.
- [ ] Step 3: Verificar en el navegador integrado (escritorio + 375 px) con JS desactivado de facto (antes de `main.js`). Commit.

### Task 6: UI animada general (`main.js`, horario, marquee)

**Files:** Create `sitio/js/main.js`, `sitio/js/ui/marquee.js`; Modify `sitio/js/ui/horario.js` (render)

**Interfaces:** Consumes ganchos `data-*` de Task 4 y `renderHorario(root)`. Produces `window.__lenis` (para depuración) y clase `html.js` / `html.reduced-motion`.

- [ ] Step 1: Lenis + ScrollTrigger sincronizados; nav que aparece tras la intro; menú móvil accesible (`aria-expanded`, Escape).
- [ ] Step 2: Reveals con máscara, barra de progreso «cinta métrica», tornillos SVG que giran con scroll, cursor de precisión (solo `pointer: fine`), botones magnéticos, inclinación 3D de reseñas, chinchetas del mapa, galerías de tiendas (miniaturas → imagen principal).
- [ ] Step 3: `renderHorario` (barras, línea «ahora», día actual, píldora) + refresco cada minuto; marquee de proveedores (duplicado `aria-hidden`, pausa al hover/focus).
- [ ] Step 4: Consola sin errores; `node --test tools/tests` sigue en verde. Commit.

### Task 7: «Lo que hacemos» — scroll horizontal y visuales

**Files:** Create `sitio/js/ui/productos.js`; Modify `sitio/css/styles.css`

- [ ] Step 1: Pin + `x` del track ligado al scroll (solo ≥ 900 px y sin reduced-motion; si no, pila vertical).
- [ ] Step 2: Visual por panel activado por `containerAnimation`: cinta métrica, abanico de colores + goteo, cristal con brillo, lamas que suben, cáusticas SVG, tubería que se dibuja, rejilla de fundición, brasas en `<canvas>` 2D.
- [ ] Step 3: Verificar recorrido completo en escritorio y móvil. Commit.

### Task 8: Núcleo 3D (`stage.js`, `hardware.js`)

**Files:** Create `sitio/js/three/stage.js`, `sitio/js/three/hardware.js`

**Interfaces:**
- `createStage(el: HTMLElement, { fov=35, maxDpr=1.75, alpha=true }): { renderer, scene, camera, onFrame(cb), start(), stop(), dispose(), visible:boolean }` — `RoomEnvironment` vía PMREM, `ACESFilmic`, `SRGB`, `ResizeObserver`, `IntersectionObserver` que llama `start/stop`.
- `materials(): { steel, zinc, brass, blackOxide, redPaint, blackPlastic }`
- `screwGeometry({length=2.4,radius=0.18})`, `boltGeometry({length=2,radius=0.22})`, `nutGeometry({size=0.42})`,
  `washerGeometry({outer=0.42,inner=0.2})`, `gearGeometry({teeth=14,radius=1,depth=0.3})`, `wrenchGeometry()` → `THREE.BufferGeometry` fusionada y centrada.
- `scatterInstances(geometry, material, count, { spread, seed }): THREE.InstancedMesh` con `userData.items[{pos,rot,spin,phase}]`.

- [ ] Step 1: Implementar; rosca = `TubeGeometry` sobre hélice; cabezas por `LatheGeometry`; hexágonos por `ExtrudeGeometry` con bisel.
- [ ] Step 2: Página de prueba temporal en el navegador que muestre cada pieza; revisar forma y materiales; borrar la página. Commit.

### Task 9: Intro «caja de herramientas» + inicio 3D

**Files:** Create `sitio/js/three/intro.js`; Modify `sitio/js/main.js`

**Interfaces:** `initIntro({ stageEl, heroEl, reduced }): { progress(p:number): void, dispose() }` — `main.js` crea un ScrollTrigger sobre `#intro` (`start:'top top', end:'bottom bottom', scrub:true`) y llama `progress`.

- [ ] Step 1: Caja (RoundedBox rojo `redPaint`, franjas negras, asa `TubeGeometry`, 2 cierres, tapa con pivote trasero, 4 bandejas con brazos en voladizo).
- [ ] Step 2: Línea de tiempo 0–15–45–75–100 % (spec); tornillería instanciada que sale de la caja y se queda flotando con parallax de ratón; revelado del texto del inicio a partir de 0,75.
- [ ] Step 3: «Saltar intro», pista de scroll, fallback sin WebGL (clase `no-webgl` → imagen/CSS). Verificar a 60 fps aprox. y en móvil. Commit.

### Task 10: Mini escenas (engranajes y llave)

**Files:** Create `sitio/js/three/mini.js`; Modify `sitio/js/main.js`

**Interfaces:** `initGears(el)`, `initWrench(el)` → `{ dispose() }`, cargadas con `IntersectionObserver` (import dinámico) al acercarse.

- [ ] Step 1: 3 engranajes (rojo, acero, negro) con relación de giro correcta (ω₂ = −ω₁·z₁/z₂) + giro extra con scroll.
- [ ] Step 2: Llave fija que sigue al ratón con inercia y un perno. Verificar. Commit.

### Task 11: Robustez, accesibilidad y rendimiento

- [ ] Step 1: `prefers-reduced-motion`, foco visible, `skip-link`, `aria-label` en enlaces de icono, orden de tabulación.
- [ ] Step 2: Móvil 375 px sin desbordes; DPR y nº de piezas reducidos; carga diferida de 3D; comprobar peso total transferido.
- [ ] Step 3: Commit.

### Task 12: Auditorías y verificación final

- [ ] Step 1: `searchfit-seo` (seo-check / schema / technical) sobre `sitio/index.html`; corregir hallazgos.
- [ ] Step 2: `impeccable` (audit + polish) y revisión de contrastes con script; corregir.
- [ ] Step 3: Recorrido final en navegador (escritorio y móvil), consola limpia, `node --test tools/tests` en verde; README con previsualizar/desplegar/cambiar dominio.
- [ ] Step 4: Commit y `superpowers:verification-before-completion` + `superpowers:finishing-a-development-branch`.

---

## Desviaciones durante la ejecución

- **Scripts clásicos (IIFE) en vez de módulos ES** y **scroll nativo sin Lenis**, por las reglas de la skill
  *adrian-saenz-hostinger-premium-website* (funciona con doble clic y con la caché de Hostinger).
  Three.js se empaqueta con esbuild como `lib/three.bundle.min.js` (global `window.THREE`); `?v=` en CSS/JS.
- Estructura final: `sitio/styles.css`, `sitio/main.js` y `sitio/js/{horario,productos,three-core,intro,mini}.js`.
- Tipografía única *Archivo* variable (el eje de anchura hace de roles) en lugar de tres familias
  (Instrument Sans y JetBrains Mono descartadas por las reglas de *frontend-design*/*impeccable*).
- Dirección visual elegida por el cliente en la página de decisión de *impeccable*: «carta de colores».
- `prefers-reduced-motion` solo desactiva lo intrusivo (brasas, animaciones infinitas), no la intro ni las microinteracciones.
- Capturas de revisión con `tools/shots.mjs` (puppeteer-core + Chrome local) porque la emulación del panel
  del navegador no captura bien WebGL a 1440 px.

## Revisión del cliente (24-09-2026)

El dueño del negocio revisó la web publicada y pidió estos cambios, que se aplicaron tal cual:

1. **Nombre completo arriba**: «Suministros José Luis Cabrera S.L.» junto al logo, en la barra y en la portada.
2. **Fuera la intro 3D**: se quitaron la caja de herramientas que se abría con el scroll y la lluvia de
   tornillos. La web abre directamente en la portada (`js/intro.js` eliminado; `tools/vendor.mjs` recorta
   el paquete de Three.js a lo que usan los engranajes y la llave).
3. **Rótulo de portada**: «Ferretería, pintura y vidrio en Lanzarote» → «Ferretería especializada»
   (lo que dice el rótulo real de la tienda de Tías).
4. **Fuera la carta de colores** de «Lo que hacemos»: desaparecen las tiras RAL y el abanico fijado; en su
   lugar, un directorio de ocho especialidades con las palabras del cliente y las fichas en rejilla.
5. **«Localizaciones»** en vez de «Nuestras tiendas en Tías y Playa Blanca», con un mapa de Google normal
   (iframe centrado en Lanzarote) en lugar del mapa SVG dibujado a mano.
6. **WhatsApp 686 99 60 82** debajo de la llave inglesa, en el pie y en los datos estructurados.
7. **Azul en lugar de negro**: el picón (#141210) deja paso al azul marino #16202c y toda la rampa de tonos
   pasa a azules; los rojos de marca se mantienen. Se regeneraron iconos e imagen para redes.
8. **Logotipos de los proveedores**: las 17 placas llevan el logotipo real de cada marca (tomado de su propia
   web) sobre placa blanca, con el nombre escrito debajo. Los archivos originales están en `tools/logos-src`
   y se preparan con `node tools/logos.mjs`.

Pendiente que nace de esto: el iframe de Google Maps deja cookies de Google, así que hace falta un aviso de
cookies antes de publicar en el dominio definitivo.

### Segunda vuelta de la revisión (24-09-2026)

9. **El nombre, de una sola tipografía**: fuera la cursiva de «José Luis Cabrera»; todo en Barlow
   Condensed en versales, con espacios duros para que nunca parta «José Luis Cabrera S.L.».
10. **Puertas de garaje**: fuera «Nuestra especialidad»; ahora dice que tienen exposición propia.
11. **Los tres locales en el mapa**: el iframe gratuito de Google solo admite un marcador (probadas
    cuatro variantes: `search?api=1` sale en blanco, `maps?q=` sin ciudad muestra el mundo entero y
    `embed/v1` pide clave de API). Solución: el mapa queda fijo (`ll` + `z` conocidos, sin arrastrar) y
    `initMapa` coloca los tres locales encima proyectando latitud y longitud con Mercator, la misma
    proyección que usa Google, así que cada punto cae en su sitio exacto. El rótulo salta al otro lado
    del punto si no cabe. Coordenadas de Nominatim (OpenStreetMap).
12. **Entradilla de «Localizaciones»** en Geist, sin cursiva: su titular es de una sola voz y la cursiva
    ahí no tenía con qué emparejarse.
13. **La llave dejó de flotar**: la columna derecha de «Contacto» es ahora una ficha con su cota
    rotulada, la llave dentro, el WhatsApp al doble de tamaño y si está abierto ahora mismo (el dato
    sale del mismo `js/horario.js` que la sección de horario).

### Tercera vuelta de la revisión (24-09-2026)

14. **La cinta de progreso ya no es transparente**: dejaba ver la página por debajo y en el móvil
    parecía que la web estaba cortada por arriba. Ahora es un raíl opaco pegado a la barra.
15. **Caja de herramientas en vez de la llave** en «Contacto»: cerrada, en el rojo y el cromo de la
    marca, girando despacio con el scroll (no se abre). `js/mini.js` cambia `wrench` por `toolbox`;
    vuelven al paquete de Three.js `RoundedBoxGeometry`, `TorusGeometry` y `CatmullRomCurve3`, y sale
    `wrenchGeometry` de `js/three-core.js`. El encuadre se calcula con la esfera que envuelve la caja:
    como gira sobre su centro, el radio no cambia y la cámara nunca la corta.
16. **Logotipo nuevo** en toda la web. El original venía con el damero de transparencia pintado
    encima, así que `optimize-images.mjs` lo limpia en dos pasos: relleno desde los bordes para el
    fondo y, para los huecos cerrados del trazo, una prueba de «¿esto es damero?» (los tonos se
    agrupan en los dos del tablero y casi no hay valores intermedios, cosa que un brillo del metal
    no cumple). En la portada va en relieve, con una pila de sombras duras que le hace el canto de
    acero y una postura fija: ni se anima ni cambia de tamaño.

### El vidrio fuera (24-09-2026)

El dueño avisa de que **la empresa no trabaja el vidrio**. Se quita de toda la web: la ficha de
«Vidrio» y su efecto de cristales (HTML, CSS y el `initGlass` de `js/productos.js`), la meta
description, el título y la descripción para redes, y la descripción de la tienda de Tías en los
datos estructurados. Queda anotado en `PRODUCT.md` y en el contrato de dirección para que no
vuelva a colarse. El directorio de ocho especialidades no lo mencionaba, así que no cambia.
