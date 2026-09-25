// Empaqueta en un ZIP solo lo que va al hosting: node tools/pack.mjs
// Deja dist/suministros-jlc-web.zip listo para subir o para enviar por correo.
// Escribe el ZIP a mano (sin dependencias) para asegurarse de que entra el .htaccess,
// que es un archivo oculto y muchas herramientas se lo saltan.
import { createRequire } from 'node:module';
import { deflateRawSync, crc32 as zlibCrc32 } from 'node:zlib';
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, rmSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const dist = join(root, 'dist');

// Lo que se sube al alojamiento. Lo demás (tools, docs, fotos originales) se queda aquí.
const INCLUIR = [
  'index.html', 'styles.css', 'main.js',
  'robots.txt', 'sitemap.xml', 'site.webmanifest', 'og-image.jpg', '.htaccess',
  'js', 'lib', 'assets',
];

function listar(rel) {
  const abs = join(root, rel);
  if (!statSync(abs).isDirectory()) return [rel];
  return readdirSync(abs).flatMap((n) => listar(join(rel, n)));
}

const crc32 = zlibCrc32 || (() => {
  const tabla = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabla[n] = c;
  }
  return (buf) => {
    let c = -1;
    for (let i = 0; i < buf.length; i++) c = tabla[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
})();

function fechaDos(d) {
  const hora = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() / 2)) & 0xffff;
  const fecha = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff;
  return { hora, fecha };
}

const trozos = [];
const central = [];
let offset = 0, crudo = 0;

for (const rel of INCLUIR.flatMap(listar)) {
  const datos = readFileSync(join(root, rel));
  const nombre = Buffer.from(rel.split(sep).join('/'), 'utf8');
  const comprimido = deflateRawSync(datos, { level: 9 });
  // Si comprimir no aporta (WebP, JPG), se guarda tal cual.
  const usarDeflate = comprimido.length < datos.length;
  const cuerpo = usarDeflate ? comprimido : datos;
  const metodo = usarDeflate ? 8 : 0;
  const crc = crc32(datos);
  const { hora, fecha } = fechaDos(statSync(join(root, rel)).mtime);
  crudo += datos.length;

  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(metodo, 8);
  local.writeUInt16LE(hora, 10); local.writeUInt16LE(fecha, 12);
  local.writeUInt32LE(crc, 14); local.writeUInt32LE(cuerpo.length, 18); local.writeUInt32LE(datos.length, 22);
  local.writeUInt16LE(nombre.length, 26); local.writeUInt16LE(0, 28);
  trozos.push(local, nombre, cuerpo);

  const cab = Buffer.alloc(46);
  cab.writeUInt32LE(0x02014b50, 0);
  cab.writeUInt16LE(20, 4); cab.writeUInt16LE(20, 6); cab.writeUInt16LE(0x0800, 8); cab.writeUInt16LE(metodo, 10);
  cab.writeUInt16LE(hora, 12); cab.writeUInt16LE(fecha, 14);
  cab.writeUInt32LE(crc, 16); cab.writeUInt32LE(cuerpo.length, 20); cab.writeUInt32LE(datos.length, 24);
  cab.writeUInt16LE(nombre.length, 28);
  cab.writeUInt32LE(0o644 << 16, 38);
  cab.writeUInt32LE(offset, 42);
  central.push(cab, nombre);

  offset += local.length + nombre.length + cuerpo.length;
}

const cd = Buffer.concat(central);
const fin = Buffer.alloc(22);
fin.writeUInt32LE(0x06054b50, 0);
fin.writeUInt16LE(central.length / 2, 8); fin.writeUInt16LE(central.length / 2, 10);
fin.writeUInt32LE(cd.length, 12); fin.writeUInt32LE(offset, 16);

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
const salida = join(dist, 'suministros-jlc-web.zip');
writeFileSync(salida, Buffer.concat([...trozos, cd, fin]));

const kb = (n) => (n / 1024).toFixed(0) + ' KB';
console.log(`${central.length / 2} archivos · ${kb(crudo)} sin comprimir`);
console.log(`${relative(process.cwd(), salida)} · ${kb(statSync(salida).size)}`);
