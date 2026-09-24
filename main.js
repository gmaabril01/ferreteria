/* Suministros José Luis Cabrera: arranque de la web.
   Scripts clásicos (sin módulos). Todo el contenido está en el HTML; esto solo lo enriquece. */
(function () {
  "use strict";

  var VER = "2026092408";
  var ns = (window.__JLC__ = window.__JLC__ || {});
  var root = document.documentElement;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src + "?v=" + VER;
      s.async = false;
      s.onload = resolve;
      s.onerror = function () { reject(new Error("No se pudo cargar " + src)); };
      document.body.appendChild(s);
    });
  }

  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
    } catch (e) { return false; }
  }

  // ---------- Base ----------
  function initHairline() {
    root.style.setProperty("--hair", Math.max(0.5, 1 / (window.devicePixelRatio || 1)).toFixed(3) + "px");
  }

  function initTape() {
    var fill = $("[data-tape]");
    if (!fill) return;
    var ticking = false;
    function update() {
      ticking = false;
      var max = document.documentElement.scrollHeight - innerHeight;
      fill.style.setProperty("--progress", max > 0 ? (scrollY / max).toFixed(4) : 0);
    }
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // Los tornillos de las cotas giran al hacer scroll (como si se apretaran).
  function initScrews() {
    var screws = $$("[data-spin]");
    if (!screws.length) return;
    var ticking = false;
    function update() {
      ticking = false;
      screws.forEach(function (s, i) { s.style.setProperty("--turn", ((scrollY * 0.35 + i * 47) % 360).toFixed(1) + "deg"); });
    }
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  // ---------- Desplazamiento suave ----------
  // Lenis suaviza la rueda del ratón (en el móvil se deja el scroll táctil nativo) y va
  // sincronizado con GSAP: las animaciones ligadas al scroll no dan saltos al ir rápido.
  function initLenis() {
    if (!window.Lenis || !window.gsap || !window.ScrollTrigger) return;
    var lenis = new Lenis({ lerp: reduced ? 0.2 : 0.1, smoothWheel: true, wheelMultiplier: 1, syncTouch: false, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    ns.lenis = lenis;
  }

  function scrollToY(y) {
    if (ns.lenis) ns.lenis.scrollTo(y, { duration: reduced ? 0.6 : 1.1 });
    else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
  }
  ns.scrollToY = scrollToY;

  // ---------- Navegación ----------
  function initNav() {
    var nav = $("[data-nav]");
    var menu = $("[data-menu]");
    var toggle = $("[data-menu-toggle]");
    if (!nav) return;

    // La barra se apoya sobre el fondo en cuanto la portada empieza a subir.
    var ticking = false;
    function update() {
      ticking = false;
      nav.classList.toggle("is-shown", true);
      nav.classList.toggle("is-solid", scrollY > 40);
    }
    addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener("resize", update);
    ns.updateNav = update;
    update();

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
    }
    if (toggle && menu) {
      toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
      menu.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { setOpen(false); toggle.focus(); }
      });
    }

    // Sección actual en el menú
    var links = $$(".nav-links a");
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting || !map[e.target.id]) return;
          links.forEach(function (a) { a.classList.remove("is-current"); });
          map[e.target.id].classList.add("is-current");
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
    }
  }

  function initAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (!id || id === "#") return;
      var el = document.querySelector(id);
      if (!el) return;
      var top = el.getBoundingClientRect().top + scrollY - (id === "#contenido" ? 0 : 70);
      e.preventDefault();
      scrollToY(top);
      if (id !== "#inicio") history.replaceState(null, "", id);
    });
  }

  // ---------- Apariciones ----------
  function initReveals() {
    var targets = $$(".tiendas .section-head, .horario .section-head, .resenas .section-head, .proveedores .section-head, .tienda, .resenas-list li, .contacto-inner, .nosotros-copy, .footer-brand");
    targets.forEach(function (el) { el.setAttribute("data-reveal", ""); });
    var extras = $$(".regla, .linea, .mapa, .productos .section-head, .directorio");
    var all = targets.concat(extras);
    if (!("IntersectionObserver" in window)) { all.forEach(function (el) { el.classList.add("is-in"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -6% 0px" });
    all.forEach(function (el) { io.observe(el); });
    // Red de seguridad: nada se queda escondido.
    setTimeout(function () {
      all.forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight) el.classList.add("is-in"); });
    }, 6000);
  }

  // ---------- Horario ----------
  function initHorario() {
    var api = ns.horario;
    // El mismo dato aparece en «Horario» y en la ficha de contacto.
    var rotulos = $$("[data-horario-status]");
    var regla = $("[data-horario]");
    var now = $("[data-now]");
    if (!api || !rotulos.length || !regla) return;
    function update() {
      var s = api.getStatus(new Date());
      rotulos.forEach(function (el) {
        el.textContent = api.statusLabel(s);
        el.classList.toggle("is-open", s.open);
      });
      $$(".dia", regla).forEach(function (li) { li.classList.toggle("is-today", Number(li.getAttribute("data-day")) === s.day); });
      if (now) {
        var inRange = s.minutes >= 420 && s.minutes <= 1020;
        now.hidden = !inRange;
        if (inRange) regla.style.setProperty("--now", ((s.minutes - 420) / 600).toFixed(4));
      }
    }
    update();
    setInterval(update, 60000);
  }

  // ---------- Tiendas ----------
  function initGalleries() {
    $$("[data-gallery]").forEach(function (g) {
      var main = $("[data-gallery-main]", g);
      var buttons = $$(".tienda-thumbs button", g);
      if (!main) return;
      buttons.forEach(function (b) {
        b.addEventListener("click", function () {
          if (b.getAttribute("aria-pressed") === "true") return;
          buttons.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          main.classList.add("is-swapping");
          var img = new Image();
          img.onload = function () {
            main.removeAttribute("srcset");
            main.src = b.getAttribute("data-src");
            main.alt = b.getAttribute("data-alt");
            main.classList.remove("is-swapping");
          };
          img.src = b.getAttribute("data-src");
        });
      });
    });
  }

  // ---------- Mapa ----------
  // El iframe gratuito de Google solo sabe marcar un sitio, así que el mapa va fijo (centro y
  // zoom conocidos) y los tres locales se colocan encima. La posición sale de la proyección
  // de Mercator, la misma que usa Google, así que cada dirección cae en su punto exacto.
  function initMapa() {
    var lienzo = $("[data-mapa]");
    if (!lienzo) return;
    var centro = lienzo.getAttribute("data-centro").split(",").map(Number);
    var escala = 256 * Math.pow(2, Number(lienzo.getAttribute("data-zoom")));
    var pins = $$(".pin", lienzo);
    if (!pins.length) return;

    function mercatorY(lat) {
      var s = Math.sin(lat * Math.PI / 180);
      return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
    }
    var cx = (centro[1] + 180) / 360, cy = mercatorY(centro[0]);

    function colocar() {
      var w = lienzo.clientWidth, h = lienzo.clientHeight;
      if (!w || !h) return;
      pins.forEach(function (p) {
        var ll = p.getAttribute("data-pin").split(",").map(Number);
        p.style.setProperty("--x", (w / 2 + ((ll[1] + 180) / 360 - cx) * escala).toFixed(1) + "px");
        p.style.setProperty("--y", (h / 2 + (mercatorY(ll[0]) - cy) * escala).toFixed(1) + "px");
        p.classList.add("is-puesto");
      });
      // Si el rótulo se sale del lienzo, salta al otro lado del punto.
      pins.forEach(function (p) {
        var x = parseFloat(p.style.getPropertyValue("--x"));
        var ancho = p.offsetWidth;
        var der = p.classList.contains("pin--der");
        if (der && x + ancho > w - 4) { p.classList.remove("pin--der"); p.classList.add("pin--izq"); }
        else if (!der && x - ancho < 4) { p.classList.remove("pin--izq"); p.classList.add("pin--der"); }
      });
    }
    colocar();
    if (window.ResizeObserver) new ResizeObserver(colocar).observe(lienzo);
    else addEventListener("resize", colocar);
  }

  // ---------- Proveedores ----------
  function initMarquee() {
    var wrap = $("[data-marquee]");
    var list = wrap && $(".suppliers-list", wrap);
    if (!list || list.getAttribute("data-looped")) return;
    list.setAttribute("data-looped", "1");
    var items = $$("li", list);
    function hiddenClone(li) {
      var c = li.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      $$("a", c).forEach(function (a) { a.setAttribute("tabindex", "-1"); });
      return c;
    }
    // Fila 1: la lista real + una copia oculta para el bucle continuo.
    items.forEach(function (li) { list.appendChild(hiddenClone(li)); });
    // Fila 2: el mismo catálogo en orden inverso, en sentido contrario.
    var row = document.createElement("ul");
    row.className = "marquee-row";
    row.setAttribute("aria-hidden", "true");
    var rev = items.slice().reverse();
    rev.concat(rev).forEach(function (li) { row.appendChild(hiddenClone(li)); });
    wrap.appendChild(row);
    wrap.classList.add("is-running");
  }

  // ---------- Microinteracciones ----------
  function initMagnetic() {
    if (!fineHover) return;
    $$("[data-magnetic]").forEach(function (el) {
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.setProperty("--mx", (dx * 10).toFixed(1) + "px");
        el.style.setProperty("--my", (dy * 8).toFixed(1) + "px");
      });
      el.addEventListener("pointerleave", function () { el.style.setProperty("--mx", "0px"); el.style.setProperty("--my", "0px"); });
    });
  }

  // ---------- 3D ----------
  // Las escenas 3D pequeñas (llave y engranajes) se construyen en momentos de reposo nada más
  // cargar, y no al llegar a su sección: construirlas en pleno scroll daba tirones de 200 a 400 ms.
  function initMiniStages() {
    if (!ns.mini) return;
    var queue = $$("[data-stage]");
    var idle = window.requestIdleCallback || function (fn) { return setTimeout(fn, 250); };
    function build(el) {
      if (!el || el.getAttribute("data-built")) return;
      el.setAttribute("data-built", "1");
      var kind = el.getAttribute("data-stage");
      safe(function () {
        if (kind === "gears") ns.mini.gears(el, { reduced: reduced });
        if (kind === "wrench") ns.mini.wrench(el, { reduced: reduced });
      }, "mini-" + kind);
    }
    // Red de seguridad: si alguien llega muy rápido, se construye con margen de sobra.
    queue.forEach(function (el) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { io.disconnect(); build(el); }
      }, { rootMargin: "1400px 0px" });
      io.observe(el);
    });
    var i = 0;
    (function next() {
      if (i >= queue.length) return;
      idle(function () { build(queue[i++]); setTimeout(next, 300); }, { timeout: 2500 });
    })();
  }

  function init3D() {
    if (!hasWebGL()) return;
    loadScript("lib/three.bundle.min.js")
      .then(function () { return loadScript("js/three-core.js"); })
      .then(function () { return loadScript("js/mini.js"); })
      .then(function () { safe(initMiniStages, "initMiniStages"); })
      .catch(function (e) { console.warn("[3D]", e); });
  }

  // ---------- Arranque ----------
  function boot() {
    if (window.gsap && window.ScrollTrigger) {
      try {
        gsap.registerPlugin(ScrollTrigger);
        // En el móvil, la barra del navegador aparece y desaparece al hacer scroll: que no provoque saltos.
        ScrollTrigger.config({ ignoreMobileResize: true });
      } catch (_) {}
    }
    safe(initLenis, "initLenis");
    safe(initHairline, "initHairline");
    safe(initTape, "initTape");
    safe(initScrews, "initScrews");
    safe(initNav, "initNav");
    safe(initAnchors, "initAnchors");
    safe(initReveals, "initReveals");
    safe(initHorario, "initHorario");
    safe(initGalleries, "initGalleries");
    safe(initMapa, "initMapa");
    safe(initMarquee, "initMarquee");
    safe(initMagnetic, "initMagnetic");
    safe(function () { if (ns.productos) ns.productos.init(); }, "productos");
    safe(init3D, "init3D");
    root.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
