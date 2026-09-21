# Web de Suministros José Luis Cabrera S.L. — Diseño

Fecha: 2026-09-21 · Estado: aprobado por el cliente (enfoque A)

## Objetivo

Web de una sola página, premium y muy visual, para la ferretería, pintura y vidrio
**Suministros José Luis Cabrera S.L.** (Lanzarote). Debe persuadir a comprar, llevar a
las tiendas (Google Maps / llamada) y posicionar en Google para búsquedas locales.

## Decisiones cerradas con el cliente

| Tema | Decisión |
|---|---|
| Nombre | «Suministros José Luis Cabrera S.L.» (coincide con rótulos y texto «Sobre nosotros») |
| Eslogan | «Todo lo que tu obra necesita.» |
| Proveedores | Nombres con diseño tipográfico enlazados a su web (sin descargar logos) |
| Dominio | Aún desconocido → provisional `https://www.suministrosjoseluiscabrera.es`, cambiable con un comando |
| Enfoque | A: web estática + Three.js (3D real procedural) + GSAP ScrollTrigger + Lenis |
| Control de versiones | git local, rama `web-inicial` |

## Restricciones

- HTML/CSS/JS sin compilación; la carpeta `sitio/` se sube tal cual a Hostinger.
- Librerías y tipografías alojadas en el propio sitio (sin CDN ni Google Fonts: RGPD + velocidad).
- Textos del cliente **literales**: «Sobre nosotros», reseñas, datos de contacto, horario, direcciones.
- Texto nuevo mínimo (una frase por categoría de producto, etiquetas cortas).
- Sin puntuaciones ni autores inventados en las reseñas. Sin marcado `Review` en JSON-LD
  (Google no admite reseñas autopublicadas de LocalBusiness).
- Colores negro y rojo apagados, sin saturar; contraste de texto ≥ WCAG AA (4,5:1; 3:1 en titulares grandes).

## Dirección visual — «taller de precisión»

- **Paleta** (tokens CSS):
  - `--bg #0f0e0d` grafito cálido · `--bg-2 #161514` · `--surface #1c1a19` · `--line` blanco cálido al 10 %
  - `--text #ece8e1` · `--text-dim #a8a29a`
  - `--red #b8352c` (óxido, para superficies/botones con texto claro) · `--red-ink #d9675b` (rojo legible sobre fondo oscuro)
  - `--steel #8d8f93` (gris del logo)
- **Tipografía**: *Archivo* variable (ancho expandido, peso 700–850) para titulares; *Instrument Sans* para
  texto; *JetBrains Mono* para etiquetas técnicas («M8 × 40», «Ø 110 mm», cotas). Subconjunto latino, `woff2`.
- **Lenguaje gráfico**: cotas de plano técnico, reglas milimetradas, retícula de plano muy tenue,
  placas metálicas con tornillos en las esquinas, tornillería SVG variada (Phillips, plano, Torx, Allen)
  que gira con el scroll como separadores/esquinas. Barra de progreso superior en forma de cinta métrica.
  Cursor de precisión (solo puntero fino) y botones magnéticos.
- **Logo**: `LOGO.png` con fondo convertido a transparente; se conserva su contorno blanco (efecto pegatina).

## Estructura de la página

0. **Intro «caja de herramientas»** (sección fijada ≈ 400vh, lienzo WebGL)
   Caja metálica roja con remates negros, asa y dos cierres. Con el scroll:
   0–15 % cierres se abren · 15–45 % la tapa gira y las bandejas en voladizo salen hacia los lados ·
   45–75 % tornillos, tuercas, pernos y arandelas salen volando y la cámara se acerca ·
   75–100 % la caja baja y se desvanece; la tornillería queda flotando como fondo del inicio.
   Pista «Desliza para abrir» y enlace «Saltar intro».
1. **Inicio** (estado final de la intro, mismo lienzo): logo, H1 «Suministros José Luis Cabrera S.L.»,
   eslogan, línea «Ferretería · Pintura · Vidrio — Lanzarote», botones «Ver tiendas» y «Llamar».
   La tornillería 3D flota, gira y reacciona al ratón.
2. **Lo que hacemos** — scroll horizontal fijado con 8 paneles; cada uno: número, título, una frase
   persuasiva, 3–4 etiquetas y un visual propio (sin repetir):
   | Categoría | Foto | Visual |
   |---|---|---|
   | Ferretería y herramienta | `1roll` | cinta métrica que se extiende |
   | Pintura | — | carta de colores en abanico + goteo de pintura SVG |
   | Vidrio | — | paneles de cristal superpuestos con brillo que sigue al ratón |
   | Puertas de garaje y automatismos | `elocal` | lamas de puerta seccional que suben y descubren la foto |
   | Piscinas | `2int` | cáusticas de agua (filtro SVG de turbulencia) |
   | Fontanería y tubería PVC | `2rollos` | tubería con codos que se dibuja y flujo interior |
   | Construcción y fundición | `1tube` | rejilla de fundición en relieve |
   | Hogar, jardín y barbacoas | `2door` | brasas/partículas ascendentes |
