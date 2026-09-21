# Web de Suministros José Luis Cabrera S.L.

Web de una sola página (HTML, CSS y JavaScript sin compilación) con intro 3D de una caja de herramientas,
carta de colores de productos, tiendas, horario en vivo, contacto, sobre nosotros, reseñas y proveedores.

## Qué se sube al hosting

**Solo el contenido de la carpeta `sitio/`** (incluido el archivo oculto `.htaccess`).
En Hostinger: Administrador de archivos → `public_html` → subir todo lo que hay dentro de `sitio/`.

Lo demás (`tools/`, `docs/`, fotos originales) es material de trabajo y no se sube.

## Ver la web en tu ordenador

```bash
node tools/serve.mjs
```

Después abre http://localhost:5173 en el navegador. (Abrir `sitio/index.html` con doble clic también funciona,
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
4. Añade el aviso legal y la política de privacidad (obligatorios para una S.L.; la web no usa cookies).

Cada vez que cambies `styles.css` o algún `.js`, sube también `index.html` con la versión `?v=` actualizada
(fecha del cambio) para que nadie vea la versión antigua guardada en caché.

## Herramientas (carpeta `tools/`)

| Comando | Qué hace |
|---|---|
| `npm install` (dentro de `tools/`) | instala las herramientas de desarrollo |
| `npm test` | tests del horario, del cambio de dominio y del SEO del HTML |
| `node vendor.mjs` | vuelve a copiar Three.js, GSAP y la tipografía a `sitio/` |
| `node optimize-images.mjs` | convierte las fotos originales a WebP, recorta el logo y crea iconos |
| `node shots.mjs desktop <carpeta> i0 i1 #tiendas` | capturas de revisión con Chrome |
