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
    // Compila los shaders ya (en un momento de reposo), no al llegar a la sección con el scroll.
    stage.renderer.compile(scene, camera);
    return stage;
  }

  // ---------- Caja de herramientas ----------
  // Cerrada, en el rojo y el cromo de la marca. Gira despacio con el scroll: no se abre.
  function toolbox(el, opts) {
    var stage = core.createStage(el, { fov: 28, exposure: 1.02, envIntensity: 1.05 });
    var scene = stage.scene, camera = stage.camera;
    var m = core.materials();
    core.workshopLights(scene, { key: 2.5, rim: 1.9, fill: 0.55 });

    var ALTO = 1.15, ANCHO = 2.9, FONDO = 1.25;
    var EJE = 0.95;                       // altura del eje de giro: el centro de la caja

    // Todo cuelga de un pivote puesto en el centro, para que al girar no se descoloque.
    var pivote = new T.Group();
    pivote.position.y = EJE;
    scene.add(pivote);
    var caja = new T.Group();
    caja.position.y = -EJE;
    pivote.add(caja);

    function bloque(w, h, d, r, mat) {
      return new T.Mesh(new T.RoundedBoxGeometry(w, h, d, 3, r), mat);
    }

    // Cuerpo y tapa
    var cuerpo = bloque(ANCHO, ALTO, FONDO, 0.1, m.redPaint);
    cuerpo.position.y = ALTO / 2;
    caja.add(cuerpo);

    var junta = bloque(ANCHO * 1.004, 0.16, FONDO * 1.004, 0.05, m.darkMetal);
    junta.position.y = ALTO - 0.02;
    caja.add(junta);

    var tapa = bloque(ANCHO * 1.012, 0.36, FONDO * 1.012, 0.11, m.redPaint);
    tapa.position.y = ALTO + 0.2;
    caja.add(tapa);

    var bisagra = new T.Mesh(new T.CylinderGeometry(0.038, 0.038, ANCHO * 0.82, 14), m.chrome);
    bisagra.rotation.z = PI / 2;
    bisagra.position.set(0, ALTO + 0.03, -FONDO / 2 + 0.07);
    caja.add(bisagra);

    // Asa curvada sobre la tapa, con sus dos anclajes
    var curva = new T.CatmullRomCurve3([
      new T.Vector3(-0.66, 0, 0), new T.Vector3(-0.68, 0.3, 0),
      new T.Vector3(0, 0.46, 0),
      new T.Vector3(0.68, 0.3, 0), new T.Vector3(0.66, 0, 0)
    ]);
    var asa = new T.Mesh(new T.TubeGeometry(curva, 56, 0.058, 12, false), m.chrome);
    asa.position.y = ALTO + 0.36;
    caja.add(asa);
    [-0.66, 0.66].forEach(function (x) {
      var anclaje = bloque(0.24, 0.12, 0.3, 0.04, m.darkMetal);
      anclaje.position.set(x, ALTO + 0.37, 0);
      caja.add(anclaje);
    });

    // Cierres cromados en el frente
    [-0.92, 0.92].forEach(function (x) {
      var chapa = bloque(0.34, 0.24, 0.07, 0.04, m.chrome);
      chapa.position.set(x, ALTO + 0.06, FONDO / 2 + 0.015);
      caja.add(chapa);
      var gancho = bloque(0.18, 0.36, 0.06, 0.03, m.chrome);
      gancho.position.set(x, ALTO - 0.14, FONDO / 2 + 0.035);
      caja.add(gancho);
    });

    // Nervio grabado en el frente y los pies
    var nervio = bloque(ANCHO * 0.72, 0.1, 0.05, 0.03, m.redSoft);
    nervio.position.set(0, ALTO * 0.42, FONDO / 2 + 0.01);
    caja.add(nervio);
    [[-1.18, 0.46], [1.18, 0.46], [-1.18, -0.46], [1.18, -0.46]].forEach(function (p) {
      var pie = new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.08, 12), m.blackPlastic);
      pie.position.set(p[0], 0.04, p[1]);
      caja.add(pie);
    });

    // La sombra se queda en el suelo: no acompaña al giro de la caja.
    var sombra = core.blobShadow(4.6, 0.55);
    sombra.position.y = 0.008;
    sombra.scale.set(1, 1.35, 1);
    scene.add(sombra);

    // Encuadre: como la caja gira sobre su centro, basta con la esfera que la envuelve.
    caja.updateMatrixWorld(true);
    var centro = new T.Vector3(0, 0, 0), v = new T.Vector3(), radio = 0;
    caja.traverse(function (o) {
      if (!o.isMesh) return;
      var pos = o.geometry.attributes.position;
      var paso = Math.max(1, Math.floor(pos.count / 120));
      for (var i = 0; i < pos.count; i += paso) {
        v.fromBufferAttribute(pos, i).applyMatrix4(o.matrix).add(caja.position);
        radio = Math.max(radio, v.distanceTo(centro));
      }
    });

    var mira = new T.Vector3(0, EJE, 0);
    var dir = new T.Vector3(0.36, 0.42, 1).normalize();
    function fit() {
      var mitadV = camera.fov * PI / 360;
      var mitadH = Math.atan(Math.tan(mitadV) * camera.aspect);
      var d = radio * 1.02 / Math.sin(Math.min(mitadV, mitadH));
      camera.position.copy(mira).addScaledVector(dir, d);
      camera.lookAt(mira);
      camera.updateMatrixWorld(true);
    }
    fit();
    stage.onResize = fit;

    var raton = new T.Vector2(), suave = new T.Vector2();
    window.addEventListener("pointermove", function (e) {
      raton.set(e.clientX / window.innerWidth * 2 - 1, e.clientY / window.innerHeight * 2 - 1);
    }, { passive: true });

    var giro = -0.5;
    stage.onFrame(function (t, dt) {
      suave.lerp(raton, Math.min(1, dt * 2.5));
      var p = scrollProgress(el);
      var objetivo = -0.55 + p * 1.05 + (opts && opts.reduced ? 0 : Math.sin(t * 0.35) * 0.03);
      giro += (objetivo - giro) * Math.min(1, dt * 4);
      pivote.rotation.y = giro + Math.max(-1, Math.min(1, suave.x)) * 0.16;
      pivote.rotation.x = -0.03 + Math.max(-1, Math.min(1, suave.y)) * 0.05;
    });
    stage.renderer.compile(scene, camera);
    return stage;
  }

  ns.mini = { gears: gears, toolbox: toolbox };
})();
