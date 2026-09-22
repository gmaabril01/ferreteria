/* Suministros José Luis Cabrera: arranque de la web.
   Scripts clásicos (sin módulos). Todo el contenido está en el HTML; esto solo lo enriquece. */
(function () {
  "use strict";

  var VER = "20260922";
  var ns = (window.__JLC__ = window.__JLC__ || {});
  var root = document.documentElement;
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };
  function safe(fn, name) { try { fn(); } catch (e) { console.warn("[" + name + "]", e); } }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

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

  // ---------- Navegación ----------
  function introEnd() {
    var intro = $("[data-intro]");
    return intro ? intro.offsetTop + intro.offsetHeight - innerHeight : 0;
  }

  function initNav() {
    var nav = $("[data-nav]");
    var menu = $("[data-menu]");
    var toggle = $("[data-menu-toggle]");
    if (!nav) return;

    var ticking = false;
    function update() {
      ticking = false;
      var show = !root.classList.contains("intro-on") || scrollY > introEnd() - innerHeight * 0.35;
      nav.classList.toggle("is-shown", show);
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
      var top;
      if (id === "#inicio" && root.classList.contains("intro-on")) {
        top = introEnd();
      } else {
        var el = document.querySelector(id);
        if (!el) return;
        top = el.getBoundingClientRect().top + scrollY - (id === "#contenido" ? 0 : 70);
      }
      e.preventDefault();
      window.scrollTo({ top: top, behavior: reduced ? "auto" : "smooth" });
      if (id !== "#inicio") history.replaceState(null, "", id);
    });
  }

  // ---------- Apariciones ----------
  function initReveals() {
    var targets = $$(".tiendas .section-head, .horario .section-head, .resenas .section-head, .proveedores .section-head, .tienda, .resenas-list li, .contacto-inner, .nosotros-copy, .footer-brand");
    targets.forEach(function (el) { el.setAttribute("data-reveal", ""); });
    var extras = $$(".regla, .linea, .mapa, .productos .section-head");
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
    var status = $("[data-horario-status]");
    var regla = $("[data-horario]");
    var now = $("[data-now]");
    if (!api || !status || !regla) return;
    function update() {
      var s = api.getStatus(new Date());
      status.textContent = api.statusLabel(s);
      status.classList.toggle("is-open", s.open);
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

  function initStorePins() {
    var map = $("[data-map]");
    if (!map) return;
    $$(".tienda[data-store]").forEach(function (t) {
      var pin = $('[data-map-pin="' + t.getAttribute("data-store") + '"]', map);
      if (!pin) return;
      function on() { pin.classList.add("is-hot"); }
      function off() { pin.classList.remove("is-hot"); }
      t.addEventListener("mouseover", function (e) { if (!t.contains(e.relatedTarget)) on(); });
      t.addEventListener("mouseout", function (e) { if (!t.contains(e.relatedTarget)) off(); });
      t.addEventListener("focusin", on);
      t.addEventListener("focusout", off);
    });
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
  function introOff() {
    root.classList.remove("intro-on");
    root.classList.add("intro-off");
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    if (ns.updateNav) ns.updateNav();
  }

  function initIntro() {
    var canvas = $("[data-intro-canvas]");
    var intro = $("[data-intro]");
    var hero = $("[data-hero]");
    var cue = $("[data-intro-cue]");
    if (!canvas || !ns.intro) { introOff(); return; }
    var scene = ns.intro.init({ canvas: canvas, reduced: reduced, mobile: innerWidth < 900 });
    if (!scene) { introOff(); return; }
    root.classList.add("intro-on");
    canvas.classList.add("is-ready");

    function apply(p) {
      scene.progress(p);
      var heroIn = clamp((p - 0.7) / 0.18, 0, 1);
      hero.style.setProperty("--hero-in", heroIn.toFixed(3));
      hero.classList.toggle("is-live", heroIn > 0.6);
      var deck = $("[data-hero-deck]", hero);
      if (deck) deck.style.setProperty("--fan", clamp((p - 0.86) / 0.14, 0, 1).toFixed(3));
      if (cue) cue.style.opacity = clamp(1 - p * 7, 0, 1).toFixed(3);
    }

    ScrollTrigger.create({
      trigger: intro, start: "top top", end: "bottom bottom", scrub: true,
      onUpdate: function (self) { apply(self.progress); },
      onRefresh: function (self) { apply(self.progress); }
    });
    apply(clamp(scrollY / Math.max(1, introEnd()), 0, 1));
    ScrollTrigger.refresh();
    if (ns.updateNav) ns.updateNav();
  }

  function initMiniStages() {
    if (!ns.mini) return;
    $$("[data-stage]").forEach(function (el) {
      var kind = el.getAttribute("data-stage");
      var io = new IntersectionObserver(function (entries) {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        safe(function () {
          if (kind === "gears") ns.mini.gears(el, { reduced: reduced });
          if (kind === "wrench") ns.mini.wrench(el, { reduced: reduced });
        }, "mini-" + kind);
      }, { rootMargin: "400px 0px" });
      io.observe(el);
    });
  }

  function init3D() {
    if (!window.gsap || !window.ScrollTrigger || !hasWebGL()) { introOff(); return; }
    loadScript("lib/three.bundle.min.js")
      .then(function () { return loadScript("js/three-core.js"); })
      .then(function () { return Promise.all([loadScript("js/intro.js"), loadScript("js/mini.js")]); })
      .then(function () {
        try { initIntro(); } catch (e) { console.warn("[initIntro]", e); introOff(); }
        safe(initMiniStages, "initMiniStages");
      })
      .catch(function (e) { console.warn("[3D]", e); introOff(); });
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
    safe(initHairline, "initHairline");
    safe(initTape, "initTape");
    safe(initScrews, "initScrews");
    safe(initNav, "initNav");
    safe(initAnchors, "initAnchors");
    safe(initReveals, "initReveals");
    safe(initHorario, "initHorario");
    safe(initGalleries, "initGalleries");
    safe(initStorePins, "initStorePins");
    safe(initMarquee, "initMarquee");
    safe(initMagnetic, "initMagnetic");
    safe(function () { if (ns.productos) ns.productos.init(); }, "productos");
    safe(init3D, "init3D");
    root.classList.add("is-ready");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
