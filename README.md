# Web de Suministros José Luis Cabrera S.L.

Web de una sola página (HTML, CSS y JavaScript sin compilación): portada con el nombre completo y la fachada,
directorio y fichas de producto, localizaciones con mapa de Google, horario en vivo, contacto con WhatsApp,
sobre nosotros, reseñas y proveedores con sus logotipos.

## Dónde está la web

La web está en la **raíz del repositorio**, así que GitHub Pages la muestra directamente en
https://gmaabril01.github.io/ferreteria/ (sin pasos intermedios). Cada `git push` a `main` la actualiza.

**Para Hostinger** sube solo estos archivos y carpetas a `public_html`:
`index.html`, `styles.css`, `main.js`, `js/`, `lib/`, `assets/`, `og-image.jpg`, `robots.txt`,
`sitemap.xml`, `site.webmanifest` y el archivo oculto `.htaccess` (activa «mostrar archivos ocultos» para verlo).

Lo demás (`tools/`, `docs/`, `.impeccable/`, fotos originales) es material de trabajo y no hace falta subirlo.

## Ver la web en tu ordenador

```bash
node tools/serve.mjs
```

Después abre http://localhost:5173 en el navegador. (Abrir `index.html` con doble clic también funciona,
pero el navegador bloquea la tipografía en ese modo y verás una fuente del sistema.)

## Cambiar el dominio

Cuando tengas el dominio definitivo (por defecto está `https://www.suministrosjoseluiscabrera.es`):

```bash
node tools/set-domain.mjs https://www.tu-dominio.es
```

Actualiza la URL canónica, las etiquetas para redes sociales, los datos estructurados, `sitemap.xml` y `robots.txt`.

## Después de publicar

1. Sube la web y comprueba que carga por `https://`. Si tienes SSL, activa la redirección a HTTPS en `.htaccess`.
2. Da de alta el dominio en Google Search Console y envía `sitemap.xml`.
3. Revisa que la ficha de Google Business de cada tienda use el mismo nombre, dirección y teléfonos que la web.
4. Añade el aviso legal y la política de privacidad (obligatorios para una S.L.).
5. El mapa de «Localizaciones» es un iframe de Google Maps y **Google deja cookies propias** al cargarlo:
   hace falta un aviso de cookies. Si se prefiere evitarlo, se puede sustituir el iframe por una imagen del
   mapa que enlace a Google Maps.

Cada vez que cambies `styles.css` o algún `.js`, sube también `index.html` con la versión `?v=` actualizada
(fecha del cambio) para que nadie vea la versión antigua guardada en caché.

## Herramientas (carpeta `tools/`)

| Comando | Qué hace |
|---|---|
| `npm install` (dentro de `tools/`) | instala las herramientas de desarrollo |
| `npm test` | tests del horario, del cambio de dominio y del SEO del HTML |
| `node vendor.mjs` | vuelve a copiar Three.js, GSAP y la tipografía a `lib/` y `assets/` |
| `node optimize-images.mjs` | convierte las fotos originales a WebP, recorta el logo y crea iconos |
| `node logos.mjs` | prepara los logotipos de `tools/logos-src` para `assets/logos` |
| `node shots.mjs desktop <carpeta> i0 i1 #tiendas` | capturas de revisión con Chrome |
