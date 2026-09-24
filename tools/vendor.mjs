// Copia las librerías y la tipografía a la web para que no dependa de ningún CDN.
// Three.js se empaqueta con esbuild como script clásico (window.THREE) porque la web
// no usa módulos ES (funciona con doble clic y con la caché de Hostinger).
import { build } from 'esbuild';
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..');
const nm = join(here, 'node_modules');

const copies = [
  ['gsap/dist/gsap.min.js', 'lib/gsap.min.js'],
  ['gsap/dist/ScrollTrigger.min.js', 'lib/ScrollTrigger.min.js'],
  ['lenis/dist/lenis.min.js', 'lib/lenis.min.js'],
  // Instrument Serif (titulares, eslogan, teléfonos, reseñas) y Geist (texto, botones, etiquetas)
  ['@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2', 'assets/fonts/instrument-serif.woff2'],
  ['@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2', 'assets/fonts/instrument-serif-italic.woff2'],
  ['@fontsource-variable/geist/files/geist-latin-wght-normal.woff2', 'assets/fonts/geist-variable.woff2'],
  ['@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2', 'assets/fonts/geist-mono-variable.woff2'],
  // Barlow Condensed: la línea fuerte de cada titular
  ['@fontsource/barlow-condensed/files/barlow-condensed-latin-700-normal.woff2', 'assets/fonts/barlow-condensed-700.woff2'],
  ['@fontsource/barlow-condensed/files/barlow-condensed-latin-800-normal.woff2', 'assets/fonts/barlow-condensed-800.woff2'],
];

for (const [from, to] of copies) {
  const dest = join(site, to);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(join(nm, from), dest);
}

// Solo lo que usan js/three-core.js y js/mini.js: así el paquete pesa lo mínimo.
const entry = `
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Object3D, Vector2, Vector3, Color, BufferAttribute,
  MathUtils, BoxGeometry, CylinderGeometry, LatheGeometry, TubeGeometry, ExtrudeGeometry, PlaneGeometry, Shape, Path,
  Curve, MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial, DirectionalLight, HemisphereLight,
  PMREMGenerator, ACESFilmicToneMapping, SRGBColorSpace, CanvasTexture
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
window.THREE = {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, Object3D, Vector2, Vector3, Color, BufferAttribute,
  MathUtils, BoxGeometry, CylinderGeometry, LatheGeometry, TubeGeometry, ExtrudeGeometry, PlaneGeometry, Shape, Path,
  Curve, MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial, DirectionalLight, HemisphereLight,
  PMREMGenerator, ACESFilmicToneMapping, SRGBColorSpace, CanvasTexture,
  RoomEnvironment, mergeGeometries
};
`;

await build({
  stdin: { contents: entry, resolveDir: here, loader: 'js' },
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2019',
  legalComments: 'eof',
  outfile: join(site, 'lib/three.bundle.min.js'),
});

for (const f of ['lib/gsap.min.js', 'lib/ScrollTrigger.min.js', 'lib/lenis.min.js', 'lib/three.bundle.min.js', 'assets/fonts/instrument-serif.woff2', 'assets/fonts/geist-variable.woff2']) {
  console.log(f.padEnd(34), (statSync(join(site, f)).size / 1024).toFixed(1), 'KB');
}
