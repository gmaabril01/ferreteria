/* Intro: una caja de herramientas de voladizo que se abre con el scroll.
   0–12 %   se sueltan los cierres
   8–34 %   las dos tapas giran sobre su bisagra exterior
   20–58 %  las bandejas salen sobre sus brazos paralelos (las superiores llevan la tapa)
   40–78 %  la tornillería sale volando y la cámara se aleja
   70–100 % la caja baja y la tornillería queda flotando como fondo del inicio */
(function () {
  "use strict";

  var T = window.THREE;
  var ns = (window.__JLC__ = window.__JLC__ || {});
  var core = ns.three;
  if (!T || !core) return;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function outCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function inOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // Medidas de la caja (unidades de escena)
  var W = 3.2, H = 1.2, D = 1.6, LID_T = 0.13, TRAY_W = 1.5, TRAY_D = 1.42, TRAY_H = 0.28;

  function trayMesh(m) {
    var g = new T.Group();
    var wall = 0.04;
    var bottom = new T.Mesh(new T.BoxGeometry(TRAY_W, wall, TRAY_D), m.blackPlastic);
    bottom.position.y = -TRAY_H / 2 + wall / 2;
    g.add(bottom);
    [TRAY_D / 2 - wall / 2, -TRAY_D / 2 + wall / 2].forEach(function (z) {
      var w = new T.Mesh(new T.BoxGeometry(TRAY_W, TRAY_H, wall), m.blackPlastic);
      w.position.z = z;
      g.add(w);
    });
    [TRAY_W / 2 - wall / 2, -TRAY_W / 2 + wall / 2, 0].forEach(function (x, i) {
      var w = new T.Mesh(new T.BoxGeometry(wall, i === 2 ? TRAY_H * 0.8 : TRAY_H, TRAY_D), m.blackPlastic);
      w.position.set(x, i === 2 ? -TRAY_H * 0.1 : 0, 0);
      g.add(w);
    });
    return g;
  }

  function fillTray(tray, geo, mat, count, scale, seed, lying) {
    var r = core.rng(seed);
    for (var i = 0; i < count; i++) {
      var mesh = new T.Mesh(geo, mat);
      mesh.scale.setScalar(scale);
      var col = i % 2 ? 1 : -1;
      mesh.position.set(col * (0.18 + r() * 0.36), -TRAY_H / 2 + 0.1, (r() - 0.5) * (TRAY_D - 0.4));
      if (lying) { mesh.rotation.z = Math.PI / 2; mesh.rotation.y = r() * Math.PI; mesh.position.y += 0.04; }
      else { mesh.rotation.y = r() * Math.PI; mesh.rotation.x = (r() - 0.5) * 0.3; }
      tray.add(mesh);
    }
  }

  function init(opts) {
    var canvas = opts.canvas;
    var mobile = !!opts.mobile;
    var stage;
    try { stage = core.createStage(canvas, { fov: 34, exposure: 1.05, envIntensity: 0.85 }); }
    catch (e) { console.warn("[intro] WebGL", e); return null; }

    var scene = stage.scene, camera = stage.camera;
    var m = core.materials();
    scene.fog = new T.FogExp2(0x141210, 0.042);
    core.workshopLights(scene, { key: 2.4, rim: 2.8, fill: 0.4 });
    var spot = new T.SpotLight(0xffe8d4, 30, 18, 0.5, 0.6, 1.4);
    spot.position.set(0, 7, 3);
    spot.target.position.set(0, 0.6, 0);
    scene.add(spot, spot.target);

    // ---------- Cuerpo ----------
    var box = new T.Group();
    scene.add(box);
    // Caja hueca: suelo, cuatro paredes pintadas y un forro oscuro por dentro.
    var WALL = 0.07;
    var floor = new T.Mesh(new T.RoundedBoxGeometry(W, 0.12, D, 3, 0.04), m.redPaint);
    floor.position.y = 0.06;
    var base = new T.Mesh(new T.RoundedBoxGeometry(W + 0.06, 0.14, D + 0.06, 3, 0.04), m.blackPlastic);
    base.position.y = 0.05;
    box.add(floor, base);
    [D / 2 - WALL / 2, -D / 2 + WALL / 2].forEach(function (z) {
      var wall = new T.Mesh(new T.RoundedBoxGeometry(W, H, WALL, 3, 0.03), m.redPaint);
      wall.position.set(0, H / 2, z);
      box.add(wall);
    });
    [W / 2 - WALL / 2, -W / 2 + WALL / 2].forEach(function (x) {
      var wall = new T.Mesh(new T.RoundedBoxGeometry(WALL, H, D - 2 * WALL + 0.02, 3, 0.03), m.redPaint);
      wall.position.set(x, H / 2, 0);
      box.add(wall);
    });
    var liner = new T.Mesh(new T.BoxGeometry(W - 2 * WALL, 0.01, D - 2 * WALL), m.blackPlastic);
    liner.position.y = 0.125;
    box.add(liner);
    // Canto negro superior
    [[0, D / 2 - 0.02, W + 0.02, 0.05], [0, -D / 2 + 0.02, W + 0.02, 0.05]].forEach(function (s) {
      var b = new T.Mesh(new T.BoxGeometry(s[2], 0.07, s[3]), m.blackPlastic);
      b.position.set(s[0], H - 0.035, s[1]);
      box.add(b);
    });
    [W / 2 - 0.02, -W / 2 + 0.02].forEach(function (x) {
      var b = new T.Mesh(new T.BoxGeometry(0.05, 0.07, D), m.blackPlastic);
      b.position.set(x, H - 0.035, 0);
      box.add(b);
    });

    // Herramientas tumbadas en el compartimento principal
    var driver = new T.Group();
    var drvHandle = new T.Mesh(new T.CylinderGeometry(0.11, 0.13, 0.7, 18), m.redSoft);
    var drvGrip = new T.Mesh(new T.CylinderGeometry(0.125, 0.125, 0.18, 18), m.blackPlastic);
    var drvShaft = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 1.1, 12), m.chrome);
    drvHandle.position.y = 0.35; drvGrip.position.y = 0.2; drvShaft.position.y = -0.5;
    driver.add(drvHandle, drvGrip, drvShaft);
    driver.position.set(-0.3, 0.26, 0.32); driver.rotation.set(0, 0.25, Math.PI / 2);
    var hammer = new T.Group();
    var hHandle = new T.Mesh(new T.CylinderGeometry(0.06, 0.07, 1.6, 14), m.blackPlastic);
    var hHead = new T.Mesh(new T.BoxGeometry(0.55, 0.18, 0.18), m.darkMetal);
    hHead.position.y = 0.8;
    hammer.add(hHandle, hHead);
    hammer.position.set(0.1, 0.24, -0.3); hammer.rotation.set(0, -0.2, -Math.PI / 2);
    box.add(driver, hammer);

    // ---------- Cierres frontales ----------
    var latches = [-0.62, 0.62].map(function (x) {
      var pivot = new T.Group();
      pivot.position.set(x, H - 0.3, D / 2 + 0.02);
      var plate = new T.Mesh(new T.BoxGeometry(0.34, 0.4, 0.05), m.chrome);
      plate.position.set(0, 0.2, 0.02);
      var rivet = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, 0.07, 12), m.darkMetal);
      rivet.rotation.x = Math.PI / 2;
      rivet.position.set(0, 0.03, 0.05);
      pivot.add(plate, rivet);
      box.add(pivot);
      return pivot;
    });

    // ---------- Bandejas en voladizo (paralelogramo) ----------
    var screwG = core.screwGeometry(), boltG = core.boltGeometry(), nutG = core.nutGeometry(), washerG = core.washerGeometry();
    var trays = [];

    function makeTray(side, tier, fill) {
      var restY = tier === 0 ? H - TRAY_H / 2 - 0.02 : H - TRAY_H * 1.5 - 0.06;
      var rest = new T.Vector3(side * (TRAY_W / 2 + 0.03), restY, 0);
      var L = tier === 0 ? 1.05 : 0.72;
      var phi0 = tier === 0 ? 2.8 : 2.62;
      var phi1 = tier === 0 ? 0.55 : 0.8;
      var tray = trayMesh(m);
      tray.position.copy(rest);
      box.add(tray);
      fill(tray);

      var lid = null;
      if (tier === 0) {
        // Tapa con bisagra en el canto exterior de la bandeja superior
        lid = new T.Group();
        lid.position.set(side * (TRAY_W / 2 + 0.02), TRAY_H / 2 + 0.02, 0);
        var plate = new T.Mesh(new T.RoundedBoxGeometry(W / 2 - 0.01, LID_T, D, 3, 0.05), m.redPaint);
        plate.position.set(-side * (W / 4 - 0.01), LID_T / 2, 0);
        var handle = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([
          new T.Vector3(0, 0, -0.42), new T.Vector3(0, 0.16, -0.3), new T.Vector3(0, 0.2, 0),
          new T.Vector3(0, 0.16, 0.3), new T.Vector3(0, 0, 0.42)
        ]), 32, 0.045, 10, false), m.blackPlastic);
        handle.position.set(-side * (W / 4 - 0.01), LID_T, 0);
        lid.add(plate, handle);
        tray.add(lid);
      }

      // Dos brazos por bandeja, delante y detrás
      var angle0 = side > 0 ? phi0 : Math.PI - phi0;
      var arms = [D / 2 - 0.02, -D / 2 + 0.02].map(function (z) {
        var attach = new T.Vector3(rest.x - side * (TRAY_W / 2 - 0.2), rest.y - 0.02, z);
        var pivot = new T.Group();
        pivot.position.set(attach.x - L * Math.cos(angle0), attach.y - L * Math.sin(angle0), z);
        var arm = new T.Mesh(new T.BoxGeometry(L, 0.07, 0.035), m.darkMetal);
        arm.position.x = L / 2;
        var pin = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 0.06, 12), m.chrome);
        pin.rotation.x = Math.PI / 2;
        pivot.add(arm, pin);
        box.add(pivot);
        return pivot;
      });
      trays.push({ tray: tray, lid: lid, rest: rest, side: side, L: L, phi0: phi0, phi1: phi1, tier: tier, arms: arms });
    }
    makeTray(1, 0, function (t) { fillTray(t, screwG, m.zinc, 6, 0.22, 11, true); });
    makeTray(-1, 0, function (t) { fillTray(t, nutG, m.brass, 7, 0.28, 12, false); });
    makeTray(1, 1, function (t) { fillTray(t, boltG, m.blackOxide, 4, 0.24, 13, true); });
    makeTray(-1, 1, function (t) { fillTray(t, washerG, m.zinc, 8, 0.3, 14, false); });

    var shadow = core.blobShadow(6.4, 0.8);
    shadow.position.y = 0.005;
    box.add(shadow);

    // ---------- Tornillería que sale volando ----------
    var r = core.rng(2026);
    var perType = mobile ? 7 : 13;
    var kinds = [
      { geo: screwG, mat: m.zinc, scale: 0.34 },
      { geo: boltG, mat: m.blackOxide, scale: 0.36 },
      { geo: nutG, mat: m.brass, scale: 0.42 },
      { geo: washerG, mat: m.zinc, scale: 0.46 }
    ];
    var instances = [];
    var flyers = [];
    var dummy = new T.Object3D();
    kinds.forEach(function (k, ki) {
      var inst = new T.InstancedMesh(k.geo, k.mat, perType);
      inst.frustumCulled = false;
      scene.add(inst);
      instances.push(inst);
      for (var i = 0; i < perType; i++) {
        var ang = r() * Math.PI * 2;
        var rad = 2.8 + r() * 3.4;
        var tgt = new T.Vector3(Math.cos(ang) * rad * 1.3, 0.8 + r() * 3.6, -2.8 + Math.sin(ang) * rad * 0.7);
        if (Math.abs(tgt.x) < 1.5 && tgt.z > -1.2) tgt.x += tgt.x < 0 ? -1.5 : 1.5;
        // A la izquierda está el texto del inicio: esas piezas suben por encima de él o se alejan al fondo.
        if (!mobile && tgt.x < 0.5) { if (r() < 0.6) tgt.y = 3.6 + r() * 1.8; else tgt.z = -5.5 - r() * 3; }
        if (mobile) tgt.y = Math.max(tgt.y, 2.6 + r() * 2.4);
        flyers.push({
          inst: inst, index: i, scale: k.scale * (0.85 + r() * 0.4),
          start: new T.Vector3((r() - 0.5) * (W - 1), 0.45 + r() * 0.55, (r() - 0.5) * (D - 0.7)),
          target: tgt,
          rot: new T.Euler(r() * 6.28, r() * 6.28, r() * 6.28),
          spin: new T.Vector3((r() - 0.5) * 1.3, (r() - 0.5) * 1.3, (r() - 0.5) * 1.3),
          delay: r() * 0.35, phase: r() * 6.28, bob: 0.08 + r() * 0.14
        });
      }
    });

    // ---------- Cámara ----------
    var camKeys = [
      { p: 0.0, pos: [0, 2.3, 7.6], look: [0, 0.75, 0], off: 0 },
      { p: 0.32, pos: [2.2, 3.3, 7.4], look: [0, 1.0, 0], off: 0 },
      { p: 0.6, pos: [-1.4, 4.0, 8.4], look: [0, 1.1, 0], off: mobile ? 0 : 0.03 },
      { p: 1.0, pos: [0.2, 3.5, 11.2], look: [0, 1.8, 0], off: mobile ? 0 : 0.14 }
    ];
    var camPos = new T.Vector3(), camLook = new T.Vector3();
    function cameraAt(p) {
      var i = 0;
      while (i < camKeys.length - 2 && p > camKeys[i + 1].p) i++;
      var a = camKeys[i], b = camKeys[i + 1];
      var t = inOut(clamp((p - a.p) / (b.p - a.p), 0, 1));
      camPos.set(lerp(a.pos[0], b.pos[0], t), lerp(a.pos[1], b.pos[1], t), lerp(a.pos[2], b.pos[2], t));
      camLook.set(lerp(a.look[0], b.look[0], t), lerp(a.look[1], b.look[1], t), lerp(a.look[2], b.look[2], t));
      return lerp(a.off, b.off, t);
    }

    function applyScene(p) {
      var pl = smooth(seg(p, 0.02, 0.12));
      latches.forEach(function (l) { l.rotation.x = -1.4 * pl; });
      var pLid = outCubic(seg(p, 0.08, 0.34));
      trays.forEach(function (tr) {
        if (tr.lid) tr.lid.rotation.z = -tr.side * 2.95 * pLid;
        var s = tr.tier === 0 ? inOut(seg(p, 0.2, 0.52)) : inOut(seg(p, 0.3, 0.58));
        var phi = lerp(tr.phi0, tr.phi1, s);
        var dx = (Math.cos(phi) - Math.cos(tr.phi0)) * tr.L;
        var dy = (Math.sin(phi) - Math.sin(tr.phi0)) * tr.L;
        tr.tray.position.set(tr.rest.x + (tr.side > 0 ? dx : -dx), tr.rest.y + dy, tr.rest.z);
        var armAngle = tr.side > 0 ? phi : Math.PI - phi;
        tr.arms.forEach(function (a) { a.rotation.z = armAngle; });
      });
      var pOut = inOut(seg(p, 0.7, 1));
      box.position.set(lerp(0, mobile ? 0 : 1.6, pOut), lerp(0, -3.9, pOut), lerp(0, -1.2, pOut));
      box.rotation.y = lerp(-0.5, -0.22, smooth(seg(p, 0, 0.6))) + lerp(0, -0.18, pOut);
      var sc = lerp(1, mobile ? 0.8 : 0.92, pOut);
      box.scale.setScalar(sc);
    }

    function applyFlyers(p, t) {
      var burst = seg(p, 0.4, 0.78);
      var idle = seg(p, 0.7, 1);
      for (var i = 0; i < flyers.length; i++) {
        var f = flyers[i];
        var k = outCubic(clamp((burst - f.delay * 0.6) / (1 - f.delay * 0.6), 0, 1));
        var sc = k <= 0 ? 0 : f.scale * Math.min(1, k * 3);
        var bob = Math.sin(t * 0.9 + f.phase) * f.bob * idle;
        dummy.position.set(
          lerp(f.start.x, f.target.x, k),
          lerp(f.start.y, f.target.y, k) + Math.sin(k * Math.PI) * 1.3 + bob,
          lerp(f.start.z, f.target.z, k)
        );
        dummy.rotation.set(f.rot.x + f.spin.x * t * (0.25 + k), f.rot.y + f.spin.y * t * (0.25 + k), f.rot.z + f.spin.z * t * 0.35);
        dummy.scale.setScalar(sc);
        dummy.updateMatrix();
        f.inst.setMatrixAt(f.index, dummy.matrix);
      }
      for (var j = 0; j < instances.length; j++) instances[j].instanceMatrix.needsUpdate = true;
    }

    var target = 0, current = 0, lastApplied = -1;
    var mouse = new T.Vector2(), mouseS = new T.Vector2();
    window.addEventListener("pointermove", function (e) {
      mouse.set(e.clientX / window.innerWidth * 2 - 1, e.clientY / window.innerHeight * 2 - 1);
    }, { passive: true });

    stage.onFrame(function (t, dt) {
      current += (target - current) * Math.min(1, dt * 7);
      if (Math.abs(target - current) < 0.0004) current = target;
      mouseS.lerp(mouse, Math.min(1, dt * 3));
      var p = current;
      if (p !== lastApplied) { applyScene(p); lastApplied = p; }
      applyFlyers(p, t);
      var off = cameraAt(p);
      // Pantallas estrechas o verticales: la cámara se aleja para que la caja quepa entera.
      var aspect = stage.width / Math.max(1, stage.height);
      var far = Math.min(2.6, Math.max(1, 1.55 / aspect));
      if (far > 1) camPos.sub(camLook).multiplyScalar(far).add(camLook);
      var hero = seg(p, 0.7, 1);
      camPos.x += mouseS.x * (0.25 + hero * 0.35);
      camPos.y -= mouseS.y * (0.15 + hero * 0.25);
      camera.position.copy(camPos);
      camera.lookAt(camLook);
      var w = stage.width, h = stage.height;
      if (off) camera.setViewOffset(w, h, -w * off, 0, w, h);
      else if (camera.view && camera.view.enabled) camera.clearViewOffset();
    });

    stage.onResize = function () { lastApplied = -1; };
    applyScene(0);
    applyFlyers(0, 0);

    return {
      progress: function (p) { target = clamp(p, 0, 1); core.wake(); },
      stage: stage
    };
  }

  ns.intro = { init: init };
})();
