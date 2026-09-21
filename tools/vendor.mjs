// Copia las librerías y la tipografía a sitio/ para que la web no dependa de ningún CDN.
// Three.js se empaqueta con esbuild como script clásico (window.THREE) porque la web
// no usa módulos ES (funciona con doble clic y con la caché de Hostinger).
import { build } from 'esbuild';
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = join(here, '..', 'sitio');
const nm = join(here, 'node_modules');

const copies = [
  ['gsap/dist/gsap.min.js', 'lib/gsap.min.js'],
  ['gsap/dist/ScrollTrigger.min.js', 'lib/ScrollTrigger.min.js'],
  ['@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2', 'assets/fonts/archivo-variable.woff2'],
];

for (const [from, to] of copies) {
  const dest = join(site, to);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(join(nm, from), dest);
}

// Solo lo que usan js/three-core.js, js/intro.js y js/mini.js: así el paquete pesa lo mínimo.
const entry = `
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, InstancedMesh, Object3D, Vector2, Vector3, Color, BufferAttribute,
  Matrix4, Quaternion, Euler, MathUtils, BufferGeometry, BoxGeometry, CylinderGeometry, LatheGeometry,
  TubeGeometry, TorusGeometry, ExtrudeGeometry, SphereGeometry, PlaneGeometry, CircleGeometry, Shape, Path,
  CatmullRomCurve3, Curve, MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial, ShadowMaterial,
  AmbientLight, DirectionalLight, PointLight, SpotLight, HemisphereLight, PMREMGenerator, ACESFilmicToneMapping,
  SRGBColorSpace, PCFSoftShadowMap, DoubleSide, CanvasTexture, Fog, FogExp2, RepeatWrapping
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
window.THREE = {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Mesh, InstancedMesh, Object3D, Vector2, Vector3, Color, BufferAttribute,
  Matrix4, Quaternion, Euler, MathUtils, BufferGeometry, BoxGeometry, CylinderGeometry, LatheGeometry,
  TubeGeometry, TorusGeometry, ExtrudeGeometry, SphereGeometry, PlaneGeometry, CircleGeometry, Shape, Path,
  CatmullRomCurve3, Curve, MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial, ShadowMaterial,
  AmbientLight, DirectionalLight, PointLight, SpotLight, HemisphereLight, PMREMGenerator, ACESFilmicToneMapping,
  SRGBColorSpace, PCFSoftShadowMap, DoubleSide, CanvasTexture, Fog, FogExp2, RepeatWrapping,
  RoundedBoxGeometry, RoomEnvironment, mergeGeometries, mergeVertices
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

for (const f of ['lib/gsap.min.js', 'lib/ScrollTrigger.min.js', 'lib/three.bundle.min.js', 'assets/fonts/archivo-variable.woff2']) {
  console.log(f.padEnd(34), (statSync(join(site, f)).size / 1024).toFixed(1), 'KB');
}