3. **Nuestras tiendas** — mapa SVG estilizado de Lanzarote con chinchetas que caen al entrar;
   3 tarjetas con galería, tipo de local, dirección y botón «Cómo llegar» (Google Maps `search/?api=1&query=`):
   - Tías — Tienda y oficinas — C. Islote de Hilario, s/n, 35572 Tías — fotos `1tienda`, `1out`, `1roll`, `1tube`
   - Playa Blanca — Tienda — C. Letonia, 18, Zona Industrial Urbana Montaña Roja, 35570 Playa Blanca —
     fotos `2tienda`, `2door`, `2int`, `2rollos`
   - Tías — Exposición de puertas y automatismos — C. Libertad, 35, 35572 Tías — foto `elocal`
4. **Horario** — regla de 7:00 a 17:00; barra por día (L–V 7:30–17:00, S 8:00–13:00, D cerrado con rayado),
   día actual resaltado, línea «ahora» y píldora «Abierto ahora / Cerrado · abrimos …» en hora `Atlantic/Canary`.
5. **Contacto** — 928 52 40 60 y 928 34 90 21 (`tel:+34…`), info@suministrosjoseluiscabrera.es (`mailto:`),
   Facebook e Instagram; llave fija 3D que gira con el ratón.
6. **Sobre nosotros** — texto literal del cliente; «Desde los 90», «2 puntos de venta», «1 exposición»;
   engranajes 3D engranando.
7. **Reseñas** — las 3 reseñas literales (la 2.ª conserva su salto de línea), etiqueta «Reseña en Google»,
   tarjetas con inclinación 3D al pasar el ratón, enlace «Ver en Google Maps».
8. **Proveedores** — 17 placas metálicas atornilladas con el nombre de la marca, enlazadas
   (`target="_blank" rel="noopener"`), en dos filas en sentido contrario; pausa al pasar el ratón.
   Lista accesible real; duplicados del bucle con `aria-hidden`.
9. **Pie** — logo, direcciones, teléfonos, email, redes, © Suministros José Luis Cabrera S.L.

Navegación fija (tras la intro): logo, Productos · Tiendas · Horario · Contacto · Nosotros, botón «Llamar»;
menú desplegable en móvil.

## Arquitectura

```
sitio/                      ← se sube entero al hosting
  index.html                todo el contenido en HTML (SEO sin JS)
  css/styles.css            tokens, layout, componentes, visuales CSS
  js/main.js                arranque: Lenis+GSAP, nav, reveals, cursor, progreso, carga diferida de 3D
  js/ui/horario.js          lógica pura de horario (testeada) + render
  js/ui/productos.js        scroll horizontal y visuales de los paneles
  js/ui/marquee.js          proveedores
  js/three/hardware.js      geometrías y materiales procedurales (tornillo, perno, tuerca, arandela, engranaje, llave)
  js/three/stage.js         utilidad: renderer por elemento, entorno PBR, pausa fuera de pantalla, DPR limitado
  js/three/intro.js         caja de herramientas + tornillería del inicio
  js/three/mini.js          engranajes (Nosotros) y llave (Contacto)
  vendor/                   three (módulo + addons), gsap + ScrollTrigger, lenis
  fonts/  img/  icons/      woff2, WebP responsive, favicons
  robots.txt  sitemap.xml  site.webmanifest  .htaccess  og-image.jpg
tools/                      package.json (sharp, three, gsap, lenis, fontsource) · optimize-images.mjs ·
                            vendor.mjs · set-domain.mjs · serve.mjs · tests
```

- 3 contextos WebGL como máximo (intro/inicio, engranajes, llave); cada uno se pausa fuera de pantalla.
- Tornillería con `InstancedMesh`; menos piezas y DPR ≤ 1,25 en móvil; entorno `RoomEnvironment` para reflejos metálicos.
- **Mejora progresiva**: sin JS o sin WebGL se ve el inicio completo sin la intro; `prefers-reduced-motion`
  desactiva la intro animada y el scroll horizontal (paneles en vertical).

## SEO

- `lang="es"`, título ≤ ~65 caracteres y meta descripción ~155 con ferretería, pintura, vidrio, Tías,
  Playa Blanca, Lanzarote; un único H1; H2 por sección; `alt` descriptivos; nombres de imagen descriptivos.
- Canonical, Open Graph + Twitter con `og-image.jpg` 1200×630, favicon/apple-touch/manifest.
- JSON-LD `@graph`: `Organization` (nombre legal, logo, email, teléfonos, `sameAs` FB/IG), `WebSite`,
  `HardwareStore` ×2 (Tías, Playa Blanca) y `HomeAndConstructionBusiness` (Exposición) con dirección,
  `openingHoursSpecification`, teléfono, imagen, `hasMap`, `parentOrganization`.
- `robots.txt`, `sitemap.xml`; `.htaccess` con compresión y caché para Hostinger.
- `tools/set-domain.mjs <url>` reemplaza el dominio provisional en todos los archivos.

## Verificación

- Test unitario (`node --test`) de la lógica de horario y de `set-domain`.
- Navegador integrado: escritorio y 375 px, consola sin errores, recorrido completo de scroll, capturas.
- Auditoría SEO (searchfit-seo) y de diseño (impeccable); comprobación de contrastes.

## Fuera de alcance / recomendaciones al cliente

Aviso legal, política de privacidad y cookies (obligatorias por LSSI para una S.L.; la web no usa cookies);
coordenadas exactas y ficha de Google Business; logos oficiales de proveedores.
