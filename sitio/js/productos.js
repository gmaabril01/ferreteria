/* «Lo que hacemos»: la carta de colores en abanico.
   Escritorio: la sección se fija y, al hacer scroll, la carta gira sobre su tornillo
   hasta dejar cada tira de pie mientras su foto y su texto aparecen al lado.
   Móvil o sin GSAP: lista vertical; cada categoría se activa al entrar en pantalla. */
(function () {
  "use strict";

  var ns = (window.__JLC__ = window.__JLC__ || {});
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var STEP = 9.5;        // grados entre tiras
  var OPEN_END = 0.08;   // tramo del scroll en el que se abre la carta

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  function setActive(cats, index) {
    cats.forEach(function (cat, i) { cat.classList.toggle("is-active", i === index); });
  }

  // ---------- Carta en abanico (≥ 960 px) ----------
  function mountDeck(section) {
    var head = section.querySelector(".section-head");
    var deck = section.querySelector("[data-deck]");
    var bolt = section.querySelector(".deck-bolt");
    var cats = Array.prototype.slice.call(deck.querySelectorAll(".cat"));
    var strips = cats.map(function (c) { return c.querySelector(".cat-strip"); });
    var n = cats.length;

    var pin = document.createElement("div");
    pin.className = "deck-pin";
    section.insertBefore(pin, head);
    pin.appendChild(head);
    pin.appendChild(deck);
    document.documentElement.classList.add("deck-on");

    var current = -1;
    function render(p) {
      var open = clamp(p / OPEN_END, 0, 1);
      var eased = 1 - Math.pow(1 - open, 3);
      var f = clamp((p - OPEN_END) / (1 - OPEN_END), 0, 1) * (n - 1);
      strips.forEach(function (strip, i) {
        var d = i - f;
        var ad = Math.abs(d);
        strip.style.setProperty("--a", (d * STEP * eased).toFixed(2) + "deg");
        strip.style.setProperty("--depth", Math.round(ad));
        strip.style.setProperty("--lit", (1 - Math.min(ad, 4) * 0.13).toFixed(3));
        strip.style.setProperty("--pull", (-34 * Math.max(0, 1 - ad) * eased).toFixed(1) + "px");
        strip.style.opacity = ad > 4.6 ? "0" : "1";
      });
      if (bolt) bolt.style.setProperty("--bolt-turn", (p * 540).toFixed(1) + "deg");
      var idx = Math.round(f);
      if (idx !== current) { current = idx; setActive(cats, idx); }
    }

    var st = ScrollTrigger.create({
      trigger: pin,
      start: "top top",
      end: function () { return "+=" + Math.round(window.innerHeight * n * 0.62); },
      pin: true,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: function (self) { render(self.progress); }
    });
    render(0);

    // Pulsar una tira lleva el scroll a su categoría.
    strips.forEach(function (strip, i) {
      strip.addEventListener("click", function () {
        var target = st.start + (OPEN_END + (i / (n - 1)) * (1 - OPEN_END)) * (st.end - st.start);
        window.scrollTo({ top: target + 2, behavior: reduced ? "auto" : "smooth" });
      });
    });

    return function unmount() {
      st.kill();
      section.insertBefore(head, pin);
      section.insertBefore(deck, pin);
      pin.remove();
      document.documentElement.classList.remove("deck-on");
      strips.forEach(function (s) { s.removeAttribute("style"); });
      if (bolt) bolt.style.removeProperty("--bolt-turn");
      cats.forEach(function (c) { c.classList.remove("is-active"); });
    };
  }

  // ---------- Lista vertical: activación por visibilidad ----------
  function mountList(section) {
    var cats = Array.prototype.slice.call(section.querySelectorAll(".cat"));
    if (!("IntersectionObserver" in window)) { cats.forEach(function (c) { c.classList.add("is-active"); }); return function () {}; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add("is-active"); });
    }, { threshold: 0.01, rootMargin: "0px 0px -18% 0px" });
    cats.forEach(function (c) { io.observe(c); });
    return function () { io.disconnect(); };
  }

  // ---------- Efectos que necesitan JS ----------
  function initGlass(section) {
    var glass = section.querySelector("[data-glass]");
    if (!glass || matchMedia("(hover: none)").matches) return;
    window.addEventListener("pointermove", function (e) {
      var r = glass.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var mx = clamp((e.clientX - r.left) / r.width * 2 - 1, -1.2, 1.2);
      glass.style.setProperty("--mx", mx.toFixed(3));
    }, { passive: true });
  }

  function initEmbers(section) {
    var canvas = section.querySelector("[data-embers]");
    if (!canvas || reduced) return;
    var ctx = canvas.getContext("2d");
    var cat = canvas.closest(".cat");
    var parts = [], raf = 0, w = 0, h = 0, dpr = Math.min(devicePixelRatio || 1, 2);
    function size() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn() {
      return { x: w * (0.25 + Math.random() * 0.5), y: h * (0.62 + Math.random() * 0.25), vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.35 + Math.random() * 0.8), life: 0, max: 90 + Math.random() * 120, r: 0.8 + Math.random() * 1.8 };
    }
    function tick() {
      raf = 0;
      if (!cat.classList.contains("is-active")) return;
      ctx.clearRect(0, 0, w, h);
      if (parts.length < 46) parts.push(spawn());
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i];
        p.life++; p.x += p.vx + Math.sin((p.life + i) * 0.05) * 0.25; p.y += p.vy;
        var t = p.life / p.max;
        if (t >= 1) { parts.splice(i, 1); continue; }
        ctx.globalAlpha = Math.sin(t * Math.PI) * 0.9;
        ctx.fillStyle = t < 0.5 ? "#f2b38c" : "#e27b69";
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 - t * 0.5), 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    }
    var visible = false;
    new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) { size(); if (!raf) raf = requestAnimationFrame(tick); } })
      .observe(canvas);
    new MutationObserver(function () { if (visible && !raf) { size(); raf = requestAnimationFrame(tick); } })
      .observe(cat, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", function () { if (visible) size(); });
  }

  ns.productos = {
    init: function () {
      var section = document.querySelector("[data-deck-section]");
      if (!section) return;
      initGlass(section);
      initEmbers(section);

      var canPin = !!(window.gsap && window.ScrollTrigger);
      if (canPin && gsap.matchMedia) {
        var mm = gsap.matchMedia();
        mm.add("(min-width: 960px)", function () { return mountDeck(section); });
        mm.add("(max-width: 959px)", function () { return mountList(section); });
      } else {
        mountList(section);
      }
    }
  };
})();
