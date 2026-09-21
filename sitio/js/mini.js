/* Escenas 3D pequeñas: engranajes («Sobre nosotros») y llave con perno («Contacto»). */
(function () {
  "use strict";

  var T = window.THREE;
  var ns = (window.__JLC__ = window.__JLC__ || {});
  var core = ns.three;
  if (!T || !core) return;

  var PI = Math.PI;

  // Progreso de scroll de un elemento: 0 cuando entra por abajo, 1 cuando sale por arriba.
  function scrollProgress(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight;
    return Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
  }

  // ---------- Engranajes ----------
  function gears(el, opts) {
    var stage = core.createStage(el, { fov: 30, exposure: 1.05, envIntensity: 1 });
    var scene = stage.scene, camera = stage.camera;
    var m = core.materials();
    core.workshopLights(scene, { key: 2.2, rim: 2.6, fill: 0.45 });
    camera.position.set(-0.3, 0.2, 11.8);
    camera.lookAt(-0.3, 0.45, 0);

    var mod = 0.15;
    var specs = [
      { teeth: 20, mat: m.redPaint, depth: 0.34 },
      { teeth: 13, mat: m.chrome, depth: 0.3 },
      { teeth: 9, mat: m.blackOxide, depth: 0.42, windows: 0 }
    ];
    var group = new T.Group();
    group.rotation.set(-0.38, 0.5, 0.06);
    scene.add(group);

    var list = specs.map(function (s) {
      var g = core.gearGeometry({ teeth: s.teeth, module: mod, depth: s.depth, windows: s.windows });
      var mesh = new T.Mesh(g.geometry, s.mat);
      group.add(mesh);
      // Eje con tornillo en el centro
      var axle = new T.Mesh(core.boltGeometry({ length: 0.5, radius: 0.09 }), m.zinc);
      axle.scale.setScalar(0.55);
      axle.rotation.x = PI / 2;
      axle.position.z = s.depth / 2 + 0.12;
      mesh.add(axle);
      return { mesh: mesh, z: s.teeth, R: g.pitchRadius };
    });

    // Posiciones: cada par a distancia R1 + R2, con ángulos de engrane α y β.
    var alpha = 0.32, beta = 2.05;
    var c0 = new T.Vector2(-1.2, -0.25);
    var c1 = new T.Vector2(c0.x + Math.cos(alpha) * (list[0].R + list[1].R), c0.y + Math.sin(alpha) * (list[0].R + list[1].R));
    var c2 = new T.Vector2(c1.x + Math.cos(beta) * (list[1].R + list[2].R), c1.y + Math.sin(beta) * (list[1].R + list[2].R));
    [c0, c1, c2].forEach(function (c, i) { list[i].mesh.position.set(c.x, c.y, 0); });

    // Fases iniciales para que los dientes encajen (diente de uno frente al hueco del otro).
    var z0 = list[0].z, z1 = list[1].z, z2 = list[2].z;
    var th0 = alpha;
    var th1 = alpha + PI + PI / z1 - (th0 - alpha) * z0 / z1;
    var th2 = beta + PI + PI / z2 - (th1 - beta) * z1 / z2;

    var turn = 0;
    stage.onFrame(function (t, dt) {
      var speed = opts && opts.reduced ? 0.12 : 0.28;
      var target = t * speed + scrollProgress(el) * 3.2;
      turn += (target - turn) * Math.min(1, dt * 4);
      list[0].mesh.rotation.z = th0 + turn;
      list[1].mesh.rotation.z = th1 - turn * z0 / z1;
      list[2].mesh.rotation.z = th2 + turn * z0 / z2;
      group.rotation.y = 0.5 + Math.sin(t * 0.3) * 0.08;
    });
    return stage;
  }

  // ---------- Llave apretando un perno ----------
  function wrench(el, opts) {
    var stage = core.createStage(el, { fov: 30, exposure: 1.1, envIntensity: 1.1 });
    var scene = stage.scene, camera = stage.camera;
    var m = core.materials();
    core.workshopLights(scene, { key: 2.6, rim: 1.6, fill: 0.5 });
    camera.position.set(0, 0.6, 9);
    camera.lookAt(0, 0, 0);

    var rig = new T.Group();
    rig.rotation.set(-0.7, 0, 0);
    rig.scale.setScalar(0.66);
    rig.position.set(1.05, -0.1, 0);
    scene.add(rig);

    // Perno vertical con su tuerca; la boca de la llave abraza la cabeza del perno.
    var bolt = new T.Mesh(core.boltGeometry({ length: 1.6, radius: 0.19 }), m.zinc);
    bolt.rotation.x = PI / 2;
    var nut = new T.Mesh(core.nutGeometry({ size: 0.4 }), m.brass);
    nut.rotation.x = PI / 2;
    nut.position.z = -0.5;
    var boltSpin = new T.Group();
    boltSpin.add(bolt, nut);
    rig.add(boltSpin);

    var key = new T.Mesh(core.wrenchGeometry(), m.chrome);
    key.position.set(-2.0, 0, 0.8);
    var keyPivot = new T.Group();
    keyPivot.add(key);
    keyPivot.position.set(0, 0, 0);
    rig.add(keyPivot);

    var plate = new T.Mesh(new T.CylinderGeometry(0.85, 0.85, 0.06, 48), m.darkMetal);
    plate.rotation.x = PI / 2;
    plate.position.z = -0.95;
    rig.add(plate);

    var mouse = new T.Vector2(), mouseS = new T.Vector2();
    window.addEventListener("pointermove", function (e) {
      mouse.set(e.clientX / window.innerWidth * 2 - 1, e.clientY / window.innerHeight * 2 - 1);
    }, { passive: true });

    var turn = 0;
    stage.onFrame(function (t, dt) {
      mouseS.lerp(mouse, Math.min(1, dt * 2.5));
      var p = scrollProgress(el);
      var target = 0.35 + p * 1.5 + Math.sin(t * 0.6) * (opts && opts.reduced ? 0 : 0.04);
      turn += (target - turn) * Math.min(1, dt * 5);
      keyPivot.rotation.z = turn;
      boltSpin.rotation.z = turn;
      rig.rotation.x = -0.7 + mouseS.y * 0.12;
      rig.rotation.y = mouseS.x * 0.25;
    });
    return stage;
  }

  ns.mini = { gears: gears, wrench: wrench };
})();
