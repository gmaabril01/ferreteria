/* Núcleo 3D: escenarios Three.js y tornillería modelada por código (sin modelos externos).
   Script clásico: usa window.THREE (lib/three.bundle.min.js) y publica window.__JLC__.three */
(function () {
  "use strict";

  var T = window.THREE;
  var ns = (window.__JLC__ = window.__JLC__ || {});
  if (!T) return;

  var TAU = Math.PI * 2;
  var mobile = window.innerWidth < 900 || /Mobi|Android/i.test(navigator.userAgent);

  // ---------- Un único bucle de animación para todos los escenarios ----------
  var stages = [];
  var rafId = 0;
  var last = performance.now(), elapsed = 0;
  function loop() {
    rafId = 0;
    var now = performance.now();
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now; elapsed += dt;
    var t = elapsed;
    var any = false;
    for (var i = 0; i < stages.length; i++) {
      var s = stages[i];
      if (!s.visible || s.disposed) continue;
      any = true;
      for (var j = 0; j < s.updaters.length; j++) s.updaters[j](t, dt);
      s.renderer.render(s.scene, s.camera);
    }
    if (any) rafId = requestAnimationFrame(loop);
  }
  function wake() { if (!rafId) { last = performance.now(); rafId = requestAnimationFrame(loop); } }

  // ---------- Escenario ----------
  function createStage(host, opts) {
    opts = opts || {};
    var canvas = host.tagName === "CANVAS" ? host : host.appendChild(document.createElement("canvas"));
    var box = host.tagName === "CANVAS" ? host.parentElement : host;
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: !mobile || opts.antialias, alpha: true, powerPreference: "high-performance" });
    // Móvil: menos píxeles que pintar por fotograma para que el 3D vaya fluido.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : (opts.maxDpr || 2)));
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = opts.exposure || 1;

    var scene = new T.Scene();
    var pmrem = new T.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new T.RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = opts.envIntensity == null ? 0.9 : opts.envIntensity;
    pmrem.dispose();

    var camera = new T.PerspectiveCamera(opts.fov || 35, 1, 0.1, 100);
    var stage = { renderer: renderer, scene: scene, camera: camera, canvas: canvas, updaters: [], visible: false, disposed: false,
      width: 1, height: 1, onResize: null };

    function resize() {
      var w = Math.max(1, box.clientWidth), h = Math.max(1, box.clientHeight);
      stage.width = w; stage.height = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      if (stage.onResize) stage.onResize(w, h);
      if (!stage.visible) renderer.render(scene, camera);
    }
    new ResizeObserver(resize).observe(box);
    resize();

    new IntersectionObserver(function (entries) {
      stage.visible = entries[0].isIntersecting;
      if (stage.visible) wake();
    }, { rootMargin: "80px 0px" }).observe(box);

    stage.onFrame = function (fn) { stage.updaters.push(fn); };
    stage.resize = resize;
    stages.push(stage);
    return stage;
  }

  // ---------- Luces de taller ----------
  function workshopLights(scene, opts) {
    opts = opts || {};
    var key = new T.DirectionalLight(0xfff1e2, opts.key || 2.2);
    key.position.set(-4, 6, 5);
    var rim = new T.DirectionalLight(0xff5a3c, opts.rim || 2.4);
    rim.position.set(5, 2.5, -4);
    var fill = new T.HemisphereLight(0xd8d2ca, 0x1a1512, opts.fill || 0.35);
    scene.add(key, rim, fill);
    return { key: key, rim: rim, fill: fill };
  }

  // ---------- Materiales ----------
  var mats = null;
  function materials() {
    if (mats) return mats;
    mats = {
      zinc: new T.MeshStandardMaterial({ color: 0xc3c7cc, metalness: 1, roughness: 0.32, vertexColors: true }),
      steel: new T.MeshStandardMaterial({ color: 0xd4d7db, metalness: 1, roughness: 0.2, vertexColors: true }),
      brass: new T.MeshStandardMaterial({ color: 0xb88a4a, metalness: 1, roughness: 0.3, vertexColors: true }),
      blackOxide: new T.MeshStandardMaterial({ color: 0x2c2c30, metalness: 0.85, roughness: 0.42, vertexColors: true }),
      redPaint: new T.MeshPhysicalMaterial({ color: 0x96281c, metalness: 0.25, roughness: 0.4, clearcoat: 1, clearcoatRoughness: 0.18 }),
      redSoft: new T.MeshStandardMaterial({ color: 0x7c241a, metalness: 0.2, roughness: 0.55 }),
      blackPlastic: new T.MeshStandardMaterial({ color: 0x151515, metalness: 0.05, roughness: 0.62 }),
      darkMetal: new T.MeshStandardMaterial({ color: 0x3a3b3e, metalness: 0.9, roughness: 0.35 }),
      chrome: new T.MeshStandardMaterial({ color: 0xe6e8ea, metalness: 1, roughness: 0.12 })
    };
    return mats;
  }

  // ---------- Utilidades de geometría ----------
  function paint(geo, shade) {
    var n = geo.attributes.position.count;
    var c = new Float32Array(n * 3);
    for (var i = 0; i < c.length; i++) c[i] = shade;
    geo.setAttribute("color", new T.BufferAttribute(c, 3));
    return geo;
  }
  function clean(geo) {
    // Deja solo posición, normal, uv y color para poder fusionar piezas.
    ["tangent", "uv1", "uv2"].forEach(function (k) { if (geo.attributes[k]) geo.deleteAttribute(k); });
    return geo.index ? geo.toNonIndexed() : geo;
  }
  function merge(list) {
    var g = T.mergeGeometries(list.map(clean), false);
    g.computeBoundingBox();
    var c = new T.Vector3();
    g.boundingBox.getCenter(c);
    g.translate(-c.x, -c.y, -c.z);
    g.computeBoundingSphere();
    return g;
  }

  // Hélice de la rosca (Three.js usa clases ES: se extiende con class).
  class Helix extends T.Curve {
    constructor(radius, pitch, length, y0, taper) {
      super();
      this.radius = radius; this.pitch = pitch; this.length = length; this.y0 = y0; this.taper = taper || 0;
    }
    getPoint(t, target) {
      var p = target || new T.Vector3();
      var turns = this.length / this.pitch;
      var a = t * turns * TAU;
      var k = this.taper ? Math.min(1, (1 - t) / this.taper) : 1;
      var r = this.radius * (0.35 + 0.65 * k);
      return p.set(Math.cos(a) * r, this.y0 - t * this.length, Math.sin(a) * r);
    }
  }

  function thread(radius, pitch, length, y0, tube, taper) {
    var curve = new Helix(radius, pitch, length, y0, taper);
    var segs = Math.max(24, Math.round(length / pitch * (mobile ? 12 : 18)));
    return paint(new T.TubeGeometry(curve, segs, tube, mobile ? 4 : 6, false), 1);
  }

  // ---------- Piezas ----------
  function screwGeometry(o) {
    o = o || {};
    var L = o.length || 2.2, r = o.radius || 0.15;
    var head = paint(new T.LatheGeometry([
      new T.Vector2(0.001, 0), new T.Vector2(0.37, 0), new T.Vector2(0.39, 0.05), new T.Vector2(0.37, 0.15),
      new T.Vector2(0.3, 0.25), new T.Vector2(0.16, 0.3), new T.Vector2(0.001, 0.31)
    ], 28), 1);
    var slotA = paint(new T.BoxGeometry(0.44, 0.08, 0.075), 0.12); slotA.translate(0, 0.29, 0);
    var slotB = paint(new T.BoxGeometry(0.075, 0.08, 0.44), 0.12); slotB.translate(0, 0.29, 0);
    var shank = paint(new T.CylinderGeometry(r, r * 0.92, L, 20, 1), 0.9); shank.translate(0, -L / 2, 0);
    var tip = paint(new T.CylinderGeometry(r * 0.92, 0.012, 0.4, 20, 1), 0.9); tip.translate(0, -L - 0.2, 0);
    var th = thread(r + 0.018, 0.13, L + 0.25, -0.18, 0.042, 0.18);
    return merge([head, slotA, slotB, shank, tip, th]);
  }

  function boltGeometry(o) {
    o = o || {};
    var L = o.length || 1.9, r = o.radius || 0.19;
    var head = paint(new T.CylinderGeometry(0.36, 0.36, 0.26, 6, 1), 1); head.translate(0, 0.13, 0);
    var chamfer = paint(new T.CylinderGeometry(0.28, 0.35, 0.05, 6, 1), 1); chamfer.translate(0, 0.285, 0);
    var face = paint(new T.CylinderGeometry(0.33, 0.33, 0.035, 28, 1), 0.85); face.translate(0, -0.015, 0);
    var shank = paint(new T.CylinderGeometry(r, r, L, 22, 1), 0.92); shank.translate(0, -L / 2, 0);
    var end = paint(new T.CylinderGeometry(r, r * 0.8, 0.06, 22, 1), 0.92); end.translate(0, -L - 0.03, 0);
    var th = thread(r + 0.012, 0.085, L * 0.62, -L * 0.38, 0.03, 0.04);
    return merge([head, chamfer, face, shank, end, th]);
  }

  function hexShape(R, holeR) {
    var s = new T.Shape();
    for (var i = 0; i < 6; i++) {
      var a = i / 6 * TAU + Math.PI / 6;
      if (i === 0) s.moveTo(Math.cos(a) * R, Math.sin(a) * R); else s.lineTo(Math.cos(a) * R, Math.sin(a) * R);
    }
    s.closePath();
    if (holeR) { var h = new T.Path(); h.absarc(0, 0, holeR, 0, TAU, true); s.holes.push(h); }
    return s;
  }

  function nutGeometry(o) {
    o = o || {};
    var R = o.size || 0.4;
    var g = new T.ExtrudeGeometry(hexShape(R, R * 0.48), { depth: R * 0.62, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 2, curveSegments: 24 });
    g.rotateX(-Math.PI / 2);
    var inner = thread(R * 0.48 - 0.01, 0.07, R * 0.62, R * 0.62, 0.02, 0);
    return merge([paint(g, 1), inner]);
  }

  function washerGeometry(o) {
    o = o || {};
    var outer = o.outer || 0.42, inner = o.inner || 0.19;
    var s = new T.Shape(); s.absarc(0, 0, outer, 0, TAU, false);
    var h = new T.Path(); h.absarc(0, 0, inner, 0, TAU, true); s.holes.push(h);
    var g = new T.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 1, curveSegments: 36 });
    g.rotateX(-Math.PI / 2);
    return merge([paint(g, 1)]);
  }

  // Engranaje: los dientes están centrados en los ángulos k·2π/z (necesario para engranar).
  function gearGeometry(o) {
    o = o || {};
    var z = o.teeth || 16, m = o.module || 0.14, depth = o.depth || 0.28;
    var R = m * z / 2, Ro = R + m, Rr = R - 1.2 * m;
    var pitchA = TAU / z;
    var s = new T.Shape();
    for (var k = 0; k < z; k++) {
      var a = k * pitchA;
      var pts = [
        [a - pitchA * 0.5, Rr], [a - pitchA * 0.3, Rr], [a - pitchA * 0.17, Ro], [a + pitchA * 0.17, Ro], [a + pitchA * 0.3, Rr]
      ];
      pts.forEach(function (p, i) {
        var x = Math.cos(p[0]) * p[1], y = Math.sin(p[0]) * p[1];
        if (k === 0 && i === 0) s.moveTo(x, y); else s.lineTo(x, y);
      });
    }
    s.closePath();
    var hub = new T.Path(); hub.absarc(0, 0, R * 0.2, 0, TAU, true); s.holes.push(hub);
    var windows = o.windows == null ? (z >= 14 ? 5 : 0) : o.windows;
    for (var w = 0; w < windows; w++) {
      var wa = w / windows * TAU + 0.3;
      var hp = new T.Path();
      hp.absarc(Math.cos(wa) * R * 0.56, Math.sin(wa) * R * 0.56, R * 0.17, 0, TAU, true);
      s.holes.push(hp);
    }
    var g = new T.ExtrudeGeometry(s, { depth: depth, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.025, bevelSegments: 2, curveSegments: 20 });
    g.translate(0, 0, -depth / 2);
    g.computeVertexNormals();
    return { geometry: g, pitchRadius: R, teeth: z };
  }

  // Llave combinada: boca fija en un extremo, estrella en el otro.
  function wrenchGeometry() {
    var parts = [];
    var d = 0.16;
    var handle = new T.Shape();
    handle.moveTo(-1.55, -0.2); handle.lineTo(1.55, -0.16); handle.lineTo(1.55, 0.16); handle.lineTo(-1.55, 0.2); handle.closePath();
    parts.push(new T.ExtrudeGeometry(handle, { depth: d, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3 }));

    // Boca abierta (forma de «C»), girada 15°.
    var open = new T.Shape();
    var cx = 2.0, R = 0.62, r = 0.3, gap = 0.62, rot = 0.26;
    var a0 = gap + rot, a1 = TAU - gap + rot;
    open.absarc(cx, 0, R, a0, a1, false);
    open.lineTo(cx + Math.cos(a1) * r * 1.05, Math.sin(a1) * r * 1.05);
    open.absarc(cx, 0, r, a1, a0, true);
    open.closePath();
    parts.push(new T.ExtrudeGeometry(open, { depth: d, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 28 }));

    // Estrella (anillo) en el otro extremo.
    var ring = new T.Shape(); ring.absarc(-2.0, 0, 0.55, 0, TAU, false);
    var hole = new T.Path();
    for (var i = 0; i <= 12; i++) {
      var a = i / 12 * TAU, rr = i % 2 ? 0.25 : 0.3;
      if (i === 0) hole.moveTo(-2.0 + Math.cos(a) * rr, Math.sin(a) * rr); else hole.lineTo(-2.0 + Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ring.holes.push(hole);
    parts.push(new T.ExtrudeGeometry(ring, { depth: d, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 28 }));

    var g = T.mergeGeometries(parts.map(function (p) { return p.index ? p.toNonIndexed() : p; }), false);
    g.translate(0, 0, -d / 2);
    g.computeVertexNormals();
    return g;
  }

  // ---------- Sombra de contacto suave (textura radial) ----------
  function blobShadow(size, strength) {
    var c = document.createElement("canvas");
    c.width = c.height = 128;
    var x = c.getContext("2d");
    var g = x.createRadialGradient(64, 64, 4, 64, 64, 64);
    g.addColorStop(0, "rgba(0,0,0," + (strength || 0.75) + ")");
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    var tex = new T.CanvasTexture(c);
    var m = new T.Mesh(new T.PlaneGeometry(size, size * 0.6), new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  // ---------- Aleatoriedad reproducible ----------
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  ns.three = {
    mobile: mobile,
    createStage: createStage,
    workshopLights: workshopLights,
    materials: materials,
    screwGeometry: screwGeometry,
    boltGeometry: boltGeometry,
    nutGeometry: nutGeometry,
    washerGeometry: washerGeometry,
    gearGeometry: gearGeometry,
    wrenchGeometry: wrenchGeometry,
    blobShadow: blobShadow,
    rng: rng,
    wake: wake
  };
})();
