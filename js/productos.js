/* «Lo que hacemos»: fichas de categoría.
   Cada ficha se despierta al entrar en pantalla y entonces arrancan sus efectos
   (el agua, las brasas). Sin scroll secuestrado ni secciones fijadas. */
(function () {
  "use strict";

  var ns = (window.__JLC__ = window.__JLC__ || {});
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- Activación por visibilidad ----------
  function mountList(section) {
    var cats = Array.prototype.slice.call(section.querySelectorAll(".cat"));
    if (!("IntersectionObserver" in window)) { cats.forEach(function (c) { c.classList.add("is-active"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-active"); io.unobserve(e.target); } });
    }, { threshold: 0.01, rootMargin: "0px 0px -14% 0px" });
    cats.forEach(function (c) { io.observe(c); });
  }

  // ---------- Efectos que necesitan JS ----------
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
        ctx.fillStyle = t < 0.5 ? "#f2b38c" : "#e8836f";
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
      initEmbers(section);
      mountList(section);
    }
  };
})();
