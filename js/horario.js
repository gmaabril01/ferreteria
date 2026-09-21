/* Horario de Suministros José Luis Cabrera: lógica en hora de Canarias.
   Script clásico (sin módulos): en el navegador se publica en window.__JLC__.horario
   y en Node se puede cargar con require() para los tests. */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.__JLC__ = Object.assign(root.__JLC__ || {}, { horario: api });
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var TZ = "Atlantic/Canary";
  // Índice = Date.getDay() (0 domingo … 6 sábado); minutos desde las 00:00.
  var HORARIO = [
    null,
    { open: 450, close: 1020 },
    { open: 450, close: 1020 },
    { open: 450, close: 1020 },
    { open: 450, close: 1020 },
    { open: 450, close: 1020 },
    { open: 480, close: 780 }
  ];
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  var WEEKDAY = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  var fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  });

  function canaryNow(date) {
    var parts = {};
    fmt.formatToParts(date).forEach(function (p) { parts[p.type] = p.value; });
    return { day: WEEKDAY[parts.weekday], minutes: Number(parts.hour) * 60 + Number(parts.minute) };
  }

  function getStatus(date) {
    var now = canaryNow(date || new Date());
    var today = HORARIO[now.day];
    var open = !!today && now.minutes >= today.open && now.minutes < today.close;
    var next = null;
    if (!open) {
      for (var i = 0; i < 8; i++) {
        var d = (now.day + i) % 7;
        var h = HORARIO[d];
        if (h && (i > 0 || now.minutes < h.open)) { next = { day: d, minutes: h.open, inDays: i }; break; }
      }
    }
    return { open: open, day: now.day, minutes: now.minutes, closesAt: open ? today.close : null, next: next };
  }

  function formatTime(min) {
    var m = min % 60;
    return Math.floor(min / 60) + ":" + (m < 10 ? "0" : "") + m;
  }

  function statusLabel(s) {
    if (s.open) return "Abierto ahora, cierra a las " + formatTime(s.closesAt);
    if (!s.next) return "Cerrado";
    var when = s.next.inDays === 0 ? "hoy" : s.next.inDays === 1 ? "mañana" : "el " + DIAS[s.next.day];
    return "Cerrado, abrimos " + when + " a las " + formatTime(s.next.minutes);
  }

  return { HORARIO: HORARIO, DIAS: DIAS, canaryNow: canaryNow, getStatus: getStatus, formatTime: formatTime, statusLabel: statusLabel };
});
