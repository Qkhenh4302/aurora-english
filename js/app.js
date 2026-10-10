(function () {
  'use strict';
  var LN = window.LN = {};

  /* ================= Lưu trữ ================= */
  var mem = {};
  var store = LN.store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(k); if (v != null) return JSON.parse(v); } catch (e) {}
      return k in mem ? JSON.parse(JSON.stringify(mem[k])) : d;
    },
    set: function (k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del: function (k) { delete mem[k]; try { localStorage.removeItem(k); } catch (e) {} },
    keys: function () {
      var out = Object.keys(mem);
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (out.indexOf(k) < 0) out.push(k); } } catch (e) {}
      return out.filter(function (k) { return k.indexOf('ln_') === 0; });
    }
  };
  LN.persistent = (function () { try { var k = 'ln__t' + Math.random(); localStorage.setItem(k, '1'); var ok = localStorage.getItem(k) === '1'; localStorage.removeItem(k); return ok; } catch (e) { return false; } })();
  LN.hash = function (str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (var i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  };

  /* ================= Tiện ích ================= */
  var esc = LN.esc = function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); };
  var shuffle = LN.shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  var pct = LN.pct = function (a, b) { return b ? Math.round(a * 100 / b) : 0; };
  var dayKey = LN.dayKey = function (d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  var CONTR = { "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "he's": 'he is', "she's": 'she is', "it's": 'it is', "what's": 'what is', "where's": 'where is', "when's": 'when is', "who's": 'who is', "there's": 'there is', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "weren't": 'were not', "don't": 'do not', "doesn't": 'does not', "can't": 'cannot', "i'd": 'i would', "let's": 'let us' };
  function norm(s) {
    s = String(s || '').toLowerCase().replace(/[’‘`´]/g, "'").replace(/[“”]/g, '"');
    s = s.replace(/[a-z]+'[a-z]+/g, function (m) { return CONTR[m] || m; });
    s = s.replace(/\bcan not\b/g, 'cannot').replace(/\bfavorite\b/g, 'favourite').replace(/\bcolor\b/g, 'colour').replace(/\bmum\b/g, 'mom');
    return s.replace(/[.,!?;:"—–]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function matches(input, answers) { var n = norm(input); if (!n) return false; for (var i = 0; i < answers.length; i++) if (norm(answers[i]) === n) return true; return false; }

  /* ================= Biểu tượng, linh vật ================= */
  var IC = {
    check: '<path d="M20 6L9 17l-5-5"/>', x: '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
    sound: '<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/><path d="M19.5 5.5a9 9 0 0 1 0 13"/>',
    mute: '<path d="M11 5L6 9H3v6h3l5 4V5z"/><path d="M22 9l-6 6"/><path d="M16 9l6 6"/>',
    play: '<path d="M7 4v16l13-8z" fill="currentColor" stroke="none"/>',
    left: '<path d="M15 18l-6-6 6-6"/>', right: '<path d="M9 18l6-6-6-6"/>',
    shuffle: '<path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l6 6"/><path d="M4 4l5 5"/>',
    swap: '<path d="M7 16V4"/><path d="M3 8l4-4 4 4"/><path d="M17 8v12"/><path d="M21 16l-4 4-4-4"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
    out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    home: '<path d="M3 10l9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2z"/><path d="M9 4v14"/><path d="M15 6v14"/>',
    game: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3"/><path d="M5.5 12.5h3"/><circle cx="16" cy="11.5" r="1" fill="currentColor"/><circle cx="18" cy="14" r="1" fill="currentColor"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    heal: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21.2l8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5v.5"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>', trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M16 4a4 4 0 0 1 0 8"/><path d="M22 21a6 6 0 0 0-4-5.6"/>',
    chart: '<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>',
    db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    key: '<circle cx="7.5" cy="15.5" r="4.5"/><path d="M10.7 12.3L21 2"/><path d="M16 7l3 3"/>',
    img: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/>',
    down: '<path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/>', up: '<path d="M12 21V9"/><path d="M7 14l5-5 5 5"/><path d="M5 3h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    musicoff: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/><path d="M3 3l18 18"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    cal: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/><path d="M8 15l2.5 2.5L16 13"/>',
    money: '<rect x="2" y="6" width="20" height="12" rx="3"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01"/><path d="M18 12h.01"/>',
    bot: '<rect x="4" y="8" width="16" height="12" rx="3"/><path d="M12 4v4M9 13v2M15 13v2"/>'
  };
  var ic = LN.ic = function (n, s, c, w) { return '<svg width="' + (s || 20) + '" height="' + (s || 20) + '" viewBox="0 0 24 24" fill="none" stroke="' + (c || 'currentColor') + '" stroke-width="' + (w || 2.4) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + IC[n] + '</svg>'; };

  /* ================= Hình chibi & biểu tượng màu ================= */
  var CHIB = {
    yellow: ['#FFD24D', '#FFE9A3', '#FFB400'], pink: ['#FF9EC4', '#FFD6E7', '#F2558B'], mint: ['#7EE0C3', '#D2F7EA', '#22B38A'],
    blue: ['#8EC8FF', '#D9EEFF', '#3A86FF'], purple: ['#C3A6FF', '#EDE4FF', '#8B5CF6'], orange: ['#FFB27A', '#FFE2CC', '#FF7B39'],
    white: ['#FFF6EA', '#FFFFFF', '#E6CFAE'], brown: ['#E0A872', '#F6D9B8', '#B97A3E']
  };
  LN.CHIB_COLORS = Object.keys(CHIB);
  var chibId = 0;
  var chibi = LN.chibi = function (o) {
    o = o || {}; var size = o.size || 120, c = CHIB[o.color] || CHIB.yellow, mood = o.mood || 'happy', pose = o.pose || '', acc = o.acc || '', id = 'cg' + (++chibId);
    var eyes;
    if (mood === 'happy') eyes = '<path d="M38 63q7-9 14 0M68 63q7-9 14 0" stroke="#3B2A3A" stroke-width="4.5" fill="none" stroke-linecap="round"/>';
    else eyes = '<ellipse cx="45" cy="62" rx="7" ry="8.5" fill="#3B2A3A"/><ellipse cx="75" cy="62" rx="7" ry="8.5" fill="#3B2A3A"/><circle cx="47.6" cy="58.4" r="3.1" fill="#fff"/><circle cx="77.6" cy="58.4" r="3.1" fill="#fff"/><circle cx="43" cy="66" r="1.5" fill="#fff"/><circle cx="73" cy="66" r="1.5" fill="#fff"/>' +
      (mood === 'sad' ? '<path d="M36 50l11 4M84 50l-11 4" stroke="#3B2A3A" stroke-width="3" stroke-linecap="round"/><path d="M38 72q-3 6 0 9q3-3 0-9z" fill="#6EC3FF"/>' : '');
    var beak = mood === 'wow' ? '<ellipse cx="60" cy="75" rx="5.5" ry="6.5" fill="#E8574F"/><path d="M53 71q7-6 14 0" fill="#FF9F43"/>' : mood === 'sad' ? '<path d="M54 76q6-5 12 0q-6 5-12 0z" fill="#FF9F43"/>' : '<path d="M53 71q7-4 14 0q-7 9-14 0z" fill="#FF9F43"/>';
    var wingL = '<ellipse cx="22" cy="76" rx="9" ry="15" fill="' + c[2] + '" opacity=".55" transform="rotate(22 22 76)"/>';
    var wingR = pose === 'wave' ? '<ellipse cx="101" cy="50" rx="9" ry="16" fill="' + c[2] + '" opacity=".6" transform="rotate(-38 101 50)"/>' : pose === 'cheer' ? '<ellipse cx="101" cy="50" rx="9" ry="16" fill="' + c[2] + '" opacity=".6" transform="rotate(-38 101 50)"/>' : '<ellipse cx="98" cy="76" rx="9" ry="15" fill="' + c[2] + '" opacity=".55" transform="rotate(-22 98 76)"/>';
    if (pose === 'cheer') wingL = '<ellipse cx="19" cy="50" rx="9" ry="16" fill="' + c[2] + '" opacity=".6" transform="rotate(38 19 50)"/>';
    var legs = pose === 'run' ? '<path d="M52 104l-9 9M68 104l11-5" stroke="#FF9F43" stroke-width="4" stroke-linecap="round"/><ellipse cx="41" cy="114" rx="6" ry="3" fill="#FF9F43"/><ellipse cx="82" cy="98" rx="6" ry="3" fill="#FF9F43" transform="rotate(-20 82 98)"/>'
      : '<ellipse cx="49" cy="108" rx="8" ry="4" fill="#FF9F43"/><ellipse cx="71" cy="108" rx="8" ry="4" fill="#FF9F43"/>';
    var speed = pose === 'run' ? '<path d="M6 60h12M2 72h14M8 84h10" stroke="' + c[2] + '" stroke-width="3.5" stroke-linecap="round" opacity=".5"/>' : '';
    var A = {
      bow: '<g transform="translate(84 30)"><path d="M0 0c6-10 18-6 15 1-2 7-12 7-15-1zM0 0c-6-10-18-6-15 1 2 7 12 7 15-1z" fill="#FF5C9A"/><circle r="4.2" fill="#D63B76"/></g>',
      crown: '<path d="M42 30l-3-17 11 9 10-13 10 13 11-9-3 17z" fill="#FFC92B" stroke="#E59B00" stroke-width="2.5" stroke-linejoin="round"/><circle cx="60" cy="22" r="3" fill="#FF5C9A"/><circle cx="46" cy="25" r="2.2" fill="#3A86FF"/><circle cx="74" cy="25" r="2.2" fill="#22B38A"/>',
      grad: '<path d="M60 10l34 13-34 13-34-13z" fill="#3B2A3A"/><path d="M42 28v9q18 8 36 0v-9" fill="#3B2A3A"/><path d="M92 23v16" stroke="#FFC92B" stroke-width="3" stroke-linecap="round"/><circle cx="92" cy="41" r="4" fill="#FFC92B"/>',
      cap: '<path d="M30 40q2-26 30-26t30 26z" fill="#3A86FF"/><path d="M60 40h40q-2 8-14 8H60z" fill="#2563C9"/><circle cx="60" cy="15" r="3.5" fill="#FFD24D"/>',
      phones: '<path d="M22 66q-2-42 38-44t38 44" stroke="#8B5CF6" stroke-width="6" fill="none" stroke-linecap="round"/><rect x="14" y="58" width="14" height="22" rx="7" fill="#FF5C9A"/><rect x="92" y="58" width="14" height="22" rx="7" fill="#FF5C9A"/>',
      flower: '<g transform="translate(86 34)"><circle r="5" cx="0" cy="-7" fill="#FF8FB1"/><circle r="5" cx="7" cy="0" fill="#FF8FB1"/><circle r="5" cx="0" cy="7" fill="#FF8FB1"/><circle r="5" cx="-7" cy="0" fill="#FF8FB1"/><circle r="4" fill="#FFD24D"/></g>',
      glasses: '<circle cx="45" cy="62" r="11" fill="none" stroke="#3B2A3A" stroke-width="3"/><circle cx="75" cy="62" r="11" fill="none" stroke="#3B2A3A" stroke-width="3"/><path d="M56 62h8" stroke="#3B2A3A" stroke-width="3"/>'
    };
    var tuft = acc === 'crown' || acc === 'grad' || acc === 'cap' ? '' : '<path d="M54 30c-4-10 2-17 7-14-3 3-2 8 1 10 1-7 9-9 12-4-5 1-6 5-5 8" fill="' + c[2] + '"/>';
    return '<svg class="chibi' + (o.cls ? ' ' + o.cls : '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="' + id + '" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="' + c[1] + '"/><stop offset=".55" stop-color="' + c[0] + '"/><stop offset="1" stop-color="' + c[2] + '" stop-opacity=".9"/></radialGradient></defs>' +
      '<ellipse cx="60" cy="114" rx="30" ry="5" fill="rgba(59,42,58,.12)"/>' + speed + legs + tuft + wingL +
      '<circle cx="60" cy="68" r="41" fill="url(#' + id + ')"/><ellipse cx="60" cy="84" rx="25" ry="18" fill="' + c[1] + '" opacity=".75"/>' + wingR +
      '<ellipse cx="34" cy="75" rx="7.5" ry="4.5" fill="#FF7FA8" opacity=".55"/><ellipse cx="86" cy="75" rx="7.5" ry="4.5" fill="#FF7FA8" opacity=".55"/>' + eyes + beak + (A[acc] || '') + '</svg>';
  };
  var chick = LN.chick = function (size, mood) { return chibi({ size: size, mood: mood === 'sad' ? 'sad' : mood === 'wow' ? 'wow' : 'happy', acc: 'bow' }); };

  /* Biểu tượng kiểu chibi: viền đậm bo tròn, màu pastel, có mặt cười + má hồng */
  var OL = ' stroke="#3B2A3A" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';
  function face(x, y, s, o) {
    s = s || 1; o = o || {};
    var e = o.wink ? '<path d="M' + (x - 5.5 * s) + ' ' + y + 'q2 -2.4 4 0" stroke="#3B2A3A" stroke-width="2" fill="none" stroke-linecap="round"/>' : '<ellipse cx="' + (x - 4.6 * s) + '" cy="' + y + '" rx="' + 1.7 * s + '" ry="' + 2.1 * s + '" fill="#3B2A3A"/><circle cx="' + (x - 4.1 * s) + '" cy="' + (y - 0.9 * s) + '" r="' + 0.65 * s + '" fill="#fff"/>';
    return e + '<ellipse cx="' + (x + 4.6 * s) + '" cy="' + y + '" rx="' + 1.7 * s + '" ry="' + 2.1 * s + '" fill="#3B2A3A"/><circle cx="' + (x + 5.1 * s) + '" cy="' + (y - 0.9 * s) + '" r="' + 0.65 * s + '" fill="#fff"/>' +
      '<ellipse cx="' + (x - 8 * s) + '" cy="' + (y + 3 * s) + '" rx="' + 2.4 * s + '" ry="' + 1.5 * s + '" fill="#FF7FA8" opacity=".7"/><ellipse cx="' + (x + 8 * s) + '" cy="' + (y + 3 * s) + '" rx="' + 2.4 * s + '" ry="' + 1.5 * s + '" fill="#FF7FA8" opacity=".7"/>' +
      '<path d="M' + (x - 2.2 * s) + ' ' + (y + 2.6 * s) + 'q' + 2.2 * s + ' ' + 2.4 * s + ' ' + 4.4 * s + ' 0" stroke="#3B2A3A" stroke-width="' + 1.8 * s + '" fill="none" stroke-linecap="round"/>';
  }
  var CIC = {
    home: '<path d="M9 22L24 9l15 13v16a5 5 0 0 1-5 5H14a5 5 0 0 1-5-5z" fill="#FFD3E2"' + OL + '/><path d="M5 23L24 6l19 17" fill="none" stroke="#FF5C8A" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 23L24 6l19 17" fill="none"' + OL + ' stroke-width="1.2"/><rect x="31" y="9" width="5" height="8" rx="1.5" fill="#FF9F6B"' + OL + '/>' + face(24, 27, 0.95) + '<path d="M20 43v-5a4 4 0 0 1 8 0v5" fill="#FFB27A"' + OL + '/>',
    learn: '<path d="M8 9h26a5 5 0 0 1 5 5v24a5 5 0 0 1-5 5H8z" fill="#BFA8FF"' + OL + '/><path d="M8 9v34" ' + OL + ' fill="none"/><rect x="12" y="9" width="5" height="34" fill="#9B7BF0" opacity=".6"/><path d="M30 9v12l3.5-2.5L37 21V9" fill="#FF7FA8"' + OL + '/>' + face(25, 27, 0.95),
    games: '<path d="M14 14h20a11 11 0 0 1 10.6 13.8l-1.7 6.4a5.5 5.5 0 0 1-9.6 1.9L30 32H18l-3.3 4.1a5.5 5.5 0 0 1-9.6-1.9l-1.7-6.4A11 11 0 0 1 14 14z" fill="#8FE6C8"' + OL + '/><path d="M12.5 20v7M9 23.5h7" stroke="#3B2A3A" stroke-width="2.6" stroke-linecap="round"/><circle cx="35" cy="21" r="2.6" fill="#FF7FA8"' + OL + ' stroke-width="1.6"/><circle cx="39" cy="26" r="2.6" fill="#FFD24D"' + OL + ' stroke-width="1.6"/>' + face(24, 22, 0.75),
    grammar: '<rect x="9" y="8" width="28" height="35" rx="6" fill="#FFE08A"' + OL + '/><path d="M15 5v6M23 5v6M31 5v6" stroke="#3B2A3A" stroke-width="2.6" stroke-linecap="round"/>' + face(23, 24, 0.95) + '<path d="M15 35h16" stroke="#E0A915" stroke-width="2.4" stroke-linecap="round"/><path d="M36 32l7-7 3.5 3.5-7 7-4.6 1.1z" fill="#FF8FB1"' + OL + ' stroke-width="1.8"/>',
    heal: '<path d="M24 43S6 32 6 19a9.5 9.5 0 0 1 18-4.2A9.5 9.5 0 0 1 42 19c0 13-18 24-18 24z" fill="#FF9AB8"' + OL + '/>' + face(24, 23, 0.95) + '<rect x="29" y="27" width="13" height="6" rx="3" fill="#FFE2C2" transform="rotate(-38 35.5 30)"' + OL + ' stroke-width="1.6"/>',
    star: '<path d="M24 4.5l5.7 11.6 12.8 1.9-9.3 9 2.2 12.7L24 33.7l-11.4 6 2.2-12.7-9.3-9 12.8-1.9z" fill="#FFD84D"' + OL + '/>' + face(24, 23, 0.9),
    fire: '<path d="M24 44c-9 0-15-6-15-14 0-9 8-13 9.5-22 4 3 6 7 6 11 2-2 3-4.5 3-7.5 6 4 11.5 11 11.5 18.5 0 8-6 14-15 14z" fill="#FF9452"' + OL + '/><path d="M24 44c-5 0-8-3-8-7.5 0-4.5 4.5-6.5 6-11 4 3 10 6.5 10 11 0 4.5-3 7.5-8 7.5z" fill="#FFD84D"/>' + face(24, 34, 0.8),
    music: '<path d="M19 32V11l19-4.5v21" fill="none"' + OL + ' stroke-width="3"/><path d="M19 15l19-4.5" ' + OL + ' stroke-width="3"/><ellipse cx="13.5" cy="33" rx="7.5" ry="6" fill="#C3A6FF"' + OL + '/><ellipse cx="32.5" cy="28" rx="7.5" ry="6" fill="#FF9AB8"' + OL + '/>' + face(13.5, 32, 0.55) + face(32.5, 27, 0.55),
    musicoff: '<path d="M19 32V11l19-4.5v21" fill="none" stroke="#B7AFC0" stroke-width="3" stroke-linejoin="round"/><ellipse cx="13.5" cy="33" rx="7.5" ry="6" fill="#E3DDE8" stroke="#B7AFC0" stroke-width="2.2"/><ellipse cx="32.5" cy="28" rx="7.5" ry="6" fill="#E3DDE8" stroke="#B7AFC0" stroke-width="2.2"/><path d="M7 7l34 34" stroke="#FF5C7A" stroke-width="4" stroke-linecap="round"/>',
    sound: '<path d="M6 18h7l10-8.5v29L13 30H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" fill="#8EC8FF"' + OL + '/>' + face(13.5, 23, 0.6) + '<path d="M30 17q4.5 7 0 14M36 12q9 12 0 24" stroke="#3A86FF" stroke-width="3.2" fill="none" stroke-linecap="round"/>',
    mute: '<path d="M6 18h7l10-8.5v29L13 30H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" fill="#E3DDE8" stroke="#B7AFC0" stroke-width="2.2" stroke-linejoin="round"/><path d="M30 18l11 12M41 18L30 30" stroke="#FF5C7A" stroke-width="4" stroke-linecap="round"/>',
    out: '<rect x="8" y="5" width="22" height="38" rx="5" fill="#D8C8F5"' + OL + '/>' + face(19, 21, 0.8, { wink: true }) + '<circle cx="25" cy="30" r="1.8" fill="#3B2A3A"/><path d="M29 24h15M38 18l6 6-6 6" stroke="#FF5C8A" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    trophy: '<path d="M13 7h22v10a11 11 0 0 1-22 0z" fill="#FFD84D"' + OL + '/><path d="M13 10H7q0 9 7 10M35 10h6q0 9-7 10" fill="none"' + OL + '/><rect x="20" y="27" width="8" height="7" fill="#F5B83D"' + OL + ' stroke-width="1.8"/><rect x="13" y="34" width="22" height="8" rx="3" fill="#C98B52"' + OL + '/>' + face(24, 15, 0.75),
    flag: '<path d="M11 5v38" stroke="#3B2A3A" stroke-width="3" stroke-linecap="round"/><path d="M12 7h25l-6 8 6 8H12z" fill="#FF9AB8"' + OL + '/>' + face(22, 14, 0.6),
    target: '<circle cx="24" cy="24" r="19" fill="#FF9AB8"' + OL + '/><circle cx="24" cy="24" r="13" fill="#fff"' + OL + ' stroke-width="1.8"/><circle cx="24" cy="24" r="7.5" fill="#FF9AB8"/>' + face(24, 23, 0.55),
    book2: '<rect x="9" y="6" width="29" height="37" rx="6" fill="#8FE6C8"' + OL + '/><rect x="9" y="6" width="7" height="37" rx="3" fill="#4FCB9F"/>' + face(27, 22, 0.85) + '<path d="M20 35h13" stroke="#22B38A" stroke-width="2.4" stroke-linecap="round"/>',
    user: '<circle cx="24" cy="18" r="11" fill="#FFD6B8"' + OL + '/>' + face(24, 19, 0.8) + '<path d="M7 44c2-9 9-13 17-13s15 4 17 13z" fill="#8EC8FF"' + OL + '/>'
  };
  var cic = LN.cic = function (n, s) { return '<svg class="cic" width="' + (s || 24) + '" height="' + (s || 24) + '" viewBox="0 0 48 48" aria-hidden="true">' + (CIC[n] || '') + '</svg>'; };
  /* ---------- Bộ hình mới (window.ART: SVG) — dùng qua <img> để nhẹ DOM và không trùng id ---------- */
  var ARTURL = {};
  var artUrl = LN.artUrl = function (n) {
    if (ARTURL[n]) return ARTURL[n];
    var sv = (window.ART || {})[n]; if (!sv) return '';
    try { ARTURL[n] = URL.createObjectURL(new Blob([sv], { type: 'image/svg+xml' })); } catch (e) { ARTURL[n] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sv); }
    return ARTURL[n];
  };
  var hasArt = LN.hasArt = function (n) { return !!(window.ART || {})[n]; };
  var art = LN.art = function (n, w, cls, alt) { var u = artUrl(n); if (!u) return ''; return '<img class="art ' + (cls || '') + '" src="' + u + '" alt="' + (alt || '') + '"' + (w ? ' width="' + w + '"' : '') + ' draggable="false">'; };
  var FRIEND = { pink: 'bunny', brown: 'bear', purple: 'cat', white: 'puppy', orange: 'fox', mint: 'panda' };
  function chibiArt(o) {
    var c = o.color || 'yellow', pose = o.pose || '', mood = o.mood || 'happy', acc = o.acc || '';
    if (FRIEND[c]) return FRIEND[c] + (o.head ? '-head' : pose === 'run' ? '-run' : pose === 'cheer' ? '-cheer' : '-idle');
    if (o.head) return 'chip-head';
    if (c === 'blue') return pose === 'run' ? 'chip-run' : 'chip-blue';
    if (pose === 'run') return 'chip-run';
    if (pose === 'cheer') return acc === 'crown' ? 'chip-cheer' : 'chip-celebrate';
    if (acc === 'grad') return 'chip-grad';
    if (acc === 'glasses') return 'chip-teacher';
    if (acc === 'crown') return 'chip-cheer';
    if (mood === 'sad') return 'chip-oops';
    if (pose === 'wave') return 'chip-wave';
    if (mood === 'wow') return 'chip-wow';
    return 'chip-idle';
  }
  var _chibi = chibi;
  chibi = LN.chibi = function (o) { o = o || {}; var n = chibiArt(o); return hasArt(n) ? art(n, o.size || 120, 'chibi ' + (o.cls || '')) : _chibi(o); };
  var CICMAP = { ai: 'chip-mic', home: 'icon-home', learn: 'icon-learn', games: 'icon-games', grammar: 'icon-grammar', heal: 'icon-review-mistakes', star: 'icon-star', fire: 'icon-fire', music: 'icon-music', musicoff: 'icon-music-off', sound: 'icon-sound', mute: 'icon-mute', out: 'icon-logout', trophy: 'icon-trophy', flag: 'icon-flag-finish', target: 'icon-target', book2: 'icon-book', user: 'icon-account' };
  var _cic = cic;
  cic = LN.cic = function (n, sz) { var a = CICMAP[n]; return a && hasArt(a) ? art(a, sz || 24, 'cic') : _cic(n, sz); };
  var uic = LN.uic = function (u, sz) { return u && u.art && hasArt(u.art) ? art(u.art, sz || 40, 'uart', '') : esc(u ? u.icon : ''); };


  function stars(n, max, cls) { var h = ''; for (var i = 0; i < (max || 3); i++) h += '<span style="color:' + (i < n ? '#FFB400' : '#EBDCE1') + '">★</span>'; return '<span class="' + (cls == null ? 'stars' : cls) + '">' + h + '</span>'; }
  LN.stars = stars;
  function starsFor(score) { return score == null ? 0 : score >= 90 ? 3 : score >= 70 ? 2 : score >= 40 ? 1 : 0; }
  LN.starsFor = starsFor;
  /* picHtml: xem phần Hình minh hoạ bên dưới */
  LN.picHtml = picHtml;

  /* ================= Thông báo, âm thanh ================= */
  var toastT;
  var toast = LN.toast = function (m) {
    var el = document.getElementById('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = m; el.style.display = 'block'; clearTimeout(toastT); toastT = setTimeout(function () { el.style.display = 'none'; }, 2800);
  };
  function settings() { return Object.assign({ sound: true, music: true, musicVol: 0.5, rate: 0.85, voice: '' }, store.get('ln_settings', {})); }
  function setSetting(k, v) { var s = store.get('ln_settings', {}); s[k] = v; store.set('ln_settings', s); }
  LN.settings = settings; LN.setSetting = setSetting;

  /* ---------- Âm thanh hiệu ứng (WebAudio, không cần file) ---------- */
  var AC = null, SFXG = null;
  function ac() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); SFXG = AC.createGain(); SFXG.gain.value = 0.9; SFXG.connect(AC.destination); } catch (e) { AC = null; } }
    if (AC && AC.state === 'suspended') { try { AC.resume(); } catch (e) {} }
    return AC;
  }
  function note(f, t, dur, type, vol, dest, glideTo) {
    var o = AC.createOscillator(), g = AC.createGain(); o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || SFXG); o.start(t); o.stop(t + dur + 0.05);
  }
  function play(fn) { if (!settings().sound || !ac()) return; try { fn(AC.currentTime + 0.01); } catch (e) {} }
  var sfx = {
    ok: function () { play(function (t) { [1046.5, 1318.5, 1568, 2093].forEach(function (f, i) { note(f, t + i * 0.07, 0.42, 'sine', 0.16); note(f * 2, t + i * 0.07, 0.2, 'triangle', 0.025); }); }); },
    bad: function () { play(function (t) { note(311, t, 0.22, 'triangle', 0.2, null, 233); note(220, t + 0.2, 0.38, 'triangle', 0.2, null, 147); note(110, t + 0.2, 0.38, 'sine', 0.12); }); },
    win: function () { play(function (t) { [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { note(f, t + i * 0.12, 0.3, 'triangle', 0.15); }); [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach(function (f) { note(f, t + 0.5, 1.1, 'sine', 0.07); }); }); },
    flip: function () { play(function (t) { note(660, t, 0.07, 'sine', 0.08, null, 990); }); },
    pop: function () { play(function (t) { note(500, t, 0.09, 'square', 0.06, null, 1400); note(1800, t + 0.03, 0.08, 'sine', 0.05); }); },
    tick: function () { play(function (t) { note(1200, t, 0.05, 'square', 0.035); }); },
    combo: function () { play(function (t) { [659.25, 783.99, 987.77, 1318.5, 1567.98].forEach(function (f, i) { note(f, t + i * 0.055, 0.25, 'square', 0.05); note(f, t + i * 0.055, 0.3, 'sine', 0.1); }); }); },
    go: function () { play(function (t) { note(880, t, 0.35, 'square', 0.07); note(1318.5, t, 0.45, 'sine', 0.14); }); },
    star: function (k) { play(function (t) { note([784, 988, 1318.5][k - 1] || 1318.5, t, 0.35, 'triangle', 0.16); note(([784, 988, 1318.5][k - 1] || 1318.5) * 2, t + 0.03, 0.25, 'sine', 0.05); }); },
    whoosh: function () { play(function (t) { note(300, t, 0.3, 'sine', 0.05, null, 900); }); }
  };

  /* ---------- Nhạc nền nhẹ nhàng (tự sinh, vòng hợp âm C – Am – F – G) ---------- */
  var MUS = { on: false, gain: null, filt: null, timer: null, step: 0, next: 0, motif: null, duck: 1 };
  var mtof = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };
  var PROG = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62], [60, 64, 67], [52, 55, 59], [53, 57, 60], [55, 59, 62]];
  var PENTA = [72, 74, 76, 79, 81, 84];
  var RHY = [[1, 0, 1, 0, 1, 0, 1, 0], [1, 0, 0, 1, 0, 0, 1, 0], [1, 0, 1, 1, 0, 0, 1, 0], [0, 0, 1, 0, 1, 0, 1, 1], [1, 0, 0, 0, 1, 0, 0, 0]];
  function musVol() { return 0.21 * settings().musicVol * MUS.duck; }
  function newMotif() { return { r: [RHY[Math.floor(Math.random() * RHY.length)], RHY[Math.floor(Math.random() * RHY.length)]], d: [0, 1, 2, 1, 3, 2, 1, 0].map(function () { return Math.floor(Math.random() * 3); }) }; }
  function musicTick() {
    if (!MUS.on || !AC) return;
    var spb = 60 / (document.body.classList.contains('in-game') ? 112 : 88) / 2;
    while (MUS.next < AC.currentTime + 0.25) {
      var t = MUS.next, s = MUS.step, bar = Math.floor(s / 8) % PROG.length, pos = s % 8, ch = PROG[bar];
      if (s % 32 === 0) MUS.motif = newMotif();
      if (pos === 0) {
        ch.forEach(function (m) { padNote(mtof(m - 12), t, spb * 8); });
        bassNote(mtof(ch[0] - 24), t, spb * 3.5);
      }
      if (pos === 4) bassNote(mtof(ch[0] - 24 + (bar % 2 ? 7 : 0)), t, spb * 3.5);
      var rh = MUS.motif.r[bar % 2];
      if (rh[pos] && !(bar % 4 === 3 && pos > 4)) {
        var tones = ch.map(function (m) { return m + 12; }).concat(PENTA), pickN = tones[(MUS.motif.d[pos] + bar) % tones.length];
        while (pickN > 86) pickN -= 12;
        pluck(mtof(pickN), t, bar % 4 === 3 && pos === 4 ? spb * 6 : spb * 3);
      }
      if (pos === 6 && s % 64 === 62) pluck(mtof(96), t, spb * 4, 0.05);
      MUS.step++; MUS.next += spb;
    }
  }
  function padNote(f, t, dur) {
    [-4, 4].forEach(function (det) {
      var o = AC.createOscillator(), g = AC.createGain(); o.type = 'triangle'; o.frequency.value = f; o.detune.value = det;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + 0.6); g.gain.setValueAtTime(0.05, t + dur - 0.3); g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.5);
      o.connect(g); g.connect(MUS.filt); o.start(t); o.stop(t + dur + 0.6);
    });
  }
  function bassNote(f, t, dur) { var o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + dur + 0.05); }
  function pluck(f, t, dur, v) {
    var o = AC.createOscillator(), o2 = AC.createOscillator(), g = AC.createGain(), g2 = AC.createGain();
    o.type = 'sine'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 3;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v || 0.13, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.02, t + 0.005); g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g); o2.connect(g2); g.connect(MUS.gain); g2.connect(MUS.gain); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + 0.3);
  }
  var musicStart = LN.musicStart = function () {
    if (MUS.on || !settings().music || document.hidden || !ac()) return;
    if (AC.state !== 'running') return;
    MUS.on = true;
    MUS.gain = AC.createGain(); MUS.gain.gain.setValueAtTime(0.0001, AC.currentTime); MUS.gain.gain.linearRampToValueAtTime(musVol(), AC.currentTime + 2.5);
    MUS.filt = AC.createBiquadFilter(); MUS.filt.type = 'lowpass'; MUS.filt.frequency.value = 1400; MUS.filt.connect(MUS.gain);
    MUS.gain.connect(AC.destination); MUS.step = 0; MUS.next = AC.currentTime + 0.1; MUS.motif = newMotif();
    MUS.timer = setInterval(musicTick, 60); musicTick();
  };
  var musicStop = LN.musicStop = function () {
    if (!MUS.on) return; MUS.on = false; clearInterval(MUS.timer);
    var g = MUS.gain; try { g.gain.cancelScheduledValues(AC.currentTime); g.gain.setValueAtTime(g.gain.value, AC.currentTime); g.gain.linearRampToValueAtTime(0.0001, AC.currentTime + 0.6); } catch (e) {}
    setTimeout(function () { try { g.disconnect(); } catch (e) {} }, 900);
  };
  function musicLevel() { if (MUS.on && MUS.gain) { try { MUS.gain.gain.cancelScheduledValues(AC.currentTime); MUS.gain.gain.setValueAtTime(MUS.gain.gain.value, AC.currentTime); MUS.gain.gain.linearRampToValueAtTime(Math.max(0.0001, musVol()), AC.currentTime + 0.35); } catch (e) {} } }
  function duck(on) { MUS.duck = on ? 0.3 : 1; musicLevel(); }
  LN.musicLevel = musicLevel;
  ['pointerdown', 'keydown'].forEach(function (evn) { document.addEventListener(evn, function () { if (settings().music && !MUS.on) { ac(); setTimeout(musicStart, 60); } }, true); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) musicStop(); else if (settings().music) setTimeout(musicStart, 300); });

  function confetti() {
    var c = document.createElement('div'); c.className = 'confetti';
    var cols = ['#F2558B', '#FFD24D', '#2FB383', '#4FA9F0', '#9B7BF0', '#FF8A3D', '#00C2D1'];
    var spr = hasArt('confetti-1');
    for (var i = 0; i < 90; i++) {
      var d;
      if (spr && i % 2 === 0) { d = document.createElement('img'); d.className = 'cf-img'; d.alt = ''; d.src = artUrl('confetti-' + (1 + (i / 2) % 6)); d.style.width = (16 + Math.random() * 14) + 'px'; }
      else { d = document.createElement('i'); d.style.background = pick(cols); }
      d.style.left = Math.random() * 100 + 'vw';
      d.style.animationDuration = (1.6 + Math.random() * 1.6) + 's'; d.style.animationDelay = Math.random() * 0.4 + 's';
      c.appendChild(d);
    }
    document.body.appendChild(c); setTimeout(function () { c.remove(); }, 3800);
  }
  /* Hiệu ứng chữ nổi khi trả lời đúng / sai trong trò chơi */
  var burst = LN.burst = function (ok, text) {
    var b = document.createElement('div'); b.className = 'burst ' + (ok ? 'ok' : 'no');
    b.innerHTML = '<span>' + (hasArt('fx-correct') ? art(ok ? 'fx-correct' : 'fx-wrong', 0, 'bu-ic') : ok ? '✓ ' : '✗ ') + esc(text || (ok ? pick(['Đúng rồi!', 'Giỏi quá!', 'Tuyệt vời!', 'Chính xác!']) : pick(['Sai rồi!', 'Chưa đúng!', 'Thử lại nhé!']))) + '</span>';
    document.body.appendChild(b); setTimeout(function () { b.remove(); }, 900);
  };

  /* ---------- Giọng đọc tiếng Anh – Mỹ (en-US) ---------- */
  var voice = null;
  function usVoices() { if (!('speechSynthesis' in window)) return []; return speechSynthesis.getVoices().filter(function (v) { return /^en[-_]US$/i.test(v.lang) || /^en[-_]US/i.test(v.lang); }); }
  LN.usVoices = usVoices;
  function rankVoice(v) {
    var n = v.name, s = 0;
    if (/Natural|Online/i.test(n)) s += 50;
    if (/Aria|Jenny|Ava|Emma|Ana|Michelle|Guy|Andrew|Brian/i.test(n)) s += 20;
    if (/Google US English/i.test(n)) s += 40;
    if (/Samantha|Allison|Ava|Susan/i.test(n)) s += 30;
    if (/Zira|David|Mark/i.test(n)) s += 10;
    if (v.localService) s += 2;
    return s;
  }
  function pickVoice() {
    var vs = usVoices(), want = settings().voice;
    voice = (want && vs.filter(function (v) { return v.name === want; })[0]) || vs.slice().sort(function (a, b) { return rankVoice(b) - rankVoice(a); })[0] || null;
  }
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  var speak = LN.speak = function (text, rate) {
    if (!('speechSynthesis' in window)) { toast('Máy này chưa đọc được tiếng Anh. Hãy mở bằng Chrome, Edge hoặc Safari.'); return; }
    if (!voice) pickVoice();
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(String(text).replace(/_+/g, ' ').replace(/…/g, ' ').replace(/\s+\/\s+/g, ', '));
    u.lang = 'en-US'; u.rate = rate || settings().rate; u.pitch = 1.05; if (voice) u.voice = voice;
    u.onstart = function () { duck(true); }; u.onend = u.onerror = function () { duck(false); };
    speechSynthesis.speak(u);
  };
  function sayBtn(t, cls) { return '<button type="button" class="ibtn say ' + (cls || '') + '" data-say="' + esc(t) + '" aria-label="Nghe: ' + esc(t) + '">' + ic('sound', 19) + '</button>'; }
  LN.sayBtn = sayBtn;
  function soundSettingsHtml() {
    var st = settings(), vs = usVoices();
    return '<div class="sset"><label class="swi"><input type="checkbox" data-set="sound"' + (st.sound ? ' checked' : '') + '><span></span>Hiệu ứng âm thanh đúng / sai</label>' +
      '<label class="swi"><input type="checkbox" data-set="music"' + (st.music ? ' checked' : '') + '><span></span>Nhạc nền nhẹ nhàng</label>' +
      '<div class="field"><label for="set-mv">Âm lượng nhạc nền</label><input type="range" id="set-mv" data-set="musicVol" min="0.1" max="1" step="0.05" value="' + st.musicVol + '"></div>' +
      '<div class="field"><label for="set-rate">Tốc độ đọc</label><select class="sel" id="set-rate" data-set="rate">' + [[0.7, 'Chậm'], [0.85, 'Vừa (khuyên dùng)'], [1, 'Bình thường']].map(function (o) { return '<option value="' + o[0] + '"' + (+st.rate === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label for="set-voice">Giọng đọc (tiếng Anh – Mỹ)</label><select class="sel" id="set-voice" data-set="voice"><option value="">Tự chọn giọng Mỹ tốt nhất' + (voice ? ' (' + esc(voice.name) + ')' : '') + '</option>' + vs.map(function (v) { return '<option value="' + esc(v.name) + '"' + (st.voice === v.name ? ' selected' : '') + '>' + esc(v.name) + '</option>'; }).join('') + '</select>' +
      (vs.length ? '' : '<p class="hint">Máy chưa có giọng tiếng Anh – Mỹ riêng; trình duyệt sẽ dùng giọng en-US mặc định.</p>') + '</div>' +
      '<button type="button" class="btn btn-sm" data-say="Hello! Welcome to Aurora English. Let\'s learn together!">' + ic('sound', 16) + 'Nghe thử giọng đọc</button></div>';
  }
  function bindSoundSettings() {
    [].slice.call(document.querySelectorAll('[data-set]')).forEach(function (el) {
      el.addEventListener('change', function () {
        var k = el.getAttribute('data-set'), v = el.type === 'checkbox' ? el.checked : (k === 'voice' ? el.value : +el.value);
        setSetting(k, v);
        if (k === 'music') { if (v) { ac(); musicStart(); } else musicStop(); }
        if (k === 'musicVol') musicLevel();
        if (k === 'voice') pickVoice();
        toast('Đã lưu cài đặt'); if (k === 'sound' || k === 'music') { var hb = document.querySelector('.topbar'); if (hb) route(); }
      });
      if (el.type === 'range') el.addEventListener('input', function () { setSetting('musicVol', +el.value); musicLevel(); });
    });
  }
  LN.soundSettingsHtml = soundSettingsHtml; LN.bindSoundSettings = bindSoundSettings;

  /* ================= Nội dung ================= */
  var OLD = {}; (window.GRADE_CONTENT[4].units || []).forEach(function (u) { OLD[u.n] = u; });
  var UNITS = LN.UNITS = [];
  var EX = LN.EX = {};
  var TOPIC_NAMES = { vocab: 'Từ vựng', reading: 'Đọc hiểu', time: 'Hỏi giờ và sinh hoạt', btbt: 'Bài tập bổ trợ', test: 'Bài kiểm tra' };

  function vocabItems(vocab) {
    return vocab.map(function (v, i) {
      var others = shuffle(vocab.filter(function (x, j) { return j !== i && x[1] !== v[1]; }).map(function (x) { return x[1]; })).slice(0, 3);
      var o = shuffle([v[1]].concat(others));
      return { q: 'Từ "' + v[0] + '" nghĩa là gì?', o: o, a: o.indexOf(v[1]), say: v[0], pic: v[2] };
    });
  }
  window.UNITS4.forEach(function (m) {
    var old = OLD[m.n];
    var u = Object.assign({}, m, { readings: old ? old.lesson.readings : [], exercises: [] });
    u.exercises.push({ id: 'g4u' + m.n + 'v', type: 'mcq', title: 'Đố nghĩa từ vựng', topic: 'vocab', gen: 'vocab', items: vocabItems(m.vocab) });
    if (old) old.exercises.forEach(function (e) { u.exercises.push(e); });
    UNITS.push(u);
  });
  UNITS.forEach(function (u) {
    if (OLD[u.n]) return;
    var pairs = []; u.patterns.forEach(function (p) { p.ex.forEach(function (x) { pairs.push(x); }); });
    var near = UNITS.filter(function (x) { return x.n !== u.n && Math.abs(x.n - u.n) <= 4; });
    var pool = []; near.forEach(function (x) { x.patterns.forEach(function (p) { p.ex.forEach(function (e) { pool.push(e[1]); }); }); });
    u.exercises.push({
      id: 'g4u' + u.n + 'p1', type: 'mcq', title: 'Chọn câu trả lời đúng', topic: u.topic,
      items: pairs.map(function (pr) { var o = shuffle([pr[1]].concat(shuffle(pool).slice(0, 3))); return { q: pr[0], o: o, a: o.indexOf(pr[1]) }; })
    });
    var sents = pairs.map(function (p) { return p[1]; }).concat(pairs.filter(function (_, i) { return i % 2 === 0; }).map(function (p) { return p[0]; }));
    u.exercises.push({
      id: 'g4u' + u.n + 'p2', type: 'order', title: 'Sắp xếp thành câu đúng', topic: u.topic,
      items: sents.map(function (s) { return { w: shuffle(s.replace(/[.?!]$/, '').split(' ')).join('/'), a: [s] }; })
    });
  });
  UNITS.forEach(function (u) { u.exercises.forEach(function (e) { EX[e.id] = { ex: e, unit: u }; }); });
  var unitOf = LN.unitOf = function (n) { return UNITS[(+n) - 1] || null; };
  /* ---------- Lớp 1 (và các lớp khác có bộ Unit riêng): BTBT + bài kiểm tra + luyện nói ---------- */
  var KIND1 = { tick: 'Nhìn hình: đúng ✓ hay sai ✗?', yesno: 'Đúng chọn YES, sai chọn NO', pic2word: 'Nhìn hình, chọn từ đúng', word2pic: 'Chọn hình đúng với từ', listen: 'Nghe và chọn', letter: 'Chọn chữ cái còn thiếu', spell: 'Chọn từ viết đúng', seq: 'Hình nào tiếp theo?', sound: 'Chọn từ đúng âm', mcq: 'Chọn đáp án đúng', order: 'Xếp thành câu' };
  function vocabItems1(vocab) {
    return vocab.map(function (v, i) {
      var os = shuffle([v].concat(shuffle(vocab.filter(function (x, j) { return j !== i; })).slice(0, 2)));
      return { type: 'mcq', t: 'listen', kind: 'Nghe và chọn hình đúng', q: '', listen: v[0], o: os.map(function (x) { return x[0]; }), opic: os.map(function (x) { return x[2]; }), a: os.indexOf(v) };
    });
  }
  function conv1(it) {
    if (it.t === 'order') return { type: 'order', t: 'order', w: it.w.join('/'), a: [it.a], kind: KIND1.order, hintq: it.q || '' };
    if (it.t === 'fill') return { type: 'fill', t: 'fill', q: it.q, a: it.a, pic: it.pic || null, kind: 'Điền vào chỗ trống' };
    var x = { type: 'mcq', t: it.t, kind: KIND1[it.t] || '', q: it.q || '', o: it.o, a: it.a };
    ['pic', 'seq', 'opic', 'text'].forEach(function (k) { if (it[k] != null) x[k] = it[k]; });
    if (it.t === 'listen') { x.listen = it.say; if (!x.q) x.q = it.text ? 'Nghe và chọn câu đúng' : ''; } else if (it.say) x.say = it.say;
    return x;
  }
  function buildUnitsG(list, gr) {
    var EXP = window.EXPLAIN = window.EXPLAIN || {}, out = [];
    list.forEach(function (m) {
      var u = Object.assign({}, m, { grade: gr, readings: [], exercises: [], topic: null }), pre = 'g' + gr + 'u' + m.n;
      u.exercises.push({ id: pre + 'v', type: 'mcq', title: 'Nghe và chọn hình', topic: 'vocab', gen: 'vocab1', group: 'vocab', items: vocabItems1(m.vocab) });
      (m.btbt || []).forEach(function (e, k) {
        var id = pre + 'b' + (k + 1);
        u.exercises.push({ id: id, type: 'mcq', title: e.title, en: e.en, topic: 'btbt', group: 'btbt', intro: e.read || '', items: e.items.map(conv1) });
        e.items.forEach(function (it, i) { EXP[id + '#' + i] = { vi: it.vi || '', why: it.why || '' }; });
      });
      (m.tests || []).forEach(function (e, k) {
        var id = pre + 't' + (k + 1);
        u.exercises.push({ id: id, type: 'mcq', title: (e.title || 'Kiểm tra ' + (k + 1)) + (k === 3 && !/ôn/i.test(e.title || '') ? ' · Ôn tập' : ''), topic: 'test', group: 'test', items: e.items.map(conv1) });
        e.items.forEach(function (it, i) { EXP[id + '#' + i] = { vi: it.vi || '', why: it.why || '' }; });
      });
      out.push(u);
    });
    out.forEach(function (u) { u.exercises.forEach(function (e) { EX[e.id] = { ex: e, unit: u }; }); });
    return out;
  }
  var SETS = LN.UNITSETS = { 4: UNITS.slice() }, CURG = 4;
  UNITS.forEach(function (u) { u.grade = 4; });
  SETS[4].forEach(function (u) { u.art = 'u4-' + u.n; });
  function regGS() { [1, 2, 3].forEach(function (g) { var L = window['UNITS' + g]; if (L && !SETS[g] && (g !== 2 || (window.IMG1 && window.IMG3))) { SETS[g] = buildUnitsG(L, g); SETS[g].forEach(function (u) { u.art = 'u' + g + '-' + u.n; }); } }); }
  regGS();
  function regCourses() {
    regGS();
    if (window.UNITSE1 && !SETS[101]) { SETS[101] = buildUnitsG(window.UNITSE1, 101); var EUART = ['u3-8', 'u3-9', 'u4-4', 'u3-11', 'u3-19', 'u3-20', 'u3-4', 'u3-17']; SETS[101].forEach(function (u) { u.art = EUART[u.n - 1]; }); }
    if (window.UNITSE2 && !SETS[102]) { SETS[102] = buildUnitsG(window.UNITSE2, 102); var E2ART = ['e2-happy', 'e2-hospital', 'e2-spaghetti', 'e2-t-shirt', 'e2-play-the-guitar', 'e2-living-room', 'e2-one-o-clock', 'e2-social-studies']; SETS[102].forEach(function (u) { u.art = E2ART[u.n - 1]; }); }
  }
  regCourses();
  /* Bản web: dữ liệu khoá nặng (Everybody Up) chỉ tải khi cần */
  var LAZY = window.LN_LAZY || {}, LOADING = {};
  LN.needLoad = function (g) { return !SETS[+g] && !!LAZY[+g]; };
  LN.loadGrade = function (g) {
    g = +g; if (!LN.needLoad(g)) return Promise.resolve();
    if (LOADING[g]) return LOADING[g];
    var files = [].concat(LAZY[g]);
    LOADING[g] = files.reduce(function (pr, src) {
      return pr.then(function () {
        if (document.querySelector('script[data-lz="' + src + '"]')) return LN._lz[src];
        LN._lz = LN._lz || {};
        return (LN._lz[src] = new Promise(function (ok, bad) { var s = document.createElement('script'); s.src = src; s.async = false; s.setAttribute('data-lz', src); s.onload = ok; s.onerror = function () { bad(new Error(src.split('?')[0])); }; document.head.appendChild(s); }));
      });
    }, Promise.resolve()).then(function () { regCourses(); }, function (e) { delete LOADING[g]; throw e; });
    return LOADING[g];
  };
  LN.loadAll = function () { return Promise.all(Object.keys(LAZY).map(function (g) { return LN.loadGrade(g); })); };
  /* Khoá học: lớp 1–12 theo SGK, 101 = Everybody Up 1, 102 = Everybody Up 2 */
  var COURSES = LN.COURSES = [[101, 'Everybody Up 1'], [102, 'Everybody Up 2']];
  var courseName = LN.gradeName = function (g) { g = +g; for (var i = 0; i < COURSES.length; i++) if (COURSES[i][0] === g) return COURSES[i][1]; return 'Lớp ' + g; };
  LN.gradeOpts = function (sel) { sel = +sel || 4; var o = function (g, l) { return '<option value="' + g + '"' + (g === sel ? ' selected' : '') + '>' + l + '</option>'; }; return '<optgroup label="Tiểu học">' + [1, 2, 3, 4, 5].map(function (g) { return o(g, 'Lớp ' + g); }).join('') + '</optgroup><optgroup label="THCS">' + [6, 7, 8, 9].map(function (g) { return o(g, 'Lớp ' + g); }).join('') + '</optgroup><optgroup label="THPT">' + [10, 11, 12].map(function (g) { return o(g, 'Lớp ' + g); }).join('') + '</optgroup><optgroup label="Khoá học riêng">' + COURSES.map(function (c) { return o(c[0], c[1]); }).join('') + '</optgroup>'; };
  var AUDURL = {};
  LN.audUrl = function (k) { if (AUDURL[k]) return AUDURL[k]; var b = (window.AUDE || {})[k]; if (!b) return ''; try { var bin = atob(b), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); AUDURL[k] = URL.createObjectURL(new Blob([arr], { type: 'audio/mpeg' })); } catch (e) { AUDURL[k] = 'data:audio/mpeg;base64,' + b; } return AUDURL[k]; };
  LN.hasUnits = function (g) { return !!SETS[+g]; };
  LN.curGrade = function () { return CURG; };
  LN.useGrade = function (g) {
    g = SETS[+g] ? +g : 4; if (g === CURG) return;
    CURG = g; UNITS.length = 0; SETS[g].forEach(function (x) { UNITS.push(x); }); PICIDX = null;
    REVIEWS = LN.REVIEWS = g === 4 ? window.REVIEWS4 : [];
  };
  /* ---------- Hình minh hoạ thay cho ô chữ: lịch, đồng hồ, giới từ… ---------- */
  var DAYS = { T2: 'Thứ 2', T3: 'Thứ 3', T4: 'Thứ 4', T5: 'Thứ 5', T6: 'Thứ 6', T7: 'Thứ 7', CN: 'Chủ nhật' };
  function svgT(inner, cls) { return '<svg class="ptile2 ' + (cls || '') + '" viewBox="0 0 64 56" aria-hidden="true">' + inner + '</svg>'; }
  function calSvg(top, big, col, emo) {
    return '<rect x="8" y="6" width="48" height="46" rx="9" fill="#fff" stroke="#E7D7E0" stroke-width="2"/><path d="M8 15a9 9 0 0 1 9-9h30a9 9 0 0 1 9 9v5H8z" fill="' + col + '"/><circle cx="20" cy="6" r="3" fill="#8C6A5A"/><circle cx="44" cy="6" r="3" fill="#8C6A5A"/>' +
      '<text x="32" y="18" font-size="9" font-weight="800" fill="#fff" text-anchor="middle" font-family="Quicksand,sans-serif">' + top + '</text><text x="32" y="' + (emo ? 40 : 44) + '" font-size="' + (big.length > 3 ? 13 : 20) + '" font-weight="800" fill="#3B2A3A" text-anchor="middle" font-family="Mali,sans-serif">' + big + '</text>' + (emo ? '<text x="50" y="50" font-size="11" text-anchor="middle">' + emo + '</text>' : '');
  }
  function clockSvg(min, hr) {
    var a = min / 60 * 2 * Math.PI - Math.PI / 2, b = ((hr % 12) + min / 60) / 12 * 2 * Math.PI - Math.PI / 2;
    return '<circle cx="32" cy="29" r="23" fill="#fff" stroke="#3A86FF" stroke-width="4"/>' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (k) { var t = k / 12 * 2 * Math.PI; return '<circle cx="' + (32 + 18 * Math.cos(t)) + '" cy="' + (29 + 18 * Math.sin(t)) + '" r="' + (k % 3 ? 1.2 : 2) + '" fill="#9AA6C0"/>'; }).join('') +
      '<path d="M32 29L' + (32 + 11 * Math.cos(b)) + ' ' + (29 + 11 * Math.sin(b)) + '" stroke="#3B2A3A" stroke-width="4" stroke-linecap="round"/><path d="M32 29L' + (32 + 17 * Math.cos(a)) + ' ' + (29 + 17 * Math.sin(a)) + '" stroke="#FF5C9A" stroke-width="3" stroke-linecap="round"/><circle cx="32" cy="29" r="3" fill="#FF5C9A"/>';
  }
  var BOX = function (x, y) { return '<rect x="' + x + '" y="' + y + '" width="22" height="18" rx="3" fill="#E8A86A" stroke="#B97A3E" stroke-width="2"/><path d="M' + (x + 11) + ' ' + y + 'v18" stroke="#B97A3E" stroke-width="1.5"/>'; };
  var BALL = function (x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 7) + '" fill="#FF5C7A"/><circle cx="' + (x - 2) + '" cy="' + (y - 2.5) + '" r="2" fill="#fff" opacity=".7"/>'; };
  var WORDT = function (t, e, col) { return '<rect x="3" y="8" width="58" height="40" rx="14" fill="' + col + '"/><text x="32" y="' + (e ? 27 : 34) + '" font-size="' + (e ? 15 : 13) + '" text-anchor="middle">' + (e || '') + '</text><text x="32" y="' + (e ? 42 : 34) + '" font-size="' + (t.length > 6 ? 9 : 11) + '" font-weight="800" fill="#fff" text-anchor="middle" font-family="Mali,sans-serif">' + t + '</text>'; };
  var SEASON = { 1: '❄️', 2: '🌸', 3: '🌸', 4: '🌸', 5: '☀️', 6: '☀️', 7: '☀️', 8: '☀️', 9: '🍂', 10: '🍂', 11: '🍂', 12: '❄️' };
  var SPECIAL = {
    at: '<path d="M32 50s-15-14-15-25a15 15 0 0 1 30 0c0 11-15 25-15 25z" fill="#FF5C7A"/><circle cx="32" cy="25" r="6" fill="#fff"/><ellipse cx="32" cy="51" rx="12" ry="3" fill="#000" opacity=".12"/>',
    on: BOX(21, 30) + BALL(32, 22, 8),
    in: BOX(21, 26) + BALL(32, 30, 6) + '<rect x="21" y="32" width="22" height="12" rx="3" fill="#E8A86A" stroke="#B97A3E" stroke-width="2"/>',
    sau: BALL(40, 26, 9) + BOX(17, 26),
    'giữa': BOX(4, 28) + BOX(38, 28) + BALL(32, 37, 6),
    'gần': BOX(10, 28) + BALL(44, 38, 7) + '<path d="M34 38h-2" stroke="#3B2A3A" stroke-width="2" stroke-linecap="round"/>',
    'đối diện': '<rect x="0" y="40" width="64" height="10" fill="#B9C3D6"/><path d="M4 40h56" stroke="#fff" stroke-width="1.5" stroke-dasharray="4 3"/><path d="M4 20l10-9 10 9v18H4z" fill="#FF9EC4"/><path d="M40 20l10-9 10 9v18H40z" fill="#8EC8FF"/><path d="M28 22l-4 3 4 3M36 22l4 3-4 3" stroke="#3B2A3A" stroke-width="2" fill="none"/>',
    but: WORDT('nhưng', '👍↔️👎', '#A66CFF'), 'vì': WORDT('vì / bởi vì', '❓➡️💡', '#3A86FF'), last: WORDT('trước', '⏮️', '#FF7B39'),
    'hôm qua': calSvg('hôm qua', '⬅', '#8B5CF6'), 'dài': '<rect x="4" y="22" width="56" height="14" rx="4" fill="#FFD24D" stroke="#E59B00" stroke-width="2"/>' + [10, 18, 26, 34, 42, 50].map(function (x) { return '<path d="M' + x + ' 22v6" stroke="#B97A00" stroke-width="1.5"/>'; }).join('') + '<path d="M6 14h52M6 14l5-4M6 14l5 4M58 14l-5-4M58 14l-5 4" stroke="#FF5C7A" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
    get: WORDT('lấy / nhận', '🤲🎁', '#22B38A'), '1000': '<rect x="3" y="12" width="58" height="32" rx="12" fill="#FFC93C"/><text x="32" y="34" font-size="17" font-weight="800" fill="#6B4A00" text-anchor="middle" font-family="Mali,sans-serif">1000</text>',
    '15': clockSvg(15, 7), '30': clockSvg(30, 7), '45': clockSvg(45, 7)
  };
  var IMGURL = {};
  function imgUrl(k, src) {
    var key = (src || 'IMG1') + ':' + k;
    if (IMGURL[key]) return IMGURL[key];
    var b = (window[src || 'IMG1'] || {})[k]; if (!b) return '';
    var k0 = k; k = key;
    try { var bin = atob(b), arr = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); IMGURL[k] = URL.createObjectURL(new Blob([arr], { type: 'image/webp' })); }
    catch (e) { IMGURL[k] = 'data:image/webp;base64,' + b; }
    return IMGURL[k];
  }
  LN.imgUrl = imgUrl;
  function picHtml(p, cls) {
    if (p && p.slice(0, 4) === 'img:') return '<img class="fcimg ' + (cls || '') + '" src="' + imgUrl(p.slice(4)) + '" alt="" draggable="false">';
    if (p && p.slice(0, 5) === 'img2:') return '<img class="fcimg ' + (cls || '') + '" src="' + imgUrl(p.slice(5), 'IMG2') + '" alt="" draggable="false">';
    if (p && p.slice(0, 4) === 'art:') return hasArt(p.slice(4)) ? art(p.slice(4), 0, 'fcimg ' + (cls || '')) : '';
    if (p && p.slice(0, 5) === 'imge:') return '<img class="fcimg ' + (cls || '') + '" src="' + imgUrl(p.slice(5), 'IMGE') + '" alt="" draggable="false">';
    if (p && p.slice(0, 5) === 'imgf:') return '<img class="fcimg ' + (cls || '') + '" src="' + imgUrl(p.slice(5), 'IMGF') + '" alt="" draggable="false">';
    if (p && p.slice(0, 5) === 'img3:') return '<img class="fcimg ' + (cls || '') + '" src="' + imgUrl(p.slice(5), 'IMG3') + '" alt="" draggable="false">';
    if (p && p.charAt(0) === '#') {
      var k = p.slice(1);
      if (DAYS[k]) return svgT(calSvg(DAYS[k], k === 'CN' ? 'CN' : k.slice(1), k === 'CN' ? '#FF5C7A' : '#3A86FF'), cls);
      if (/^\d{1,2}$/.test(k) && +k >= 1 && +k <= 12) return svgT(calSvg('Tháng', String(+k), '#22B38A', SEASON[+k]), cls);
      if (SPECIAL[k]) return svgT(SPECIAL[k], cls);
      return '<span class="ptile ' + (cls || '') + '">' + esc(k) + '</span>';
    }
    return '<span class="emo">' + esc(p || '') + '</span>';
  }
  /* Minh hoạ cho câu: tìm từ vựng / tên người có trong câu */
  var PICIDX = null, EXTRA = { lily: '👧', mai: '👧', linda: '👧', mary: '👧', anna: '👧', lucy: '👧', jane: '👧', hoa: '👧', lan: '👧', nga: '👧', trang: '👧', daisy: '👧', tom: '👦', nam: '👦', bill: '👦', ben: '👦', peter: '👦', tony: '👦', john: '👦', jack: '👦', minh: '👦', phong: '👦', quan: '👦', mother: '👩', mum: '👩', mom: '👩', father: '👨', dad: '👨', brother: '👦', sister: '👧', grandma: '👵', grandpa: '👴', teacher: '🧑‍🏫', school: '🏫', birthday: '🎂', friend: '🧒', friends: '🧒', cat: '🐱', dog: '🐶', book: '📘', football: '⚽', swim: '🏊', sing: '🎤', dance: '💃', cake: '🎂', park: '🌳', zoo: '🦁', beach: '🏖️', english: '🇬🇧', music: '🎵', art: '🎨', maths: '➗', science: '🔬' };
  var sentPics = LN.sentPics = function (text, max) {
    if (!PICIDX) { PICIDX = []; UNITS.forEach(function (u) { u.vocab.forEach(function (v) { if (v[2] && v[2].charAt(0) !== '#' && v[0].length > 2) PICIDX.push([v[0].toLowerCase(), v[2]]); }); }); Object.keys(EXTRA).forEach(function (k) { PICIDX.push([k, EXTRA[k]]); }); PICIDX.sort(function (a, b) { return b[0].length - a[0].length; }); }
    var t = ' ' + String(text || '').toLowerCase().replace(/[^a-z' ]+/g, ' ') + ' ', out = [], used = {};
    for (var i = 0; i < PICIDX.length && out.length < (max || 3); i++) {
      var w = PICIDX[i][0]; if (t.indexOf(' ' + w + ' ') < 0 && t.indexOf(' ' + w + 's ') < 0) continue;
      if (used[PICIDX[i][1]]) continue; used[PICIDX[i][1]] = 1; out.push(PICIDX[i][1]); t = t.replace(' ' + w + ' ', ' ');
    }
    return out;
  };

  var registerImports = LN.registerImports = function () {
    Object.keys(EX).forEach(function (k) { if (EX[k].imp) delete EX[k]; });
    (store.get('ln_imports', []) || []).forEach(function (e) { if (e.items && e.items.length) EX[e.id] = { ex: e, unit: null, imp: true }; });
  };
  registerImports();
  /* Bài luyện tập theo từng phần ngữ pháp */
  (function () {
    var GP = window.GRAMMAR_PRACTICE || {}, EXP = window.EXPLAIN = window.EXPLAIN || {};
    Object.keys(GP).forEach(function (tid) {
      GP[tid].forEach(function (set, k) {
        var id = 'gp-' + tid + '-' + k;
        EX[id] = { gp: true, unit: null, ex: { id: id, title: set.sec, topic: tid, type: 'mcq', gp: true, items: set.items.map(function (it) { return it.type === 'mcq' ? { type: 'mcq', q: it.q, o: it.o, a: it.a } : { type: 'fill', q: it.q, a: it.a }; }) } };
        set.items.forEach(function (it, i) { EXP[id + '#' + i] = { vi: it.vi || '', why: it.why || '' }; });
      });
    });
  })();
  LN.practiceFor = function (tid) { return Object.keys(EX).filter(function (k) { return EX[k].gp && EX[k].ex.topic === tid; }).map(function (k) { return EX[k].ex; }); };
  LN.importsFor = function (tid) { return Object.keys(EX).filter(function (k) { return EX[k].imp && EX[k].ex.topic === tid; }).map(function (k) { return EX[k].ex; }); };
  var REVIEWS = LN.REVIEWS = window.REVIEWS4;
  function itemCount(e) { return e.type === 'match' ? e.left.length : e.items.length; }
  LN.itemCount = itemCount;

  /* Ngữ pháp: nội dung mặc định + chỉnh sửa của giáo viên (lưu ln_grammar). Có bộ nhớ đệm vì nội dung lớn. */
  (function migrateGrammar() {
    if (store.get('ln_grammar_v', 0) >= (window.GRAMMAR_VERSION || 3)) return;
    var st = store.get('ln_grammar', null), defIds = window.GRAMMAR_DEFAULT.map(function (x) { return x.id; });
    if (st) { st = st.filter(function (x) { return defIds.indexOf(x.id) < 0; }); if (st.length) store.set('ln_grammar', st); else store.del('ln_grammar'); }
    store.set('ln_grammar_v', window.GRAMMAR_VERSION || 3);
  })();
  var GVER = 0, GCACHE = null, GCV = -1;
  var _set = store.set, _del = store.del;
  store.set = function (k, v) { if (/^ln_grammar/.test(k)) GVER++; _set(k, v); };
  store.del = function (k) { if (/^ln_grammar/.test(k)) GVER++; _del(k); };
  var grammar = LN.grammar = function () {
    if (GCACHE && GCV === GVER) return GCACHE;
    var def = window.GRAMMAR_DEFAULT.map(function (x) { return Object.assign({}, x); }), st = store.get('ln_grammar', null), out;
    if (!st) out = def;
    else {
      var del = store.get('ln_grammar_del', []), ids = st.map(function (x) { return x.id; });
      st = st.map(function (x) { if (x.ref) { var dd = def.filter(function (y) { return y.id === x.id; })[0]; return dd || null; } return x; }).filter(Boolean); ids = st.map(function (x) { return x.id; });
      st.forEach(function (x) { var d = def.filter(function (y) { return y.id === x.id; })[0]; if (!x.block) x.block = d ? d.block : 'other'; if (!x.icon) x.icon = d ? d.icon : '📘'; if (d && d.no && !x.no) x.no = d.no; });
      def.forEach(function (d) { if (ids.indexOf(d.id) < 0 && del.indexOf(d.id) < 0) st.push(d); });
      out = st;
    }
    GCACHE = out; GCV = GVER; return out;
  };
  /* Chỉ lưu những chủ điểm giáo viên đã sửa / thêm; chủ điểm giữ nguyên chỉ lưu tham chiếu để nhận bản cập nhật sau này */
  LN.saveGrammar = function (list) {
    var KEYS = ['id', 'block', 'group', 'icon', 'title', 'en', 'summary', 'body', 'no'];
    store.set('ln_grammar', list.map(function (x) {
      var d = window.GRAMMAR_DEFAULT.filter(function (y) { return y.id === x.id; })[0];
      if (d && KEYS.every(function (k) { return (x[k] || '') === (d[k] || ''); }) && !x.explain && !x.table && !x.examples) return { id: x.id, ref: 1 };
      return x;
    }));
  };
  var topicName = LN.topicName = function (id) {
    if (TOPIC_NAMES[id]) return TOPIC_NAMES[id];
    var t = grammar().filter(function (x) { return x.id === id; })[0];
    if (!t) t = window.GRAMMAR_DEFAULT.filter(function (x) { return x.id === id; })[0];
    return t ? t.title : id;
  };

  /* ================= Tài khoản & tiến độ ================= */
  var users = LN.users = function () { return store.get('ln_users', {}); };
  var me = LN.me = function () { var u = store.get('ln_session', null); var all = users(); return u && all[u] ? Object.assign({ username: u }, all[u]) : null; };
  var progOf = LN.progOf = function (username) {
    var p = store.get('ln_prog_' + username, null) || {};
    ['seen', 'ex', 'mistakes', 'days', 'topics', 'games', 'vlearn'].forEach(function (k) { p[k] = p[k] || {}; });
    p.log = p.log || []; p.stars = p.stars || 0;
    return p;
  };
  function prog() { var u = me(); return progOf(u ? u.username : '_'); }
  function saveProg(p) { var u = me(); if (u) { p.updated = Date.now(); store.set('ln_prog_' + u.username, p); var all = users(); if (all[u.username]) { all[u.username].last = Date.now(); store.set('ln_users', all); } } }
  LN.saveProgOf = function (username, p) { store.set('ln_prog_' + username, p); };

  var unitSteps = LN.unitSteps = function (u, p) {
    var s = [
      { key: 'vocab', label: 'Học từ vựng', tab: 'vocab', done: !!p.vlearn[u.n] },
      { key: 'pattern', label: 'Học mẫu câu', tab: 'pattern', done: !!p.seen['p' + u.n] }
    ];
    if (u.speaking && u.speaking.length) s.push({ key: 'speak', label: 'Luyện nói', tab: 'speak', done: !!(p.games[u.n] || {}).speakq });
    u.exercises.forEach(function (e) { var r = p.ex[e.id]; s.push({ key: e.id, label: e.title, ex: e, done: !!r, best: r ? r.best : null }); });
    return s;
  };
  var unitStat = LN.unitStat = function (u, p) {
    var s = unitSteps(u, p), d = 0, sc = 0, n = 0;
    s.forEach(function (x) { if (x.done) d++; if (x.best != null) { sc += x.best; n++; } });
    return { steps: s, done: d, total: s.length, pct: pct(d, s.length), avg: n ? Math.round(sc / n) : null, started: d > 0 };
  };
  function currentUnit(p) { for (var i = 0; i < UNITS.length; i++) if (unitStat(UNITS[i], p).pct < 100) return UNITS[i]; return UNITS[UNITS.length - 1]; }
  function nextStep(u, p) { var s = unitSteps(u, p); for (var i = 0; i < s.length; i++) if (!s[i].done) return s[i]; return null; }
  function stepHref(u, st) { if (!st) return '#/unit/' + u.n + '/practice'; return st.ex ? '#/ex/' + st.ex.id : '#/unit/' + u.n + '/' + st.tab; }
  var streak = LN.streak = function (p) { var n = 0, d = new Date(); if (!p.days[dayKey(d)]) d.setDate(d.getDate() - 1); while (p.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); } return n; };
  var openMistakes = LN.openMistakes = function (p) { return Object.keys(p.mistakes).map(function (k) { return Object.assign({ key: k }, p.mistakes[k]); }).filter(function (m) { return EX[m.exId]; }); };
  var GOAL = 20;

  /* ================= Câu hỏi ================= */
  var itemFrom = LN.itemFrom = function (exId, idx) {
    var r = EX[exId]; if (!r) return null; var e = r.ex;
    if (e.type === 'match') {
      var others = e.right.filter(function (_, j) { return j !== e.a[idx]; });
      var o = shuffle([e.right[e.a[idx]]].concat(shuffle(others).slice(0, 3)));
      return { type: 'mcq', q: e.left[idx], o: o, a: o.indexOf(e.right[e.a[idx]]), src: { exId: exId, idx: idx }, kind: 'Chọn câu trả lời hợp' };
    }
    var it = e.items[idx]; if (!it) return null;
    return Object.assign({}, it, { type: it.type || e.type, bank: e.bank, prefill: e.type === 'fix' && /^Tìm lỗi/.test(e.title), src: { exId: exId, idx: idx } });
  };
  /* Dịch + giải thích cho câu làm sai */
  function mdb(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
  LN.mdb = mdb;
  var explain = LN.explain = function (it) {
    if (!it || !it.src) return null;
    var E = window.EXPLAIN || {}, SV = window.SENT_VI || {}, k = it.src.exId + '#' + it.src.idx, r = EX[it.src.exId], e = r && r.ex;
    if (E[k]) return E[k];
    if (!e) return null;
    if (e.gen === 'vocab' || e.gen === 'vocab1') { var vv = r.unit && r.unit.vocab[it.src.idx]; return vv ? { vi: '“' + vv[0] + '” nghĩa là “' + vv[1] + '”.', why: 'Từ mới của Unit ' + r.unit.n + '. Chơi **Thẻ từ** hoặc **Nghe và chọn** để nhớ lâu hơn nhé.' } : null; }
    var ans = answerText(it);
    if (/p1$/.test(e.id) && SV[ans]) return { vi: (SV[it.q] ? SV[it.q].vi + ' — ' : '') + SV[ans].vi, why: SV[ans].why || (SV[it.q] || {}).why || '' };
    if (SV[ans]) return SV[ans];
    return { vi: '', why: 'Xem lại phần **' + topicName(e.topic) + '** trong Ngữ pháp tổng hợp nhé.' };
  };
  function explainHtml(it, small) {
    var x = explain(it); if (!x || (!x.vi && !x.why)) return '';
    var r = EX[it.src.exId], t = r && r.ex.topic, gl = t && t !== 'vocab' && t !== 'reading' && grammar().some(function (g) { return g.id === t; });
    return '<div class="expl' + (small ? ' sm' : '') + '">' + (x.vi ? '<p><span class="xl">Dịch</span>' + esc(x.vi) + '</p>' : '') + (x.why ? '<p><span class="xl why">Vì sao</span>' + mdb(x.why) + '</p>' : '') +
      (gl && !small ? '<a class="xlink" href="#/grammar/' + t + '">📘 Xem lý thuyết: ' + esc(topicName(t)) + ' →</a>' : '') + '</div>';
  }
  LN.explainHtml = explainHtml; LN.explainOf = explain;
  LN.curItem = function () { return S && S.items && S.items[S.i] ? { it: S.items[S.i], res: S.res[S.i] } : null; };
  var answerText = LN.answerText = function (it) { return it.type === 'mcq' ? it.o[it.a] : it.a[0]; };
  function kindLabel(it) { return it.kind || { mcq: 'Chọn đáp án đúng', fill: 'Điền vào chỗ trống', order: 'Sắp xếp thành câu', fix: 'Viết lại câu đúng' }[it.type] || ''; }

  var S = null;
  function buildSet(id) {
    var r = EX[id];
    if (r) {
      var e = r.ex, u = r.unit, rd = [];
      if (!u) return { id: id, exId: id, title: e.title, sub: 'Ngữ pháp tổng hợp · ' + topicName(e.topic), back: '#/grammar/' + e.topic, readings: [], items: e.items.map(function (_, i) { return itemFrom(id, i); }) };
      if (e.reading === 'all') rd = u.readings; else if (typeof e.reading === 'number' && u.readings[e.reading]) rd = [u.readings[e.reading]];
      if (e.gen === 'vocab') e.items = vocabItems(u.vocab); else if (e.gen === 'vocab1') e.items = vocabItems1(u.vocab);
      var base = { id: id, exId: id, title: e.title, sub: 'Unit ' + u.n + ' · ' + u.title, back: '#/unit/' + u.n + '/practice', readings: rd, intro: e.intro, bank: e.bank, unit: u.n };
      if (e.type === 'match') return Object.assign(base, { match: e, items: [] });
      return Object.assign(base, { items: e.items.map(function (_, i) { return itemFrom(id, i); }) });
    }
    function poolFrom(filter) {
      var pool = [];
      Object.keys(EX).forEach(function (k) { var x = EX[k]; if (!filter(x)) return; for (var i = 0; i < itemCount(x.ex); i++) pool.push([k, i]); });
      return pool;
    }
    if (id.indexOf('topic-') === 0) {
      var tid = id.slice(6);
      var p1 = poolFrom(function (x) { return x.ex.topic === tid && x.ex.reading == null; });
      return { id: id, exId: id, title: 'Luyện: ' + topicName(tid), sub: 'Ngữ pháp tổng hợp · 10 câu', back: '#/grammar/' + tid, items: shuffle(p1).slice(0, 10).map(function (q) { return itemFrom(q[0], q[1]); }), readings: [] };
    }
    if (id === 'mistakes') {
      var ms = shuffle(openMistakes(prog())).slice(0, 12).map(function (m) { return itemFrom(m.exId, m.idx); }).filter(Boolean);
      return { id: id, title: 'Ôn câu sai', sub: 'Làm đúng thì câu được xoá khỏi danh sách', back: '#/mistakes', items: ms, readings: [], review: true };
    }
    var rv = REVIEWS.filter(function (x) { return x.id === id; })[0];
    if (rv) {
      var p2 = poolFrom(function (x) { return x.unit && x.unit.n >= rv.from && x.unit.n <= rv.to && x.ex.reading == null; });
      return { id: id, exId: id, title: rv.title + ': Unit ' + rv.from + '–' + rv.to, sub: '20 câu trộn từ các Unit', back: '#/learn', items: shuffle(p2).slice(0, 20).map(function (q) { return itemFrom(q[0], q[1]); }), readings: [] };
    }
    return null;
  }
  function recordAnswer(it, ok) {
    var p = prog(), k = it.src.exId + '#' + it.src.idx, t = EX[it.src.exId] ? EX[it.src.exId].ex.topic : 'other';
    if (ok) delete p.mistakes[k];
    else { var m = p.mistakes[k] || { exId: it.src.exId, idx: it.src.idx, n: 0 }; m.n++; m.t = Date.now(); p.mistakes[k] = m; }
    p.topics[t] = p.topics[t] || [0, 0]; p.topics[t][1]++; if (ok) { p.topics[t][0]++; p.stars++; }
    p.days[dayKey()] = (p.days[dayKey()] || 0) + 1;
    saveProg(p);
  }
  function finishSet() {
    var right = S.res.filter(function (r) { return r.ok; }).length, total = S.res.length, p = prog(), score = pct(right, total);
    if (S.exId) {
      var r = p.ex[S.exId] || { best: 0, attempts: 0 }; r.best = Math.max(r.best, score); r.last = score; r.attempts++; r.t = Date.now(); p.ex[S.exId] = r;
      var ex = EX[S.exId]; if (ex && ex.unit && /^vocab/.test(ex.ex.gen || '')) p.vlearn[ex.unit.n] = true;
    }
    p.log.push({ id: S.id, title: S.title, right: right, total: total, t: Date.now() }); if (p.log.length > 400) p.log = p.log.slice(-400);
    saveProg(p);
    S.phase = 'done'; S.score = score; S.right = right; delete PLAYCACHE[S.id];
    if (score >= 70) { sfx.win(); confetti(); }
  }

  /* ================= Khung ================= */
  var app = document.getElementById('app');
  var render = LN.render = function (h) { app.innerHTML = h; document.body.classList.remove('in-game'); window.scrollTo(0, 0); };
  var logo = LN.logo = function (s) {
    s = s || 40;
    return '<svg class="logo" width="' + s + '" height="' + s + '" viewBox="0 0 48 48" aria-hidden="true"><defs><linearGradient id="lgA" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF5C9A"/><stop offset=".5" stop-color="#8B5CF6"/><stop offset="1" stop-color="#14C8B4"/></linearGradient></defs>' +
      '<rect x="2" y="2" width="44" height="44" rx="14" fill="url(#lgA)"/><path d="M8 30c8-10 16-12 32-10" stroke="#fff" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M8 36c9-8 18-9 32-6" stroke="#fff" stroke-opacity=".3" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M24 9l2.6 6.4 6.9.5-5.3 4.4 1.7 6.7L24 23.3l-5.9 3.7 1.7-6.7-5.3-4.4 6.9-.5z" fill="#FFE066"/></svg>';
  };
  var BRAND = '<span class="bname">Aurora <b>English</b></span>';
  function header(active) {
    var u = me();
    if (!u) return '<header class="topbar"><div class="wrap"><a class="brand" href="#/">' + logo(40) + BRAND + '</a><div class="tr"><a class="btn btn-sm btn-pink" href="#/auth/login">Đăng nhập</a></div></div></header>';
    var p = prog(), mc = openMistakes(p).length, st = settings();
    function nl(id, href, icon, label, extra) { return '<a href="' + href + '" class="' + (active === id ? 'on' : '') + '">' + cic(icon, 26) + '<span>' + label + '</span>' + (extra || '') + '</a>'; }
    return '<header class="topbar"><div class="wrap"><a class="brand" href="#/home">' + logo(40) + BRAND + '</a>' +
      '<nav class="nav" aria-label="Chính">' + nl('home', '#/home', 'home', 'Trang chủ') + nl('learn', '#/learn', 'learn', 'Bài học') + nl('games', '#/games', 'games', 'Trò chơi') +
      nl('grammar', '#/grammar', 'grammar', 'Ngữ pháp') + nl('mistakes', '#/mistakes', 'heal', 'Ôn câu sai', mc ? '<span class="cnt">' + mc + '</span>' : '') + nl('ai', '#/ai', 'ai', 'Hỏi Chíp') + '</nav>' +
      '<div class="tr"><span class="pillstat ps-star" title="Sao đã thu thập">' + cic('star', 24) + '<b>' + p.stars + '</b></span><span class="pillstat ps-fire" title="Số ngày học liên tiếp">' + cic('fire', 24) + '<b>' + streak(p) + '</b></span>' +
      '<button class="ibtn sm' + (st.music ? ' on' : '') + '" data-act="music" aria-pressed="' + st.music + '" title="' + (st.music ? 'Tắt' : 'Bật') + ' nhạc nền">' + cic(st.music ? 'music' : 'musicoff', 24) + '</button>' +
      '<button class="ibtn sm' + (st.sound ? ' on' : '') + '" data-act="sound" aria-pressed="' + st.sound + '" title="' + (st.sound ? 'Tắt' : 'Bật') + ' âm thanh đúng/sai">' + cic(st.sound ? 'sound' : 'mute', 24) + '</button>' +
      '<a class="me' + (active === 'account' ? ' on' : '') + '" href="#/account" title="Tài khoản, đổi mật khẩu"><span class="ava">' + esc(u.name.trim().split(/\s+/).pop().charAt(0).toUpperCase()) + '</span><span class="mename">' + esc(u.name.trim().split(/\s+/).pop()) + '</span></a>' +
      '<button class="ibtn sm" data-act="logout" aria-label="Thoát" title="Thoát">' + cic('out', 24) + '</button></div></div></header>';
  }
  LN.header = header;
  function footer() { return '<footer class="foot"><div class="wrap"><span>' + logo(22) + ' <b>Aurora English</b> · Tiếng Anh · Global Success &amp; Everybody Up · ' + (LN.cloud && LN.cloud.on ? '☁️ Dữ liệu được lưu trên mạng' : 'Dữ liệu lưu trong trình duyệt này') + '</span><a href="#/admin">Giáo viên đăng nhập</a></div></footer>'; }

  LN.footer = footer;
  /* ================= Trang giới thiệu ================= */
  function viewLanding() {
    var C = [[1, 'Lớp 1', 'Global Success'], [2, 'Lớp 2', 'Global Success'], [3, 'Lớp 3', 'Global Success'], [4, 'Lớp 4', 'Global Success'], [101, 'Everybody Up 1', 'Oxford'], [102, 'Everybody Up 2', 'Oxford']];
    var NU = { 1: 16, 2: 16, 3: 20, 101: 8, 102: 8 }, COL = ['#FF5C9A', '#FF8A3D', '#2EC4A0', '#3A9BFF', '#8B5CF6', '#E23E7D'];
    var chips = C.filter(function (c) { return SETS[c[0]] || NU[c[0]]; }).map(function (c, i) { var n = SETS[c[0]] ? SETS[c[0]].length : NU[c[0]]; return '<div class="crs" style="--c:' + COL[i % COL.length] + '"><b>' + c[1] + '</b><span>' + c[2] + ' · ' + n + ' Unit</span></div>'; }).join('');
    render(header() +
      '<main><section class="hero"><div class="wrap"><div style="flex:999 1 440px;min-width:0">' +
      '<span class="tag tag-pink" style="font-size:14px">Tiếng Anh · Global Success & Everybody Up</span>' +
      '<h1>Aurora English<br><em>học vui như chơi</em></h1>' +
      '<p class="lead">Bài học bám sát sách giáo khoa: từ vựng có hình, mẫu câu, luyện nói, bài tập bổ trợ, bài kiểm tra và file nghe. Mỗi bé đăng nhập sẽ vào đúng lớp của mình, học cùng ' + GAMES.length + ' trò chơi và trợ lý AI Chíp.</p>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center"><a class="btn btn-lg btn-pink" href="#/auth/login">Đăng nhập để học</a>' + ((store.get('ln_class', {}) || {}).allowReg ? '<a class="btn btn-lg" href="#/auth/register">Tạo tài khoản</a>' : '<span class="small muted">Tài khoản do giáo viên cấp</span>') + '</div></div>' +
      '<div class="blob">' + chibi({ size: 240, mood: 'wow', pose: 'wave', acc: 'grad', cls: 'bob' }) +
      '<span class="float-word" style="left:6%;top:12%">Hello!</span><span class="float-word" style="right:4%;bottom:20%;transform:rotate(6deg)">🍇 grapes</span><span class="float-word" style="left:10%;bottom:8%;transform:rotate(-5deg)">I can swim 🏊</span></div>' +
      '</div></section>' +
      '<section class="wrap"><h2 class="sub" style="margin:0 0 12px">Các khoá học</h2><div class="crss">' + chips + '</div></section>' +
      '<section class="wrap" style="padding-top:24px;padding-bottom:40px"><div class="feats">' +
      '<div class="feat f1"><div class="em">🎮</div><h3>' + GAMES.length + ' trò chơi</h3><p>Đua xe, đập chuột chũi, câu cá, bắn bóng bay, đại chiến quái vật… học từ mà như chơi.</p></div>' +
      '<div class="feat f2"><div class="em">🤖</div><h3>Trợ lý AI Chíp</h3><p>Chấm phát âm từng từ, chấm câu trả lời nói, trò chuyện tiếng Anh và giải thích câu sai.</p></div>' +
      '<div class="feat f3"><div class="em">📚</div><h3>Bám sát sách</h3><p>Bài tập bổ trợ, 3–4 bài kiểm tra mỗi Unit, file nghe có đáp án tự chấm và Ngữ pháp tổng hợp.</p></div>' +
      '<div class="feat f4"><div class="em">🏆</div><h3>Sao và sticker</h3><p>Làm đúng được sao, xong Unit được sticker. Thầy cô theo dõi bé học tới đâu ở mọi máy.</p></div>' +
      '</div></section></main>' + footer());
  }

  /* ================= Đăng ký / đăng nhập / quên mật khẩu / tài khoản ================= */
  var authErr = '', pendingRoute = null;
  var normUser = LN.normUser = function (s) { return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[đĐ]/g, 'd').toLowerCase().replace(/[^a-z0-9_]/g, ''); };
  var normContact = LN.normContact = function (s) {
    s = String(s || '').trim().toLowerCase();
    if (s.indexOf('@') < 0) { var d = s.replace(/[^0-9]/g, ''); if (d.length >= 8) return d.replace(/^84/, '0'); }
    return s.replace(/\s+/g, '');
  };
  function passOk(u, user, p) { return !!u && (u.pass === LN.hash(user + ':' + p) || u.pass === LN.hash(user + ':' + p.trim())); }
  var passField = LN.passField = function (id, name, label, ac, ph) {
    return '<div class="field"><label for="' + id + '">' + label + '</label><div class="pwbox"><input class="inp" id="' + id + '" name="' + name + '" type="password" autocomplete="' + ac + '" autocapitalize="none" autocorrect="off" spellcheck="false" placeholder="' + esc(ph || '') + '">' +
      '<button type="button" class="pweye" data-act="pweye" data-for="' + id + '" aria-label="Hiện / ẩn mật khẩu" title="Hiện / ẩn mật khẩu">' + ic('eye', 19) + '</button></div><p class="capswarn" data-caps="' + id + '" hidden>⚠ Đang bật Caps Lock (chữ in hoa)</p></div>';
  };
  function storageNote() {
    return LN.persistent ? '' : '<div class="ferr" style="margin-bottom:14px" role="alert">⚠ Trình duyệt này đang <b>chặn lưu dữ liệu</b> (chế độ xem trước / ẩn danh). Tài khoản sẽ mất khi tải lại trang. Hãy tải file về máy rồi mở bằng Chrome hoặc Edge.</div>';
  }
  function authShell(mascotMsg, mood, inner) {
    render(header() + '<main class="auth"><div class="auth-side">' + chick(180, mood) + '<div class="bubble" style="margin-top:14px;text-align:left">' + mascotMsg + '</div></div><div class="auth-card">' + inner + '</div></main>' + footer());
  }
  function viewAuth(mode, notice) {
    var allowReg = !!(store.get('ln_class', {}) || {}).allowReg;
    var reg = mode !== 'login' && allowReg;
    var grades = LN.gradeOpts(4);
    var err = authErr ? '<div class="ferr" role="alert">' + authErr + '</div>' : '';
    var form = reg ?
      '<form id="f-reg" novalidate>' + err +
      '<div class="field"><label for="r-name">Tên của bé</label><input class="inp" id="r-name" name="name" placeholder="Nguyễn Minh An" autocomplete="off"></div>' +
      '<div class="two"><div class="field"><label for="r-grade">Lớp</label><select class="sel" id="r-grade" name="grade">' + grades + '</select></div>' +
      '<div class="field"><label for="r-user">Tên đăng nhập</label><input class="inp" id="r-user" name="user" placeholder="minhan4" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"></div></div>' +
      '<p class="small muted" style="margin:-8px 0 14px">Chỉ gồm chữ thường không dấu và số (3–20 ký tự). Ví dụ: <b>minhan4</b>.</p>' +
      '<div class="two">' + passField('r-pass', 'pass', 'Mật khẩu', 'new-password', 'Ít nhất 6 ký tự') + passField('r-pass2', 'pass2', 'Nhập lại mật khẩu', 'new-password', 'Gõ lại cho chắc') + '</div>' +
      '<div class="field"><label for="r-mail">Email hoặc số điện thoại phụ huynh</label><input class="inp" id="r-mail" name="mail" placeholder="bome@email.com hoặc 09…"><p class="hint">Dùng để lấy lại mật khẩu khi bé quên, và để giáo viên gửi báo cáo.</p></div>' +
      '<label class="chk"><input type="checkbox" name="ok" id="r-ok"><span>Tôi là phụ huynh và đồng ý cho bé dùng tài khoản này.</span></label>' +
      '<button class="btn btn-lg btn-pink btn-block" type="submit">Tạo tài khoản và vào học</button></form>'
      :
      '<form id="f-login" novalidate>' + err +
      '<div class="field"><label for="l-user">Tên đăng nhập</label><input class="inp" id="l-user" name="user" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false"></div>' +
      passField('l-pass', 'pass', 'Mật khẩu', 'current-password') +
      '<button class="btn btn-lg btn-pink btn-block" type="submit" style="margin-top:6px">Vào học</button>' +
      '<p class="center small muted" style="margin-top:14px">Quên mật khẩu? Bố mẹ nhắn giáo viên để được cấp lại nhé.</p></form>';
    authShell(reg ? 'Tạo tài khoản để Chíp nhớ bé đã học tới đâu nhé!' : 'Chào bé! Nhập tên đăng nhập và mật khẩu để học tiếp nào.', reg ? 'wow' : 'happy',
      storageNote() + (notice ? '<div class="note note-yel" style="margin-bottom:14px">' + esc(notice) + '</div>' : '') +
      (allowReg ? '<div class="seg"><button type="button" class="' + (reg ? 'on' : '') + '" data-go="#/auth/register">Đăng ký</button><button type="button" class="' + (reg ? '' : 'on') + '" data-go="#/auth/login">Đăng nhập</button></div>' : '<div class="note note-yel" style="margin-bottom:14px">🔑 Tài khoản do giáo viên cấp cho bé và phụ huynh.</div>') + form);
    authErr = '';
    var f = document.getElementById(reg ? 'f-reg' : 'f-login');
    var ru = document.getElementById('r-user');
    if (ru) ru.addEventListener('input', function () { var v = normUser(ru.value); if (v !== ru.value) ru.value = v; });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var d = new FormData(f), all = users();
      if (reg) {
        var name = String(d.get('name') || '').trim(), user = normUser(d.get('user')), pass = String(d.get('pass') || ''), mail = String(d.get('mail') || '').trim();
        if (!name) authErr = 'Nhập tên của bé.';
        else if (!/^[a-z0-9_]{3,20}$/.test(user)) authErr = 'Tên đăng nhập chỉ gồm chữ thường không dấu và số, dài 3–20 ký tự.';
        else if (all[user]) authErr = 'Tên “' + esc(user) + '” đã có người dùng. Chọn tên khác nhé.';
        else if (pass.length < 6) authErr = 'Mật khẩu cần ít nhất 6 ký tự.';
        else if (pass !== String(d.get('pass2') || '')) authErr = 'Hai lần nhập mật khẩu chưa giống nhau. Gõ lại nhé.';
        else if (normContact(mail).length < 6) authErr = 'Nhập email hoặc số điện thoại phụ huynh.';
        else if (!d.get('ok')) authErr = 'Cần phụ huynh đánh dấu đồng ý.';
        if (authErr) { viewAuth('register'); return; }
        all[user] = { name: name, grade: +d.get('grade'), pass: LN.hash(user + ':' + pass), mail: mail, created: Date.now(), last: Date.now() };
        if (LN.cloud && LN.cloud.on) {
          var fb = f.querySelector('button[type=submit]'); fb.disabled = true; fb.textContent = 'Đang tạo tài khoản…';
          LN.cloud.register(user, all[user]).then(function () { store.set('ln_session', user); toast('Đã tạo tài khoản “' + user + '”. Nhớ tên đăng nhập này nhé!'); var dd = pendingRoute || '#/home'; pendingRoute = null; go(dd); },
            function (e) { authErr = e.message === 'taken' ? 'Tên “' + esc(user) + '” đã có người dùng. Chọn tên khác nhé.' : esc(e.status ? e.message : 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'); viewAuth('register'); });
          return;
        }
        store.set('ln_users', all); store.set('ln_session', user);
        var saved = users()[user];
        if (!saved || saved.pass !== LN.hash(user + ':' + pass)) toast('Lưu ý: trình duyệt chưa lưu được tài khoản.');
        else toast('Đã tạo tài khoản “' + user + '”. Nhớ tên đăng nhập này nhé!');
        var dest = pendingRoute || '#/home'; pendingRoute = null; go(dest);
      } else {
        var u2 = normUser(d.get('user')), p2 = String(d.get('pass') || '');
        if (u2 && p2 && LN.cloud && LN.cloud.on) {
          var lb = f.querySelector('button[type=submit]'); lb.disabled = true; lb.textContent = 'Đang đăng nhập…';
          LN.cloud.login(u2, LN.hash(u2 + ':' + p2), LN.hash(u2 + ':' + p2.trim())).then(function () {
            store.set('ln_session', u2); var dd2 = pendingRoute || '#/home'; pendingRoute = null; go(dd2);
          }, function (e) {
            if (!e.status && all[u2] && passOk(all[u2], u2, p2)) { store.set('ln_session', u2); toast('Đang học không có mạng – tiến độ sẽ tự lưu lên khi có mạng lại.'); go(pendingRoute || '#/home'); pendingRoute = null; return; }
            authErr = e.message === 'notfound' ? 'Không tìm thấy tài khoản “' + esc(u2) + '”. Kiểm tra lại tên đăng nhập (chữ thường, không dấu) hoặc hỏi giáo viên.' : e.message === 'badpass' ? 'Mật khẩu chưa đúng. Kiểm tra Caps Lock, bấm 👁 để xem lại, hoặc nhờ giáo viên cấp lại.' : esc(e.status ? e.message : 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.');
            viewAuth('login'); var lu2 = document.getElementById('l-user'); if (lu2) lu2.value = u2;
          });
          return;
        }
        if (!u2 || !p2) authErr = 'Nhập tên đăng nhập và mật khẩu nhé.';
        else if (!all[u2]) authErr = 'Không tìm thấy tài khoản “' + esc(u2) + '” trên trình duyệt này.' + (Object.keys(all).length ? '' : ' (Trình duyệt này chưa có tài khoản nào — tài khoản chỉ lưu ở máy và trình duyệt đã đăng ký.)');
        else if (!passOk(all[u2], u2, p2)) authErr = 'Mật khẩu chưa đúng. Kiểm tra Caps Lock, bấm 👁 để xem lại, hoặc nhờ giáo viên cấp lại.';
        if (authErr) { var keep = u2; viewAuth('login'); var lu = document.getElementById('l-user'); if (lu) lu.value = keep; return; }
        store.set('ln_session', u2); all[u2].last = Date.now(); store.set('ln_users', all);
        var dest2 = pendingRoute || '#/home'; pendingRoute = null; go(dest2);
      }
    });
  }
  var accMsg = null;
  function viewAccount() {
    var u = me(), msg = accMsg; accMsg = null;
    render(header('account') + '<main class="wrap page" style="max-width:880px"><h1 class="title" style="margin-bottom:16px">Tài khoản của bé</h1>' +
      (msg ? '<div class="' + (msg.ok ? 'note note-mint' : 'ferr') + '" style="margin-bottom:14px" role="status">' + esc(msg.t) + '</div>' : '') +
      '<div class="row" style="align-items:flex-start"><section class="card grow"><h2>Thông tin</h2><form id="f-info" novalidate>' +
      '<p class="small muted" style="margin-bottom:12px">Tên đăng nhập: <b style="color:var(--ink)">' + esc(u.username) + '</b> · ' + esc(courseName(u.grade)) + '</p>' +
      '<div class="field"><label for="ac-name">Tên của bé</label><input class="inp" id="ac-name" name="name" value="' + esc(u.name) + '"></div>' +
      '<div class="field"><label for="ac-mail">Email / số điện thoại phụ huynh</label><input class="inp" id="ac-mail" name="mail" value="' + esc(u.mail || '') + '"></div>' +
      '<button class="btn btn-pink" type="submit">Lưu thông tin</button></form></section>' +
      '<section class="card grow acc-pw">' + chibi({ size: 90, acc: 'glasses', mood: 'happy' }) + '<div><h2>Mật khẩu</h2><p class="small muted">Tài khoản và mật khẩu do giáo viên cấp. Nếu quên mật khẩu, bố mẹ nhắn giáo viên để được cấp lại nhé.</p></div></section></div>' +
      '<section class="card" style="margin-top:16px"><h2>Âm thanh</h2>' + soundSettingsHtml() + '</section></main>' + footer());
    bindSoundSettings();
    document.getElementById('f-info').addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(ev.target), all = users(), name = String(d.get('name') || '').trim(), mail = String(d.get('mail') || '').trim();
      if (!name) { accMsg = { t: 'Nhập tên của bé.' }; viewAccount(); return; }
      if (normContact(mail).length < 6) { accMsg = { t: 'Nhập email hoặc số điện thoại phụ huynh.' }; viewAccount(); return; }
      all[u.username].name = name; all[u.username].mail = mail; store.set('ln_users', all); if (LN.cloud) LN.cloud.profile(name, mail); accMsg = { ok: true, t: 'Đã lưu thông tin.' }; viewAccount();
    });
  }

  /* ================= Trang chủ ================= */
  /* Lớp chưa có bài học theo sách: học ngữ pháp + bài luyện của đúng lớp đó */
  function notReady(u, active) {
    var p = prog(), g = +u.grade, list = grammar().filter(function (x) { return x.block === 'l' + g; }), st = streak(p), B = board(), myRank = 0, first = u.name.trim().split(/\s+/).pop();
    B.forEach(function (x, i) { if (x.un === u.username) myRank = i + 1; });
    var sets = [], doneN = 0; list.forEach(function (t) { LN.practiceFor(t.id).forEach(function (e) { sets.push(e); if (p.ex[e.id]) doneN++; }); });
    var nextSet = sets.filter(function (e) { return !p.ex[e.id]; })[0];
    var info = active === 'home' ? '' : '<div class="note note-yel" style="margin-bottom:16px">📚 Bài học theo sách Lớp ' + g + ' đang được cập nhật. Trong lúc chờ, bé học <b>Ngữ pháp Lớp ' + g + '</b> và làm bài luyện bên dưới nhé!</div>';
    render(header(active) + '<main class="wrap page home2">' + info +
      '<section class="hero2"><div class="h2-art">' + chibi({ size: 180, mood: 'wow', pose: 'wave', acc: 'grad', cls: 'bob' }) + '</div><div class="h2-body"><div class="bubble">Chào ' + esc(first) + '! Mình cùng học tiếng Anh <b>Lớp ' + g + '</b> nhé!</div>' +
      '<p class="h2-unit"><span class="uic">📚</span>Ngữ pháp Lớp ' + g + '<small>' + list.length + ' chủ điểm · ' + sets.length + ' bài luyện</small></p><div class="h2-prog"><div class="bar lg"><i style="width:' + pct(doneN, sets.length) + '%"></i></div><b>' + doneN + '/' + sets.length + '</b></div>' +
      '<div class="h2-btns">' + (nextSet ? '<a class="btn btn-lg btn-white" href="#/ex/' + nextSet.id + '">' + ic('play', 18) + 'Làm bài tiếp</a>' : '') + '<a class="btn btn-lg btn-glass" href="#/grammar/l' + g + '">📘 Xem ngữ pháp</a></div></div>' +
      '<div class="h2-goal"><div class="ring">' + ringSvg(p.days[dayKey()] || 0, GOAL, 112, '#FFC93C') + '<b>' + Math.min(p.days[dayKey()] || 0, GOAL) + '<small>/' + GOAL + '</small></b></div><p>Mục tiêu hôm nay</p></div></section>' +
      '<section class="stats3"><div class="scard sc-star"><div class="sc-ic">' + cic('star', 70) + '</div><div><p class="sc-n">' + p.stars + '</p><p class="sc-l">ngôi sao đã thu thập</p></div></div><div class="scard sc-fire"><div class="sc-ic">' + cic('fire', 70) + '</div><div><p class="sc-n">' + st + '</p><p class="sc-l">ngày học liên tiếp</p></div></div><div class="scard sc-rank"><div class="sc-ic">' + cic('trophy', 70) + '</div><div><p class="sc-n">' + (myRank ? '#' + myRank : '—') + '</p><p class="sc-l">hạng trong lớp ' + g + '</p></div></div></section>' +
      '<section class="lbwrap2"><div class="card"><div class="chead"><h2>' + cic('grammar', 26) + ' Chủ điểm Lớp ' + g + '</h2><a class="more" href="#/grammar/l' + g + '">Tất cả →</a></div><div class="gcards">' + list.map(function (x) { return gcardHtml(x, {}); }).join('') + '</div></div>' +
      '<div class="card lboard"><div class="chead"><h2>' + cic('trophy', 26) + ' Bảng xếp hạng ⭐</h2></div>' + boardHtml(B, u.username) + '</div></section></main>' + footer());
  }
  function ringSvg(v, max, size, col) {
    var r = size / 2 - 9, c = 2 * Math.PI * r, f = Math.max(0, Math.min(1, v / max));
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" aria-hidden="true"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="#F6E9EE" stroke-width="12"/>' +
      (f > 0 ? '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + (col || '#F2558B') + '" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + (c * f) + ' ' + c + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/>' : '') + '</svg>';
  }
  LN.ringSvg = ringSvg;
  function gameTile(x, n, g) {
    return '<a class="gtile c-' + x.cat + '" href="#/game/' + x.id + '/' + n + '">' + (hasArt('tile-' + x.id) ? art('tile-' + x.id, 0, 'gt-art') : '<span class="em">' + x.em + '</span>') + '<span class="t">' + x.name + '</span><span class="d">' + x.desc + '</span><span class="st">' + stars(g[x.id] || 0) + '</span>' + (x.nw ? '<span class="badge new">MỚI</span>' : x.arcade ? '<span class="badge">Arcade</span>' : '') + '</a>';
  }
  function gameTiles(n, p, featured) {
    var g = p.games[n] || {}, list = featured ? GAMES.filter(function (x) { return x.top; }) : GAMES;
    return '<div class="gtiles">' + list.map(function (x) { return gameTile(x, n, g); }).join('') + '</div>';
  }
  function viewHome() {
    var u = me(); if (!LN.hasUnits(u.grade)) { notReady(u, 'home'); return; }
    var p = prog(), cu = currentUnit(p), cs = unitStat(cu, p), ns = nextStep(cu, p), today = p.days[dayKey()] || 0, ms = openMistakes(p);
    var first = u.name.trim().split(/\s+/).pop(), st = streak(p), B = board(), myRank = 0;
    B.forEach(function (x, i) { if (x.un === u.username) myRank = i + 1; });
    var msg = !cs.started && cu.n === 1 ? 'Chào ' + first + '! Mình cùng bắt đầu Unit 1 nhé!' : today >= GOAL ? 'Hôm nay ' + first + ' giỏi quá, đủ mục tiêu rồi! 🎉' : 'Chào ' + first + '! Học tiếp Unit ' + cu.n + ' nào!';
    var wk = [], d0 = new Date(); d0.setDate(d0.getDate() - 6);
    for (var i = 0; i < 7; i++) { var dd = new Date(d0); dd.setDate(d0.getDate() + i); wk.push({ on: !!p.days[dayKey(dd)], l: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dd.getDay()], t: i === 6 }); }
    render(header('home') + '<main class="wrap page home2">' +
      '<section class="hero2"><div class="h2-art">' + chibi({ size: 190, mood: 'wow', pose: 'wave', acc: 'grad', cls: 'bob' }) + '<span class="spark s1">✦</span><span class="spark s2">✧</span><span class="spark s3">✦</span></div>' +
      '<div class="h2-body"><div class="bubble">' + esc(msg) + '</div><p class="h2-unit"><span class="uic">' + uic(cu, 40) + '</span>Unit ' + cu.n + ' · ' + esc(cu.title) + '<small>' + esc(cu.vi) + '</small></p>' +
      '<div class="h2-prog"><div class="bar lg"><i style="width:' + cs.pct + '%"></i></div><b>' + cs.pct + '%</b></div>' +
      '<div class="h2-btns"><a class="btn btn-lg btn-white" href="' + stepHref(cu, ns) + '">' + ic('play', 18) + (cs.started ? 'Học tiếp' : 'Bắt đầu học') + '</a>' + (ms.length ? '<a class="btn btn-lg btn-glass" href="#/play/mistakes">' + cic('heal', 22) + 'Ôn ' + Math.min(12, ms.length) + ' câu sai</a>' : '') + '</div></div>' +
      '<div class="h2-goal"><div class="ring">' + ringSvg(today, GOAL, 112, '#FFC92B') + '<b>' + Math.min(today, GOAL) + '<small>/' + GOAL + '</small></b></div><p>' + (today >= GOAL ? 'Xong mục tiêu! 🎉' : 'Mục tiêu hôm nay') + '</p></div></section>' +
      '<section class="stats3">' +
      '<div class="scard sc-star"><div class="sc-ic">' + cic('star', 70) + '</div><div><p class="sc-n" data-count="' + p.stars + '">' + p.stars + '</p><p class="sc-l">ngôi sao đã thu thập</p><p class="sc-s">Mỗi câu đúng được 1 ⭐</p></div></div>' +
      '<div class="scard sc-fire"><div class="sc-ic">' + cic('fire', 70) + '</div><div style="flex:1;min-width:0"><p class="sc-n">' + st + '</p><p class="sc-l">ngày học liên tiếp</p><div class="wkdots">' + wk.map(function (x) { return '<span class="' + (x.on ? 'on' : '') + (x.t ? ' t' : '') + '"><i>' + (x.on ? '🔥' : '') + '</i>' + x.l + '</span>'; }).join('') + '</div></div></div>' +
      '<div class="scard sc-rank"><div class="sc-ic">' + cic('trophy', 70) + '</div><div><p class="sc-n">' + (myRank ? '#' + myRank : '—') + '</p><p class="sc-l">hạng trong lớp</p><p class="sc-s">' + (B.length > 1 ? 'trên ' + B.length + ' bạn' : 'Cố lên nhé!') + '</p></div></div></section>' +
      '<section class="lbwrap2"><div class="card race"><div class="chead"><h2>' + cic('flag', 26) + ' Đường đua ' + UNITS.length + ' chặng</h2><span class="small muted">Đích ở Unit ' + UNITS.length + '!</span></div>' + raceHtml(B, u.username) + '</div>' +
      '<div class="card lboard"><div class="chead"><h2>' + cic('trophy', 26) + ' Bảng xếp hạng ⭐</h2></div>' + boardHtml(B, u.username) + '</div></section>' +
      '<section class="row2">' + questHtml(p) + wordDayHtml(cu) + '</section>' +
      '</main>' + footer());
    LN.placeRacers();
  }
  function todayLog(p) { var d = dayKey(); return p.log.filter(function (l) { return dayKey(new Date(l.t)) === d; }); }
  function quests(p) {
    var tl = todayLog(p), today = p.days[dayKey()] || 0;
    return [
      { ic: '✏️', t: 'Trả lời 20 câu', v: Math.min(today, 20), m: 20 },
      { ic: '🎮', t: 'Chơi 2 trò chơi', v: Math.min(tl.filter(function (l) { return l.game; }).length, 2), m: 2 },
      { ic: '📒', t: 'Làm xong 1 bài luyện tập', v: Math.min(tl.filter(function (l) { return !l.game; }).length, 1), m: 1 }
    ];
  }
  function questHtml(p) {
    var q = quests(p), all = q.every(function (x) { return x.v >= x.m; }), opened = (p.chest || {})[dayKey()];
    return '<div class="card quest"><div class="chead"><h2>' + cic('target', 28) + ' Nhiệm vụ hôm nay</h2><span class="small muted">' + q.filter(function (x) { return x.v >= x.m; }).length + '/3</span></div>' +
      q.map(function (x) { var ok = x.v >= x.m; return '<div class="qrow' + (ok ? ' ok' : '') + '"><span class="qic">' + (ok ? '✅' : x.ic) + '</span><div class="qb"><p>' + x.t + '</p><div class="bar thin"><i style="width:' + pct(x.v, x.m) + '%"></i></div></div><b>' + x.v + '/' + x.m + '</b></div>'; }).join('') +
      '<div class="chest' + (opened ? ' opened' : all ? ' ready' : '') + '">' + (opened ? '<span class="cbox">' + (hasArt('icon-chest-open') ? art('icon-chest-open', 64) : '🎉') + '</span><p><b>Đã mở rương hôm nay!</b><br><span class="small">Mai quay lại nhận rương mới nhé.</span></p>' : all ? '<span class="cbox">' + (hasArt('icon-gift') ? art('icon-gift', 64) : '🎁') + '</span><p><b>Hoàn thành hết nhiệm vụ!</b></p><button class="btn btn-pink" data-act="chest">Mở rương +10 ⭐</button>' : '<span class="cbox lock">' + (hasArt('icon-chest') ? art('icon-chest', 64) : '🎁') + '</span><p><b>Rương quà</b><br><span class="small">Làm xong 3 nhiệm vụ để mở và nhận <b>+10 ⭐</b></span></p>') + '</div></div>';
  }
  function wordDayHtml(cu) {
    var pool = []; UNITS.slice(0, Math.max(cu.n, 1)).forEach(function (u) { u.vocab.forEach(function (v) { pool.push({ v: v, u: u }); }); });
    var d = new Date(), k = (d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate()) % pool.length, w = pool[k], ex = '';
    UNITS.some(function (u) { return u.patterns.some(function (pt) { return pt.ex.some(function (e) { var s2 = e[0] + ' ' + e[1]; if ((' ' + s2.toLowerCase() + ' ').indexOf(' ' + w.v[0].toLowerCase() + ' ') >= 0 || s2.toLowerCase().indexOf(w.v[0].toLowerCase()) >= 0) { ex = e; return true; } return false; }); }); });
    return '<div class="card wday"><div class="chead"><h2>' + cic('book2', 28) + ' Từ vựng của ngày</h2><span class="small muted">Unit ' + w.u.n + '</span></div><div class="wd-in"><div class="wd-pic">' + picHtml(w.v[2], 'lg') + '</div><div class="wd-t"><p class="wd-en">' + esc(w.v[0]) + ' ' + sayBtn(w.v[0], 'sm') + '</p><p class="wd-vi">' + esc(w.v[1]) + '</p>' +
      (ex ? '<div class="wd-ex">' + sayBtn(ex[0] + ' ' + ex[1], 'sm') + '<span><b>' + esc(ex[0]) + '</b><br>' + esc(ex[1]) + '</span></div>' : '') + '</div></div><a class="btn btn-sm btn-block" href="#/game/cards/' + w.u.n + '">🃏 Ôn thẻ từ Unit ' + w.u.n + '</a></div>';
  }
  LN.progSummary = function (p) { var tot = 0; UNITS.forEach(function (x) { tot += unitStat(x, progOf2(p)).pct; }); return { stars: p.stars || 0, streak: streak(progOf2(p)), prog: UNITS.length ? tot / 100 / UNITS.length : 0 }; };
  function progOf2(p) { p = p || {}; ['seen', 'ex', 'mistakes', 'days', 'topics', 'games', 'vlearn'].forEach(function (k) { p[k] = p[k] || {}; }); return p; }
  var board = LN.board = function () {
    var C = LN.cloud, mu = me();
    if (C && C.on && C.boardList && mu) {
      var mine = LN.progSummary(prog()), L = C.boardList.filter(function (x) { return x.un !== mu.username; }).concat([{ un: mu.username, name: mu.name, stars: mine.stars, streak: mine.streak, prog: mine.prog }]);
      return L.sort(function (a, b) { return b.stars - a.stars || b.streak - a.streak || String(a.name).localeCompare(String(b.name), 'vi'); });
    }
    var all = users();
    var mg = (me() || {}).grade;
    return Object.keys(all).filter(function (un) { return all[un].status !== 'stopped' && (!mg || +all[un].grade === +mg); }).map(function (un) {
      var p = progOf(un), tot = 0; UNITS.forEach(function (x) { tot += unitStat(x, p).pct; });
      return { un: un, name: all[un].name || un, stars: p.stars || 0, streak: streak(p), prog: tot / 100 / UNITS.length };
    }).sort(function (a, b) { return b.stars - a.stars || b.streak - a.streak || a.name.localeCompare(b.name, 'vi'); });
  };
  function hcode(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  function racerLook(x, i) { var cols = ['pink', 'mint', 'blue', 'purple', 'orange', 'yellow', 'white', 'brown'], accs = ['cap', 'bow', 'flower', 'phones', 'glasses', 'bow', 'cap', 'flower']; var h = hcode(x.un); return { color: cols[h % cols.length], acc: i === 0 ? 'crown' : accs[(h >> 3) % accs.length] }; }
  function shortName(n) { var p = String(n).trim().split(/\s+/); return p.length > 1 ? p[p.length - 1] : p[0]; }
  function boardHtml(B, meU) {
    if (!B.length) return '<p class="muted small">Chưa có bạn nào.</p>';
    var medal = ['🥇', '🥈', '🥉'];
    return '<ol class="lb">' + B.slice(0, 10).map(function (x, i) {
      var lk = racerLook(x, i);
      return '<li class="' + (x.un === meU ? 'me' : '') + (i < 3 ? ' top' + (i + 1) : '') + '"><span class="rk">' + (medal[i] || (i + 1)) + '</span><span class="lav">' + chibi({ size: 44, head: 1, color: lk.color, acc: lk.acc, mood: i === 0 ? 'wow' : 'happy' }) + '</span><span class="lnm">' + esc(x.name) + (x.un === meU ? ' <em>(bé)</em>' : '') + '<small>🔥 ' + x.streak + ' ngày</small></span><span class="lst">' + x.stars + ' ⭐</span></li>';
    }).join('') + '</ol>' + (B.length < 2 ? '<p class="small muted" style="margin-top:10px">Các bạn trong lớp học cùng trên Aurora English sẽ xuất hiện ở đây.</p>' : '');
  }
  /* Đường đua 20 chặng: mỗi Unit là một trạm trên con đường ngoằn ngoèo lên đỉnh núi, đích ở Unit 20 */
  var ROAD = 'M48 548 C300 556 620 552 850 536 C962 528 966 438 862 432 C640 420 360 418 150 404 C42 398 44 314 150 308 C380 296 600 294 812 280 C904 274 904 196 812 192 C660 184 470 182 300 172 C214 166 214 104 300 98 C380 92 440 82 500 62';
  function raceArt() {
    var a = (window.ART || {})['race-hill']; if (!a) return '';
    var m = a.match(/id="race-hill-road" d="([^"]+)"/); if (!m) return '';
    return a.replace(/<svg [^>]*>/, '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">')
      .replace(/<\/svg>\s*$/, '<path id="rdone" d="' + m[1] + '" stroke="#FFC93C" stroke-width="31" fill="none" stroke-linecap="round" opacity=".55"/><path id="rroad" d="' + m[1] + '" fill="none" stroke="none"/><g id="rstations"></g></svg>');
  }
  function raceHtml(B, meU) {
    var NU = UNITS.length;
    var L = B.slice().sort(function (a, b) { return b.prog - a.prog || b.stars - a.stars; }).slice(0, 8), me = -1;
    L.forEach(function (x, i) { if (x.un === meU) me = i; });
    var racers = L.map(function (x, i) {
      var lk = racerLook(x, i);
      return '<div class="racer' + (x.un === meU ? ' me' : '') + (i === 0 && x.prog > 0 ? ' lead' : '') + '" data-f="' + Math.max(0, Math.min(1, x.prog)).toFixed(4) + '" data-i="' + i + '" style="--d:' + (i * 0.14) + 's;z-index:' + (40 - i) + '">' +
        '<span class="rtag"><i>' + (i + 1) + '</i>' + esc(shortName(x.name)) + '<em>' + Math.round(x.prog * NU * 10) / 10 + '/' + NU + '</em></span>' + (x.un === meU ? '<span class="rme">BÉ</span>' : '') +
        chibi({ size: 70, color: lk.color, acc: i === 0 && x.prog > 0 ? 'crown' : lk.acc, pose: x.prog >= 1 ? 'cheer' : 'run', mood: i === 0 ? 'wow' : 'happy' }) + '<span class="dust"></span></div>';
    }).join('');
    var tree = function (x, y, s, c) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><rect x="-3" y="2" width="6" height="14" rx="2" fill="#8C5E3C"/><path d="M0 -24 L16 4 L-16 4Z" fill="' + (c || '#2E9E5B') + '"/><path d="M0 -34 L12 -10 L-12 -10Z" fill="' + (c || '#3DB86B') + '"/></g>'; };
    var bush = function (x, y, s) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><circle cx="-8" cy="0" r="9" fill="#46C46F"/><circle cx="6" cy="-3" r="11" fill="#58D27E"/><circle cx="16" cy="2" r="7" fill="#46C46F"/></g>'; };
    var svg = raceArt() || '<svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' +
      '<linearGradient id="rsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#62C2FF"/><stop offset=".55" stop-color="#BFE9FF"/><stop offset="1" stop-color="#FFF2D6"/></linearGradient>' +
      '<linearGradient id="rmtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8AE38A"/><stop offset=".5" stop-color="#5BCB6E"/><stop offset="1" stop-color="#34A75A"/></linearGradient>' +
      '<radialGradient id="rsun"><stop offset="0" stop-color="#FFF6B0"/><stop offset=".6" stop-color="#FFD84D"/><stop offset="1" stop-color="#FFB703"/></radialGradient></defs>' +
      '<rect width="1000" height="600" fill="url(#rsky)"/>' +
      '<g class="sunrays" style="transform-origin:96px 84px">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(function (k) { var a = k * Math.PI / 6; return '<path d="M96 84 L' + (96 + 86 * Math.cos(a - 0.08)) + ' ' + (84 + 86 * Math.sin(a - 0.08)) + ' L' + (96 + 86 * Math.cos(a + 0.08)) + ' ' + (84 + 86 * Math.sin(a + 0.08)) + 'Z" fill="#FFE98A" opacity=".5"/>'; }).join('') + '</g>' +
      '<circle cx="96" cy="84" r="38" fill="url(#rsun)"/><circle cx="85" cy="78" r="3.5" fill="#B97A00"/><circle cx="107" cy="78" r="3.5" fill="#B97A00"/><path d="M87 92q9 8 18 0" stroke="#B97A00" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<g class="clouds"><g fill="#fff"><ellipse cx="250" cy="70" rx="50" ry="17"/><ellipse cx="280" cy="58" rx="32" ry="19"/></g><g fill="#fff" opacity=".9"><ellipse cx="760" cy="60" rx="46" ry="15"/><ellipse cx="788" cy="49" rx="27" ry="16"/></g><g fill="#fff" opacity=".85"><ellipse cx="900" cy="150" rx="34" ry="11"/></g></g>' +
      '<path d="M0 330 L110 230 L200 290 L330 170 L420 240 L520 140 L640 250 L760 160 L880 260 L1000 210 L1000 600 L0 600Z" fill="#A9B8F0" opacity=".5"/>' +
      '<path d="M0 600 L0 520 C120 470 120 330 230 300 C300 230 300 170 390 120 C440 90 470 40 500 30 C530 40 560 90 610 120 C700 170 700 230 770 300 C880 330 880 470 1000 520 L1000 600Z" fill="url(#rmtn)"/>' +
      '<path d="M455 70 L500 30 L545 70 L528 66 L512 78 L500 68 L488 78 L472 66Z" fill="#fff"/>' +
      '<path d="M0 600 L0 470 C200 455 800 455 1000 470 L1000 600Z" fill="#43B864"/>' +
      '<path d="M40 470 C250 448 750 448 960 470" stroke="#7EE08E" stroke-width="4" fill="none" opacity=".6"/>' +
      tree(30, 470, 1.1) + tree(970, 480, 1.2) + tree(60, 360, .9, '#2C8F55') + tree(940, 360, .9, '#2C8F55') + tree(240, 240, .8) + tree(760, 236, .8) + tree(370, 130, .7, '#2C8F55') + tree(640, 132, .7, '#2C8F55') +
      bush(520, 476, 1) + bush(250, 470, .9) + bush(740, 350, .9) + bush(330, 352, .8) + bush(560, 236, .8) + bush(440, 236, .7) +
      '<g fill="#FF8FB1"><circle cx="180" cy="575" r="4"/><circle cx="640" cy="585" r="4"/><circle cx="300" cy="340" r="3.5"/><circle cx="700" cy="220" r="3.5"/></g><g fill="#FFE066"><circle cx="420" cy="580" r="4"/><circle cx="860" cy="585" r="4"/><circle cx="560" cy="350" r="3.5"/><circle cx="380" cy="225" r="3.5"/></g>' +
      '<path d="' + ROAD + '" stroke="#C69552" stroke-width="40" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="' + ROAD + '" stroke="#F4D7A1" stroke-width="31" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path id="rdone" d="' + ROAD + '" stroke="#FFC93C" stroke-width="31" fill="none" stroke-linecap="round" opacity=".55"/>' +
      '<path id="rroad" d="' + ROAD + '" stroke="#fff" stroke-width="3" stroke-dasharray="12 12" fill="none" stroke-linecap="round" opacity=".9"/>' +
      '<g id="rstations"></g>' +
      '<g transform="translate(18 500)"><rect x="0" y="0" width="6" height="58" fill="#8C6A5A"/><rect x="62" y="0" width="6" height="58" fill="#8C6A5A"/><rect x="-4" y="-14" width="76" height="20" rx="5" fill="#FF5C9A"/><text x="34" y="0" font-size="11" font-weight="800" fill="#fff" text-anchor="middle" font-family="Quicksand,sans-serif">XUẤT PHÁT</text></g>' +
      '<g transform="translate(500 62)"><path d="M-46 0 L-46 -46 Q0 -76 46 -46 L46 0" stroke="#FFC93C" stroke-width="9" fill="none"/><path d="M-46 0 L-46 -46 Q0 -76 46 -46 L46 0" stroke="#E59B00" stroke-width="2" fill="none"/><rect x="-70" y="-58" width="140" height="22" rx="7" fill="#FF5C9A" stroke="#fff" stroke-width="2"/><text x="0" y="-42" font-size="12" font-weight="800" fill="#fff" text-anchor="middle" font-family="Mali,sans-serif">🏆 ĐÍCH · UNIT ' + NU + '</text><path d="M58 -6V-60" stroke="#8C6A5A" stroke-width="3"/><path d="M60 -60h26l-7 8 7 8h-26z" fill="#22B38A"/><path d="M-58 -6V-60" stroke="#8C6A5A" stroke-width="3"/><path d="M-60 -60h-26l7 8-7 8h26z" fill="#3A86FF"/></g></svg>';
    var hud = '', myP = me >= 0 ? L[me] : null;
    if (myP) {
      var doneU = Math.floor(myP.prog * NU + 1e-6);
      hud = myP.prog >= 1 ? '🏆 <b>Bé đã về đích cả ' + NU + ' Unit!</b> Xuất sắc quá!' : '🚩 Bé đang ở chặng <b>Unit ' + Math.min(NU, doneU + 1) + '</b> · còn <b>' + (NU - doneU) + ' Unit</b> nữa là về đích' + (me > 0 ? ' · đang đuổi theo <b>' + esc(shortName(L[me - 1].name)) + '</b>' : L.length > 1 ? ' · <b>đang dẫn đầu</b> 👑' : '') + '!';
    }
    return '<div class="race3"><div class="hill">' + svg + racers + '</div><p class="racehud">' + hud + '</p></div>';
  }
  window.addEventListener('resize', function () { clearTimeout(LN._rz); LN._rz = setTimeout(function () { if (document.getElementById('rroad')) LN.placeRacers(true); }, 150); });
  LN.placeRacers = function (noAnim) {
    var road = document.getElementById('rroad'); if (!road || !road.getTotalLength) return;
    var len = road.getTotalLength(), hill = road.closest('.hill'), svg = road.ownerSVGElement, vb = svg.viewBox.baseVal;
    /* Khung .hill có cùng tỉ lệ với viewBox nên đổi toạ độ sang % (không phụ thuộc phóng to / thu nhỏ) */
    function toPx(pt) { return [pt.x / vb.width * 100, pt.y / vb.height * 100]; }
    var meR = hill.querySelector('.racer.me'), myF = meR ? +meR.getAttribute('data-f') : 0;
    var done = document.getElementById('rdone'); if (done) { done.style.strokeDasharray = (len * myF) + ' ' + len; }
    var st = document.getElementById('rstations'), out = '';
    UNITS.forEach(function (u, k) {
      var NU = UNITS.length, f = (k + 1) / NU, p = road.getPointAtLength(len * f), passed = myF >= f - 1e-6, cur = !passed && myF >= k / NU - 1e-6;
      if (k === NU - 1) return;
      out += '<g class="stn' + (passed ? ' ok' : cur ? ' cur' : '') + '" transform="translate(' + p.x + ' ' + p.y + ')"><circle r="17" fill="' + (passed ? '#FFD84D' : '#fff') + '" stroke="' + (passed ? '#E59B00' : cur ? '#FF5C9A' : '#D9C9B2') + '" stroke-width="3.5"/>' + (u.art && hasArt(u.art) ? '<image href="' + artUrl(u.art) + '" x="-15" y="-15" width="30" height="30"/>' : '<text y="6" font-size="17" text-anchor="middle">' + u.icon + '</text>') +
        '<g transform="translate(13 -13)"><circle r="8.5" fill="' + (passed ? '#22B38A' : cur ? '#FF5C9A' : '#A89BB5') + '"/><text y="3.6" font-size="10" font-weight="800" fill="#fff" text-anchor="middle" font-family="Quicksand,sans-serif">' + (passed ? '✓' : u.n) + '</text></g></g>';
    });
    st.innerHTML = out;
    var rs = [].slice.call(hill.querySelectorAll('.racer')), placed = [], gap = 4.6;
    rs.forEach(function (r) {
      var f = +r.getAttribute('data-f'), p = toPx(road.getPointAtLength(len * f)), n = 0;
      placed.forEach(function (q) { if (Math.abs(q[0] - p[0]) < gap && Math.abs(q[1] - p[1]) < gap) n++; });
      var x = p[0] + (n ? (n % 2 ? 1 : -1) * Math.ceil(n / 2) * gap * 0.8 : 0), y = p[1] - (n ? 0.8 : 0);
      placed.push([x, y]); r.setAttribute('data-x', x); r.setAttribute('data-y', y);
      if (!noAnim) { var p0 = toPx(road.getPointAtLength(0)); r.style.transition = 'none'; r.style.left = p0[0] + '%'; r.style.top = p0[1] + '%'; }
    });
    var go = function () { rs.forEach(function (r) { r.style.transition = noAnim ? 'none' : ''; r.classList.add('go'); r.style.left = r.getAttribute('data-x') + '%'; r.style.top = r.getAttribute('data-y') + '%'; }); };
    if (noAnim) go(); else requestAnimationFrame(function () { setTimeout(go, 150); });
  };

  /* ================= Con đường học ================= */
  var OFFS = [0, 90, 140, 90, 0, -90, -140, -90];
  function viewLearn() {
    var u = me(); if (!LN.hasUnits(u.grade)) { notReady(u, 'learn'); return; }
    var p = prog(), cu = currentUnit(p), nodes = [], k = 0, dn = 0;
    UNITS.forEach(function (x) {
      var s = unitStat(x, p), cls = s.pct === 100 ? 'done' : x === cu ? 'cur' : ''; if (s.pct === 100) dn++;
      nodes.push('<a class="pnode ' + cls + '" style="--x:' + OFFS[k++ % 8] + 'px" href="#/unit/' + x.n + '/vocab">' + (x === cu && s.pct < 100 ? '<span class="here">Đang học</span>' : '') +
        '<span class="dot">' + uic(x, 54) + (s.pct === 100 ? '<span class="ok">' + ic('check', 15, '#fff', 3.5) + '</span>' : '') + '</span>' +
        '<span class="lab"><span class="u">Unit ' + x.n + (s.started && s.pct < 100 ? ' · ' + s.pct + '%' : '') + '</span><br><span class="n">' + esc(x.title) + '</span>' + (s.avg != null ? '<br>' + stars(starsFor(s.avg)) : '') + '</span></a>');
      REVIEWS.forEach(function (r) {
        if (r.after !== x.n) return; var b = p.ex[r.id];
        nodes.push('<a class="pnode rev' + (b ? ' done' : '') + '" style="--x:' + OFFS[k++ % 8] + 'px" href="#/play/' + r.id + '"><span class="dot">🎁' + (b ? '<span class="ok">' + ic('check', 15, '#fff', 3.5) + '</span>' : '') + '</span><span class="lab"><span class="u">' + r.title + '</span><br><span class="n">Unit ' + r.from + '–' + r.to + '</span>' + (b ? '<br>' + stars(starsFor(b.best)) : '') + '</span></a>');
      });
    });
    render(header('learn') + '<main class="wrap page"><div class="chead"><div><h1 class="title">Con đường học ' + (CURG > 100 ? courseName(CURG) : 'lớp ' + CURG) + '</h1><p class="muted">Đã xong ' + dn + ' / ' + UNITS.length + ' Unit · bấm vào một Unit để học</p></div>' +
      '<div style="width:260px;max-width:100%"><div class="bar"><i style="width:' + pct(dn, UNITS.length) + '%"></i></div></div></div><div class="path">' + nodes.join('') + '</div></main>' + footer());
  }

  /* ================= Unit ================= */
  var UCOL = ['var(--pink-soft)', 'var(--yel-soft)', 'var(--mint-soft)', 'var(--sky-soft)', 'var(--lav-soft)', 'var(--peach-soft)'];
  /* Ô điền đáp án cho bài nghe BTBT: chọn hoặc gõ, bấm Kiểm tra để chấm ngay tại chỗ */
  function audItem(it, i, j) {
    var id = 'aq-' + i + '-' + j, h = '<div class="aud-q" id="' + id + '"><div class="aud-qh"><span class="aud-qn">' + (j + 1) + '</span>' + (it.pic ? '<span class="aud-qp">' + picHtml(it.pic) + '</span>' : '') + '<span class="aud-qt">' + (it.q ? blankify(it.q, '') : '') + '</span></div>';
    if (it.t === 'fill') h += '<input class="inp aud-inp" data-aq="' + i + '-' + j + '" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ đáp án">';
    else h += '<div class="aud-opts">' + it.o.map(function (o, k) { return '<button type="button" class="aud-o' + (it.opic ? ' pic' : '') + '" data-ao="' + i + '-' + j + '-' + k + '">' + (it.opic ? picHtml(it.opic[k]) : '') + '<span>' + esc(o) + '</span></button>'; }).join('') + '</div>';
    return h + '<p class="aud-why" hidden></p></div>';
  }
  function audNorm(s) { return String(s || '').toLowerCase().replace(/[’`]/g, "'").replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim(); }
  function audCheck(u, i) {
    var a = u.audio[i], ok = 0, p = prog();
    a.items.forEach(function (it, j) {
      var box = document.getElementById('aq-' + i + '-' + j), right;
      if (it.t === 'fill') { var inp = box.querySelector('input'), v = audNorm(inp.value); right = it.a.some(function (x) { return audNorm(x) === v; }); inp.classList.toggle('ok', right); inp.classList.toggle('no', !right); }
      else { var sel = box.querySelector('.aud-o.sel'), k = sel ? +sel.getAttribute('data-ao').split('-')[2] : -1; right = k === it.a; box.querySelectorAll('.aud-o').forEach(function (b, kk) { b.classList.toggle('right', kk === it.a); b.classList.toggle('wrong', kk === k && !right); }); }
      if (right) ok++;
      var w = box.querySelector('.aud-why'); w.hidden = false; w.innerHTML = (right ? '✅ ' : '❌ Đáp án: <b>' + esc(it.t === 'fill' ? it.a[0] : it.o[it.a]) + '</b> · ') + inl(it.why || '');
    });
    var sc = document.getElementById('aud-sc-' + i); sc.textContent = 'Đúng ' + ok + '/' + a.items.length + (ok === a.items.length ? ' 🎉' : ''); var scr = document.getElementById('aud-scr-' + i); if (scr) scr.hidden = false;
    p.aud = p.aud || {}; var old = p.aud[a.k]; if (!old || ok >= old.ok) { p.aud[a.k] = { ok: ok, n: a.items.length, at: Date.now() }; saveProg(p); }
    if (ok === a.items.length) speak('Great job!');
  }
  LN.audCheck = audCheck;
  function viewUnit(n, tab) {
    var u = unitOf(n); if (!u) { go('#/learn'); return; }
    tab = tab || 'vocab';
    var p = prog();
    if (tab === 'pattern' && !p.seen['p' + n]) { p.seen['p' + n] = Date.now(); saveProg(p); }
    var s = unitStat(u, p), ns = nextStep(u, p), steps = s.steps;
    var exS = steps.filter(function (x) { return x.ex; }), exDone = exS.filter(function (x) { return x.done; }).length, exTot = exS.length, spS = steps.filter(function (x) { return x.key === 'speak'; })[0];
    var tabs = [['vocab', '1', 'Từ vựng', steps[0].done], ['pattern', '2', 'Mẫu câu', steps[1].done]];
    if (spS) tabs.push(['speak', '3', 'Luyện nói', spS.done]);
    tabs.push(['practice', String(tabs.length + 1), 'Luyện tập ' + exDone + '/' + exTot, exDone === exTot]);
    if (u.audio && u.audio.length) tabs.push(['listen', String(tabs.length + 1), '🎧 Nghe BTBT', false]);
    var body;
    if (tab === 'vocab') {
      body = '<div class="chead"><h2 class="sub">Học qua trò chơi</h2><a href="#/games/' + n + '" style="font-weight:800">Tất cả ' + GAMES.length + ' trò chơi →</a></div>' + gameTiles(n, p, true) +
        '<div class="chead" style="margin-top:26px"><h2 class="sub">' + u.vocab.length + ' từ mới</h2><span class="small muted">Bấm vào thẻ để nghe đọc</span></div>' +
        '<div class="vgrid">' + u.vocab.map(function (v) { return '<button type="button" class="vc" data-say="' + esc(v[0]) + '"><div class="pic">' + picHtml(v[2]) + '</div><div class="w">' + esc(v[0]) + '</div><div class="m">' + esc(v[1]) + '</div></button>'; }).join('') + '</div>';
    } else if (tab === 'pattern') {
      body = '<div class="stack">' + u.patterns.map(function (pt, i) {
        return '<section class="pat"><p class="small muted" style="font-weight:800;margin-bottom:10px">CẤU TRÚC ' + (i + 1) + '</p><div class="formula"><span class="q">' + esc(pt.q) + '</span><span class="arrow">→</span><span class="a">' + esc(pt.a) + '</span></div>' +
          '<div class="chat">' + pt.ex.map(function (e) {
            var pp = sentPics(e[0] + ' ' + e[1], 2);
            return '<div class="lnq">' + sayBtn(e[0] + ' ' + e[1], 'sm') + '<span class="bq">' + esc(e[0]) + '</span></div><div class="lna">' + (pp.length ? '<span class="cpics">' + pp.map(function (x) { return picHtml(x); }).join('') + '</span>' : '') + '<span class="ba">' + esc(e[1]) + '</span></div>';
          }).join('') + '</div></section>';
      }).join('') +
        '<div class="tipbox">' + chick(64) + '<div><p class="head" style="font-size:20px;color:var(--mint-dk)">Chíp nhắc nhỏ</p><ul>' + u.tips.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
        '<a href="#/grammar/' + (u.topic || 'l' + ((u.grade || CURG) > 100 ? 1 : (u.grade || CURG))) + '" style="font-weight:800;display:inline-block;margin-top:6px">Xem thêm ở Ngữ pháp tổng hợp →</a></div></div>' +
        '<div style="text-align:center;margin-top:8px"><a class="btn btn-lg btn-pink" href="#/unit/' + n + '/' + (spS ? 'speak">Sang phần Luyện nói →' : 'practice">Sang phần Luyện tập →') + '</a></div></div>';
    } else if (tab === 'speak' && spS) {
      var gb = (p.games[n] || {}).speakq || 0;
      body = '<div class="spk-intro">' + chick(84, 'wow') + '<div><h2 class="sub" style="margin:0 0 4px">🗣️ Cô hỏi – em trả lời</h2><p class="muted">Máy đọc câu hỏi, em nhìn hình và <b>trả lời to bằng tiếng Anh</b>. Máy chấm điểm theo %, em nghe lại được giọng mình.</p></div>' +
        '<div style="text-align:center">' + (gb ? '<div style="margin-bottom:6px">' + stars(gb) + '</div>' : '') + '<a class="btn btn-lg btn-pink" href="#/game/speakq/' + n + '">🎤 ' + (gb ? 'Luyện lại' : 'Bắt đầu nói') + '</a></div></div>' +
        '<div class="chead" style="margin-top:20px"><h2 class="sub">' + u.speaking.length + ' câu hỏi của Unit ' + n + '</h2><span class="small muted">Bấm 🔊 để nghe câu hỏi và câu trả lời mẫu</span></div>' +
        '<div class="spk-list">' + u.speaking.map(function (c, i) {
          return '<div class="spk-li"><span class="spk-n">' + (i + 1) + '</span><span class="spk-lp">' + picHtml(c.pic || '💬') + '</span><div class="spk-lt"><p class="q">' + sayBtn(c.q, 'sm') + esc(c.q) + '</p><p class="v">' + esc(c.vi || '') + '</p><p class="a">' + sayBtn(c.a[0], 'sm') + '<b>' + esc(c.a[0]) + '</b>' + (c.open ? ' <span class="tiny muted">(thay bằng ý của em)</span>' : '') + '</p></div></div>';
        }).join('') + '</div>' +
        '<div style="text-align:center;margin-top:20px"><a class="btn btn-lg" href="#/unit/' + n + '/practice">Sang phần Luyện tập →</a></div>';
    } else if (tab === 'listen' && u.audio && u.audio.length) {
      var hasKey = u.audio.some(function (a) { return a.items && a.items.length; });
      body = '<div class="spk-intro">' + chick(84, 'wow') + '<div><h2 class="sub" style="margin:0 0 4px">🎧 Nghe file BTBT</h2><p class="muted">Mở sách <b>Bài tập bổ trợ</b> đúng trang, bấm ▶ để nghe và làm bài vào sách.' + (hasKey ? ' Làm xong, em <b>điền đáp án</b> bên dưới rồi bấm <b>Kiểm tra</b> nhé!' : ' Nghe lại bao nhiêu lần cũng được!') + '</p></div></div>' +
        '<div class="aud-list">' + u.audio.map(function (a, i) {
          var res = (prog().aud || {})[a.k];
          return '<section class="aud-li" data-aud="' + i + '"><div class="aud-h"><span class="spk-n">' + (i + 1) + '</span><div style="flex:1"><p class="t">' + esc(a.title) + (a.en ? ' · <i>' + esc(a.en) + '</i>' : '') + '</p><p class="v">' + esc(a.vi) + '</p></div>' + (res ? '<span class="tag ' + (res.ok === res.n ? 'tag-mint' : 'tag-yel') + '">' + res.ok + '/' + res.n + '</span>' : '') + '</div>' +
            '<audio controls preload="none" src="' + LN.audUrl(a.k) + '"></audio><div class="aud-pic">' + picHtml(a.pic, 'aud-img') + '</div>' +
            (a.items && a.items.length ? '<div class="aud-ans"><p class="aud-ah">✏️ Điền đáp án của em</p>' + a.items.map(function (it, j) { return audItem(it, i, j); }).join('') +
              '<div class="aud-foot"><button type="button" class="btn btn-mint" data-audchk="' + i + '">Kiểm tra</button><span class="aud-score" id="aud-sc-' + i + '"></span></div>' +
              (a.script ? '<details class="aud-script" id="aud-scr-' + i + '" hidden><summary>📜 Lời bài nghe</summary><p>' + esc(a.script) + '</p></details>' : '') + '</div>' : '') +
            '</section>';
        }).join('') + '</div>';
    } else {
      var ICO = { vocab: ['🔤', 'var(--mint-soft)'], reading: ['📖', 'var(--yel-soft)'] };
      var GRP = { vocab: '🔤 Từ vựng', btbt: '📒 Bài tập bổ trợ', test: '📝 Bài kiểm tra · 20 câu' }, lastG = null;
      body = '<div class="stack" style="gap:12px">' + u.exercises.map(function (e) {
        var hd = ''; if (e.group && e.group !== lastG) { lastG = e.group; hd = '<h3 class="exgrp">' + (GRP[e.group] || '') + '</h3>'; }
        var r = p.ex[e.id], icn = ICO[e.topic] || { mcq: ['✅', 'var(--sky-soft)'], fill: ['✏️', 'var(--pink-soft)'], order: ['🧩', 'var(--lav-soft)'], fix: ['🔍', 'var(--peach-soft)'], match: ['🔗', 'var(--yel-soft)'] }[e.type];
        if (EXICO[e.topic] && !ICO[e.topic]) icn = [EXICO[e.topic][0], EXICO[e.topic][1]];
        return hd + '<div class="exc"><span class="ic" style="background:' + icn[1] + '">' + icn[0] + '</span><div class="inf"><p class="t">' + esc(e.title) + '</p><p class="s">' + itemCount(e) + ' câu' + (r ? ' · đúng ' + r.best + '%' : '') + '</p></div>' +
          (r ? stars(starsFor(r.best)) : '') + '<a class="btn ' + (r ? '' : 'btn-pink') + '" href="#/ex/' + e.id + '">' + (r ? 'Làm lại' : 'Làm bài') + '</a></div>';
      }).join('') + '</div>' +
        (u.n < UNITS.length ? '<div style="text-align:center;margin-top:24px"><a class="btn btn-lg ' + (s.pct === 100 ? 'btn-mint' : '') + '" href="#/unit/' + (u.n + 1) + '/vocab">Sang Unit ' + (u.n + 1) + ' →</a></div>' : '');
    }
    render(header('learn') + '<main class="wrap page">' +
      '<section class="ubanner" style="background:' + UCOL[(n - 1) % UCOL.length] + '"><span class="ic">' + uic(u, 76) + '</span><div style="flex:1 1 260px;min-width:0"><p class="u"><a href="#/learn" style="color:inherit">Bài học</a> · Unit ' + n + '</p><h1>' + esc(u.title) + '</h1><p class="muted" style="font-size:18px">' + esc(u.vi) + '</p></div>' +
      '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><div class="ring">' + ringSvg(s.pct, 100, 92, s.pct === 100 ? '#2FB383' : '#F2558B') + '<b style="font-size:20px">' + s.pct + '%</b></div>' +
      (ns ? '<a class="btn btn-pink" href="' + stepHref(u, ns) + '">Tiếp: ' + esc(ns.label.length > 22 ? ns.label.slice(0, 20) + '…' : ns.label) + '</a>' : '<span class="tag tag-mint" style="font-size:15px">Xong Unit! ' + u.icon + '</span>') + '</div></section>' +
      '<nav class="utabs" aria-label="Phần của Unit">' + tabs.map(function (t) { return '<a href="#/unit/' + n + '/' + t[0] + '" class="' + (tab === t[0] ? 'on' : '') + '"><span class="num">' + t[1] + '</span>' + t[2] + (t[3] ? '<span class="ck">' + ic('check', 18, 'currentColor', 3.2) + '</span>' : '') + '</a>'; }).join('') + '</nav>' +
      body + '</main>' + footer());
  }

  /* ================= Làm bài ================= */
  var PLAYCACHE = {};
  function stashPlay() {
    if (S && S.phase !== 'done' && (S.i > 0 || S.res.length || S.sel != null || S.built.length || Object.keys(S.pairs || {}).length)) PLAYCACHE[S.id] = S;
  }
  function viewPlay(id) {
    if (S && S.id !== id) stashPlay();
    if (PLAYCACHE[id]) { S = PLAYCACHE[id]; delete PLAYCACHE[id]; drawPlay(); return; }
    var cfg = buildSet(id); if (!cfg) { go('#/home'); return; }
    if (!cfg.match && !cfg.items.length) { render(header() + '<main class="wrap page"><div class="card empty">' + chick(140, 'wow') + '<h2>Không còn câu nào để ôn!</h2><p class="muted" style="margin-bottom:18px">Giỏi lắm. Làm thêm bài mới nhé.</p><a class="btn btn-pink" href="#/home">Về trang chủ</a></div></main>'); return; }
    S = Object.assign({ i: 0, res: [], phase: 'ask', sel: null, built: [], typed: '', pairs: {}, act: null }, cfg);
    drawPlay();
  }
  function topBar(back, title, sub, frac, right, cls) {
    return '<div class="ptop ' + (cls || '') + '"><div class="wrap"><a class="ibtn" href="' + back + '" aria-label="Thoát">' + ic('x', 20) + '</a><div class="mid"><p class="ttl">' + esc(title) + ' <span class="muted" style="font-weight:600">· ' + esc(sub) + '</span></p><div class="bar"><i style="width:' + Math.round(frac * 100) + '%"></i></div></div>' + (right || '') + '</div></div>';
  }
  var EXICO = { btbt: ['📒', '#FFF1C9'], test: ['📝', '#FFE0EC'], vocab: ['🔤', '#D2F7EA'], reading: ['📖', '#FFF1C9'], mcq: ['✅', '#D9EEFF'], fill: ['✏️', '#FFE0EC'], order: ['🧩', '#EDE4FF'], fix: ['🔍', '#FFE2CC'], match: ['🔗', '#FFF1C9'] };
  function exIcon(e) { return EXICO[e.topic] || EXICO[e.type] || ['📝', '#EDE4FF']; }
  function setProgress(x) { var tot = x.match ? x.match.left.length : x.items.length, d = x.phase === 'done' ? tot : x.match ? Object.keys(x.pairs).length : x.i + (x.phase === 'ask' ? 0 : 1); return { d: d, tot: tot }; }
  function taskPanel() {
    var r = S.exId && EX[S.exId]; if (!r || !r.unit) return '';
    var u = r.unit, p = prog(), list = u.exercises, doneN = list.filter(function (e) { return p.ex[e.id]; }).length;
    return '<div class="tk-h"><p class="tk-k">' + u.icon + ' Unit ' + u.n + ' · Luyện tập</p><p class="tk-u">' + esc(u.title) + '</p><div class="tk-sum"><div class="bar thin"><i style="width:' + pct(doneN, list.length) + '%"></i></div><span>' + doneN + '/' + list.length + ' bài</span></div></div>' +
      '<nav class="tk-list" aria-label="Các bài tập">' + list.map(function (e, k) {
        var ico = exIcon(e), cur = e.id === S.exId, best = p.ex[e.id], cache = PLAYCACHE[e.id], tot = itemCount(e), pr, meta, cls = '';
        if (cur) { pr = setProgress(S); meta = S.phase === 'done' ? 'Xong · đúng ' + S.score + '%' : 'Đang làm ' + pr.d + '/' + pr.tot; cls = 'cur'; }
        else if (cache) { pr = setProgress(cache); meta = 'Làm dở ' + pr.d + '/' + pr.tot; cls = 'part'; }
        else if (best) { pr = { d: tot, tot: tot }; meta = 'Đúng ' + best.best + '%'; cls = 'done'; }
        else { pr = { d: 0, tot: tot }; meta = tot + ' câu · chưa làm'; }
        return '<a class="tk ' + cls + '" href="#/ex/' + e.id + '"' + (cur ? ' aria-current="true"' : '') + '><span class="tk-n">' + (k + 1) + '</span><span class="tk-ic" style="background:' + ico[1] + '">' + ico[0] + '</span><span class="tk-b"><span class="tk-t">' + esc(e.title) + '</span><span class="tk-m">' + meta + '</span><span class="tk-bar"><i style="width:' + pct(pr.d, pr.tot) + '%"></i></span></span>' +
          (best && !cur ? '<span class="tk-st">' + stars(starsFor(best.best)) + '</span>' : cur ? '<span class="tk-now">▶</span>' : '') + '</a>';
      }).join('') + '</nav>' +
      '<div class="tk-f"><a href="#/unit/' + u.n + '/vocab">🔤 Từ vựng</a><a href="#/unit/' + u.n + '/pattern">💬 Mẫu câu</a><a href="#/games/' + u.n + '">🎮 Trò chơi</a></div>';
  }
  function drawPlay() {
    var total = S.match ? S.match.left.length : S.items.length, doneN = S.phase === 'done' ? total : S.match ? 0 : S.i + (S.phase === 'ask' ? 0 : 1);
    var main = S.phase === 'done' ? drawResult() : S.match ? drawMatch() : drawItem(S.items[S.i]);
    var side = '';
    if (S.phase !== 'done' && S.readings && S.readings.length) side = '<aside class="passw">' + S.readings.map(function (r) { return '<div class="passage" style="margin-bottom:12px"><div class="chead" style="margin-bottom:8px"><h3>📖 ' + esc(r.title) + '</h3><button class="btn btn-sm" data-say="' + esc(r.text) + '">' + ic('sound', 16) + 'Nghe</button></div><p class="txt">' + esc(r.text) + '</p></div>'; }).join('') + '</aside>';
    else if (S.phase !== 'done' && S.intro) side = '<aside class="passw"><div class="passage"><div class="chead" style="margin-bottom:8px"><h3>📖 Đọc đoạn văn</h3><button class="btn btn-sm" data-say="' + esc(S.intro) + '">' + ic('sound', 16) + 'Nghe</button></div><p class="txt">' + esc(S.intro) + '</p></div></aside>';
    var tasks = taskPanel();
    app.innerHTML = topBar(S.back, S.title, S.sub, doneN / total, S.match || S.phase === 'done' ? '' : '<span class="tag tag-yel" style="font-size:14px">' + (S.i + 1) + ' / ' + total + '</span>') +
      '<main class="wrap page pwrap' + (tasks ? ' wide' : '') + '"><div class="playgrid' + (tasks ? ' has-tasks' : '') + (side ? ' has-side' : '') + '">' + (tasks ? '<aside class="tasks">' + tasks + '</aside>' : '') + '<div class="pmain">' + main + '</div>' + side + '</div></main>';
    document.body.classList.remove('in-game');
    var inp = document.getElementById('ans'); if (inp && S.phase === 'ask') { inp.focus(); var v = inp.value; inp.value = ''; inp.value = v; }
    var cit = S.phase === 'ask' && !S.match && S.items[S.i];
    if (cit && cit.listen && S.heardAt !== S.i) { S.heardAt = S.i; setTimeout(function () { if (S && S.items[S.i] === cit) speak(cit.listen); }, 380); }
  }
  function blankify(q, fill) { var parts = esc(q).split(/_{2,}/); return parts.length === 1 ? esc(q) : parts.join('<span class="blank">' + (fill ? esc(fill) : '&nbsp;') + '</span>'); }
  /* Lớp nhỏ (1, 2, 3, Everybody Up): đọc to câu hỏi và đáp án vì bé chưa đọc thạo */
  var ENRX = /^[\x00-\x7F’…]+$/;
  function youngRead() { return CURG !== 4; }
  function qSay(it) { if (!youngRead() || !it.q || it.listen || /^(letter|spell|sound|listen)$/.test(it.t || '') || it.type === 'order' || !ENRX.test(it.q) || !/[a-z]/i.test(it.q)) return ''; return it.q.replace(/_{2,}/g, ' … ').replace(/^\(\d+\)\s*/, ''); }
  function optSay(it, k) { if (!youngRead() || it.type !== 'mcq' || it.opic || it.listen || /^(letter|spell|sound)$/.test(it.t || '')) return ''; var o = it.o[k]; return ENRX.test(o) && /[a-z]/i.test(o) && !/^(YES|NO|✓|✗)$/.test(o) ? o : ''; }
  LN.optSay = optSay;
  function drawItem(it) {
    var asked = S.phase === 'ask', res = S.res[S.i], qs = qSay(it);
    var ill = it.pic || it.t ? [] : sentPics((it.type === 'order' ? '' : (it.q || '')) + ' ' + answerText(it), 3);
    var h = '<div class="qcard">' + (ill.length ? '<div class="qillus" aria-hidden="true">' + ill.map(function (x, k) { return '<span class="qi qi' + k + '">' + picHtml(x) + '</span>'; }).join('') + '</div>' : '') + '<span class="qkind">' + kindLabel(it) + '</span>';
    if (it.type === 'mcq') {
      if (it.seq) h += '<div class="seqrow">' + it.seq.map(function (x) { return '<span class="sq">' + picHtml(x) + '</span>'; }).join('') + '<span class="sq qm">' + (asked ? '❓' : picHtml((it.opic && it.opic[it.a]) || it.o[it.a]) ) + '</span></div>';
      if (it.pic) h += '<div class="qpic">' + picHtml(it.pic, 'big') + '</div>';
      if (it.listen) h += '<button type="button" class="listenbtn" data-say="' + esc(it.listen) + '"><span class="li">🔊</span><span>Bấm để nghe lại</span></button>' + (asked ? '' : '<p class="muted small" style="margin:-4px 0 10px">Máy đọc: <b>' + esc(it.listen) + '</b></p>');
      if (it.q) h += '<p class="qtext' + (it.t && !/\s/.test(it.q) ? ' qword' : '') + '">' + blankify(it.q, asked ? (S.sel != null && !it.opic ? it.o[S.sel] : '') : (res.ok ? it.o[it.a] : it.o[res.pick])) + (it.say ? ' ' + sayBtn(it.say, 'sm') : qs ? ' ' + sayBtn(qs, 'sm') : '') + '</p>';
      if (it.opic) {
        h += '<div class="opts pics n' + it.o.length + '">' + it.o.map(function (o, k) {
          var c = asked ? (S.sel === k ? 'sel' : '') : k === it.a ? 'right' : res && k === res.pick ? 'wrong' : '';
          return '<button type="button" class="opt popt ' + c + '" data-pick="' + k + '"' + (asked ? '' : ' disabled') + ' aria-label="Hình ' + (k + 1) + '"><span class="pp">' + picHtml(it.opic[k]) + '</span>' + (asked ? '' : '<span class="pw">' + esc(o) + '</span>') + '</button>';
        }).join('') + '</div>';
      } else {
      var g2 = it.o.length > 3 && it.o.every(function (o) { return o.length < 24; }), big = it.t && it.o.every(function (o) { return o.length <= 4; });
      h += '<div class="opts' + (g2 ? ' g2' : '') + (big ? ' bigo n' + it.o.length : '') + '">' + it.o.map(function (o, k) {
        var c = asked ? (S.sel === k ? 'sel' : '') : k === it.a ? 'right' : res && k === res.pick ? 'wrong' : '';
        return '<button type="button" class="opt ' + c + '" data-pick="' + k + '"' + (asked ? '' : ' disabled') + '><span class="k">' + String.fromCharCode(65 + k) + '</span><span>' + esc(o) + '</span>' + (optSay(it, k) ? '<span class="osay" aria-hidden="true">🔊</span>' : '') + '</button>';
      }).join('') + '</div>';
      }
    } else if (it.type === 'fill') {
      if (it.pic) h += '<div class="qpic">' + picHtml(it.pic, 'big') + '</div>';
      var bank = it.bank || S.bank; if (bank) h += '<div class="bank">' + bank.map(function (b) { return '<span>' + esc(b) + '</span>'; }).join('') + '</div>';
      h += '<p class="qtext">' + blankify(it.q, asked ? '' : res.given) + (qs ? ' ' + sayBtn(qs, 'sm') : '') + '</p><label class="sr-only" for="ans">Câu trả lời</label><input class="inp big" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ từ còn thiếu" value="' + esc(asked ? S.typed : res.given) + '"' + (asked ? '' : ' disabled') + '>';
    } else if (it.type === 'fix') {
      h += '<p class="qtext" style="margin-bottom:14px">' + esc(it.q) + '</p><label class="small muted" for="ans" style="display:block;margin-bottom:6px">' + (it.prefill ? 'Sửa lại câu cho đúng:' : 'Viết câu hoàn chỉnh:') + '</label><input class="inp big" id="ans" autocomplete="off" spellcheck="false" value="' + esc(asked ? (S.typed || (it.prefill ? it.q : '')) : res.given) + '"' + (asked ? '' : ' disabled') + '>';
    } else if (it.type === 'order') {
      if (!S.wo || S.wo.k !== S.i) S.wo = { k: S.i, w: it.w.split('/').map(function (x) { return x.trim(); }).filter(function (x) { return x && x !== '.' && x !== '?'; }) };
      var w = S.wo.w, endP = /\?\s*$/.test(it.a[0]) ? '?' : '.';
      if (it.hintq) h += '<p class="muted" style="margin-bottom:10px">' + esc(it.hintq) + '</p>';
      h += '<div class="build' + (S.built.length ? '' : ' empty') + '">' + S.built.map(function (wi, k) { return '<button type="button" class="wchip in" data-unbuild="' + k + '"' + (asked ? '' : ' disabled') + '>' + esc(w[wi]) + '</button>'; }).join('') + (S.built.length === w.length ? '<span class="head" style="font-size:26px">' + endP + '</span>' : '') + '</div>' +
        '<div class="wchips">' + w.map(function (x, k) { return '<button type="button" class="wchip' + (S.built.indexOf(k) >= 0 ? ' used' : '') + '" data-build="' + k + '"' + (asked ? '' : ' disabled') + '>' + esc(x) + '</button>'; }).join('') + '</div>' +
        (asked && S.built.length ? '<button type="button" class="btn btn-sm btn-ghost" style="margin-top:12px" data-act="clearbuild">' + ic('undo', 16) + 'Xếp lại</button>' : '');
    }
    if (!asked) {
      var ans = answerText(it), en = /^[\x00-\x7F’…]+$/.test(ans);
      h += '<div class="fb ' + (res.ok ? 'ok' : 'no') + '" role="status">' + chick(58, res.ok ? 'wow' : 'sad') + '<div style="flex:1"><p class="h">' + (res.ok ? pick(['Chính xác!', 'Giỏi quá!', 'Đúng rồi! +1 ⭐']) : 'Chưa đúng rồi') + '</p>' + (res.ok ? '' : '<p>Đáp án: <b>' + esc(ans) + '</b></p>') + '</div>' + (en ? sayBtn(fullSentence(it), 'sm') : '') + '</div>' + explainHtml(it, res.ok) + (!res.ok && LN.ai && LN.ai.ready() ? '<button type="button" class="btn btn-sm ai-ask" data-aiexp="1">🤖 Hỏi Chíp vì sao?</button><div id="ai-exp"></div>' : '');
    }
    h += '<div class="qfoot"><span class="small muted">' + (S.review ? 'Làm đúng thì câu được xoá khỏi danh sách ôn' : asked && (it.type === 'fill' || it.type === 'fix') ? 'Bấm Enter để kiểm tra' : '') + '</span>' +
      (asked ? '<button class="btn btn-lg btn-mint" data-act="check">Kiểm tra</button>' : '<button class="btn btn-lg btn-pink" data-act="next" id="nextbtn">' + (S.i + 1 < S.items.length ? 'Câu tiếp theo' : 'Xem kết quả') + '</button>') + '</div>';
    return h + '</div>';
  }
  function fullSentence(it) { var a = answerText(it); if (/_{2,}/.test(it.q || '')) return it.q.replace(/_{2,}/, a).replace(/^\(\d+\)\s*/, '').replace(/…/g, ''); return a; }
  function checkItem() {
    var it = S.items[S.i], ok = false, given = '', pk = null;
    if (it.type === 'mcq') { if (S.sel == null) { toast('Chọn một đáp án đã nhé.'); return; } pk = S.sel; ok = S.sel === it.a; given = it.o[S.sel]; }
    else if (it.type === 'fill' || it.type === 'fix') { var inp = document.getElementById('ans'); given = inp ? inp.value.trim() : ''; if (!given) { toast('Gõ câu trả lời đã nhé.'); return; } ok = matches(given, it.a); }
    else if (it.type === 'order') { if (S.built.length < S.wo.w.length) { toast('Dùng hết các từ để ghép câu nhé.'); return; } given = S.built.map(function (k) { return S.wo.w[k]; }).join(' '); ok = matches(given, it.a); }
    S.res[S.i] = { ok: ok, given: given, pick: pk, item: it };
    recordAnswer(it, ok); if (ok) sfx.ok(); else sfx.bad();
    S.phase = 'fb'; drawPlay();
    var nb = document.getElementById('nextbtn'); if (nb) nb.focus();
  }
  function nextItem() { if (S.i + 1 < S.items.length) { S.i++; S.phase = 'ask'; S.sel = null; S.built = []; S.typed = ''; S.wo = null; drawPlay(); } else { finishSet(); drawPlay(); } }
  function drawMatch() {
    var e = S.match, asked = S.phase === 'ask';
    if (!S.ro) S.ro = shuffle(e.right.map(function (_, i) { return i; }));
    var pr = {}; Object.keys(S.pairs).forEach(function (l) { pr[S.pairs[l]] = +l; });
    var h = '<div class="qcard"><span class="qkind">Nối câu</span><p class="muted small" style="margin-bottom:16px">Bấm một câu bên trái, rồi bấm câu trả lời hợp bên phải. Bấm lại để bỏ nối.</p><div class="match"><div class="col">' +
      e.left.map(function (l, i) {
        var c = !asked ? (S.pairs[i] === e.a[i] ? 'right' : 'wrong') : S.act === i ? 'act' : S.pairs[i] != null ? 'paired' : '';
        var tg = S.pairs[i] != null ? String.fromCharCode(97 + S.ro.indexOf(S.pairs[i])) : (i + 1);
        return '<button type="button" class="mi ' + c + '" data-ml="' + i + '"' + (asked ? '' : ' disabled') + '><span class="tg">' + tg + '</span><span>' + esc(l) + (!asked && S.pairs[i] !== e.a[i] ? '<span class="fix">Đúng: ' + esc(e.right[e.a[i]]) + '</span>' : '') + '</span></button>';
      }).join('') + '</div><div class="col">' + S.ro.map(function (ri, k) {
        return '<button type="button" class="mi ' + (pr[ri] != null ? 'paired' : '') + '" data-mr="' + ri + '"' + (asked ? '' : ' disabled') + '><span class="tg">' + String.fromCharCode(97 + k) + '</span><span>' + esc(e.right[ri]) + '</span></button>';
      }).join('') + '</div></div>';
    if (!asked) { var r = e.left.filter(function (_, i) { return S.pairs[i] === e.a[i]; }).length; h += '<div class="fb ' + (r === e.left.length ? 'ok' : 'no') + '">' + chick(58, r === e.left.length ? 'wow' : 'sad') + '<div><p class="h">Đúng ' + r + ' / ' + e.left.length + ' cặp</p><p class="small">Cặp sai có ghi đáp án ngay dưới câu.</p></div></div>'; }
    return h + '<div class="qfoot"><span class="small muted">Đã nối ' + Object.keys(S.pairs).length + ' / ' + e.left.length + '</span>' + (asked ? '<button class="btn btn-lg btn-mint" data-act="checkmatch">Kiểm tra</button>' : '<button class="btn btn-lg btn-pink" data-act="finishmatch">Xem kết quả</button>') + '</div></div>';
  }
  function checkMatch() {
    var e = S.match; if (Object.keys(S.pairs).length < e.left.length) { toast('Nối hết các câu bên trái đã nhé.'); return; }
    S.res = e.left.map(function (l, i) { var ok = S.pairs[i] === e.a[i], it = { type: 'mcq', q: l, o: e.right, a: e.a[i], src: { exId: S.exId, idx: i } }; recordAnswer(it, ok); return { ok: ok, given: e.right[S.pairs[i]], item: it }; });
    if (S.res.every(function (r) { return r.ok; })) sfx.ok(); else sfx.bad();
    S.phase = 'fb'; drawPlay();
  }
  function drawResult() {
    var sc = S.score, st = starsFor(sc), wrong = S.res.filter(function (r) { return !r.ok; });
    var msg = sc === 100 ? 'Tuyệt vời! Không sai câu nào!' : sc >= 80 ? 'Giỏi lắm!' : sc >= 50 ? 'Khá rồi! Ôn lại mấy câu sai nhé.' : 'Mình xem lại Mẫu câu rồi làm lại nhé!';
    var nx = '', r = S.exId && EX[S.exId];
    if (r && r.unit) { var l = r.unit.exercises, ix = l.indexOf(r.ex); if (l[ix + 1]) nx = '<a class="btn btn-lg btn-pink" href="#/ex/' + l[ix + 1].id + '">Bài tiếp theo</a>'; }
    return '<div class="qcard res">' + (hasArt('result-great') ? art(sc >= 70 ? 'result-great' : 'result-try', 250, 'res-art') : chick(140, sc >= 70 ? 'wow' : sc >= 40 ? 'happy' : 'sad')) + '<div class="bigstars">' + stars(st, 3, '') + '</div>' +
      '<p class="score" style="color:' + (sc >= 80 ? 'var(--mint)' : sc >= 50 ? 'var(--yel-dk)' : 'var(--red)') + '">' + sc + '%</p><p class="head" style="font-size:24px;margin:8px 0 2px">' + msg + '</p><p class="muted">Đúng ' + S.right + ' / ' + S.res.length + ' câu · +' + S.right + ' ⭐</p>' +
      '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:22px"><button class="btn btn-lg" data-act="retry">Làm lại</button><a class="btn btn-lg" href="' + S.back + '">Quay lại</a>' + nx + '</div></div>' +
      (wrong.length ? '<div class="card" style="margin-top:16px"><h2>Câu sai (' + wrong.length + ') — đã thêm vào Ôn câu sai</h2>' + wrong.map(function (x) {
        return '<div class="wl"><p style="font-weight:800">' + esc(x.item.type === 'order' ? x.item.w.split('/').join(' / ') : x.item.q) + '</p><p class="y">Em trả lời: ' + esc(x.given || '(bỏ trống)') + '</p><p class="r">Đáp án: ' + esc(answerText(x.item)) + '</p>' + explainHtml(x.item, true) + '</div>';
      }).join('') + '</div>' : '') + reviewBox();
  }
  /* Sau khi chữa bài: danh sách từ vựng có trong bài + ngữ pháp liên quan */
  var VIDX = null;
  function reviewBox() {
    if (!VIDX) { VIDX = []; UNITS.forEach(function (u) { u.vocab.forEach(function (v) { if (v[0].length > 2) VIDX.push(v); }); }); VIDX.sort(function (a, b) { return b[0].length - a[0].length; }); }
    var txt = ' ' + (S.match ? S.match.left.concat(S.match.right) : S.items.map(function (it) { return (it.type === 'order' ? '' : it.q || '') + ' ' + answerText(it); })).join(' ').toLowerCase().replace(/[^a-z' ]+/g, ' ') + ' ';
    var words = [], seen = {};
    VIDX.forEach(function (v) { var w = v[0].toLowerCase(); if (words.length < 12 && !seen[w] && (txt.indexOf(' ' + w + ' ') >= 0 || txt.indexOf(' ' + w + 's ') >= 0)) { seen[w] = 1; words.push(v); } });
    var tids = []; (S.match ? [{ src: { exId: S.exId } }] : S.items).forEach(function (it) { var r = it.src && EX[it.src.exId], t = r && r.ex.topic; if (t && t !== 'vocab' && t !== 'reading' && tids.indexOf(t) < 0) tids.push(t); });
    var r0 = S.exId && EX[S.exId]; if (r0 && r0.unit && r0.unit.topic && tids.indexOf(r0.unit.topic) < 0) tids.push(r0.unit.topic);
    var gl = grammar(), topics = tids.map(function (t) { return gl.filter(function (x) { return x.id === t; })[0]; }).filter(Boolean).slice(0, 4);
    if (!words.length && !topics.length) return '';
    return '<div class="card rvbox"><h2>📚 Ôn lại sau bài</h2><div class="rv-grid">' +
      (words.length ? '<div><p class="rv-h">🔤 Từ vựng trong bài <span>(bấm để nghe)</span></p><div class="rv-words">' + words.map(function (v) { return '<button type="button" class="rv-w" data-say="' + esc(v[0]) + '"><span class="rv-p">' + picHtml(v[2]) + '</span><span><b>' + esc(v[0]) + '</b><small>' + esc(v[1]) + '</small></span></button>'; }).join('') + '</div></div>' : '') +
      (topics.length ? '<div><p class="rv-h">📘 Ngữ pháp liên quan</p>' + topics.map(function (t) { return '<a class="rv-g" href="#/grammar/' + t.id + '"><span class="gic">' + esc(t.icon || '📘') + '</span><span><b>' + esc(t.title) + '</b><small>' + esc((t.summary || '').slice(0, 110)) + '</small></span><span class="rv-go">Xem →</span></a>'; }).join('') + '</div>' : '') + '</div></div>';
  }

  /* ================= Trò chơi từ vựng ================= */
  var GCATS = LN.GCATS = [
    { id: 'warm', em: '🌱', name: 'Làm quen từ mới', d: 'Xem thẻ, nghe đọc, nối từ' },
    { id: 'fast', em: '⚡', name: 'Phản xạ nhanh', d: 'Trò chơi hành động, có mạng và tốc độ' },
    { id: 'quiz', em: '🎉', name: 'Đố vui', d: 'Trả lời câu đố, giành điểm thưởng' },
    { id: 'word', em: '🔤', name: 'Chữ và câu', d: 'Đánh vần, ô chữ, sắp xếp câu' },
    { id: 'talk', em: '🎤', name: 'Nhớ và nói', d: 'Luyện trí nhớ và phát âm' }
  ];
  var GAMES = LN.GAMES = [
    { id: 'cards', cat: 'warm', em: '🃏', name: 'Thẻ từ', desc: 'Xem hình, nghe đọc, lật xem nghĩa', top: 1 },
    { id: 'listen', cat: 'warm', em: '🎧', name: 'Nghe và chọn', desc: 'Nghe từ, chọn đúng hình' },
    { id: 'match', cat: 'warm', em: '🔗', name: 'Nối từ', desc: 'Nối từ tiếng Anh với nghĩa' },
    { id: 'kart', cat: 'fast', em: '🏎️', name: 'Đua xe siêu tốc', desc: 'Trả lời đúng để tăng tốc, về nhất cuộc đua!', top: 1, nw: 1 },
    { id: 'whack', cat: 'fast', em: '🔨', name: 'Đập chuột chũi', desc: 'Đập thật nhanh chú chuột chũi cầm từ đúng', arcade: 1, top: 1, nw: 1 },
    { id: 'fishing', cat: 'fast', em: '🎣', name: 'Câu cá vàng', desc: 'Câu đúng chú cá mang từ cần tìm, né cá mập', arcade: 1, nw: 1 },
    { id: 'balloon', cat: 'fast', em: '🎈', name: 'Bắn bóng bay', desc: 'Chọc đúng quả bóng mang từ cần tìm', arcade: 1, top: 1 },
    { id: 'airplane', cat: 'fast', em: '✈️', name: 'Máy bay', desc: 'Lái máy bay vào đám mây đúng', arcade: 1 },
    { id: 'fruit', cat: 'fast', em: '🍉', name: 'Trái cây bay', desc: 'Bấm trúng trái cây mang từ đúng', arcade: 1 },
    { id: 'maze', cat: 'fast', em: '🌀', name: 'Mê cung', desc: 'Chạy tới góc có từ đúng, né bạn ma', arcade: 1 },
    { id: 'monster', cat: 'quiz', em: '👾', name: 'Đại chiến quái vật', desc: 'Trả lời đúng để Gà Hiệp Sĩ hạ 2 Boss quái vật', top: 1, nw: 1 },
    { id: 'gameshow', cat: 'quiz', em: '🏆', name: 'Đấu trường', desc: 'Trả lời nhanh, có mạng và điểm thưởng' },
    { id: 'quiz', cat: 'quiz', em: '✅', name: 'Trắc nghiệm', desc: 'Chọn nghĩa đúng, có đồng hồ' },
    { id: 'find', cat: 'quiz', em: '🎯', name: 'Tìm từ đúng', desc: 'Bấm nhanh vào từ đúng với nghĩa' },
    { id: 'pair', cat: 'quiz', em: '⚖️', name: 'Đúng hay sai', desc: 'Từ và nghĩa có khớp không?' },
    { id: 'openbox', cat: 'quiz', em: '🎁', name: 'Mở hộp quà', desc: 'Mở từng hộp, trả lời câu hỏi' },
    { id: 'wheel', cat: 'quiz', em: '🎡', name: 'Vòng quay', desc: 'Quay trúng từ nào, chọn nghĩa từ đó' },
    { id: 'spell', cat: 'word', em: '🔤', name: 'Ghép chữ', desc: 'Xếp chữ cái thành từ đúng' },
    { id: 'type', cat: 'word', em: '⌨️', name: 'Gõ đáp án', desc: 'Nhìn hình, gõ từ tiếng Anh' },
    { id: 'crossword', cat: 'word', em: '🧩', name: 'Ô chữ', desc: 'Điền từ theo gợi ý nghĩa' },
    { id: 'wordsearch', cat: 'word', em: '🔍', name: 'Tìm chữ', desc: 'Tìm các từ giấu trong bảng chữ' },
    { id: 'unscramble', cat: 'word', em: '🧱', name: 'Sắp xếp câu', desc: 'Xếp các từ thành câu đúng' },
    { id: 'categorize', cat: 'word', em: '🗂️', name: 'Phân loại', desc: 'Xếp từ vào đúng nhóm chủ đề' },
    { id: 'watch', cat: 'talk', em: '👀', name: 'Xem và nhớ', desc: 'Nhớ các hình vừa xuất hiện' },
    { id: 'speak', cat: 'talk', em: '🎤', name: 'Thẻ nói', desc: 'Nhìn hình và nói to từ tiếng Anh' },
    { id: 'speakq', cat: 'talk', em: '🗣️', name: 'Hỏi – đáp', desc: 'Nghe câu hỏi, trả lời bằng giọng nói', nw: 1 }
  ];
  var IMPL = function () { return LN.GAME_IMPL || {}; };
  var G = null;
  function viewGames(n) {
    var u = me(); if (!LN.hasUnits(u.grade)) { notReady(u, 'games'); return; }
    var p = prog(); n = +n || currentUnit(p).n; var g = p.games[n] || {}, cu = unitOf(n);
    render(header('games') + '<main class="wrap page"><section class="gbanner"><div><h1 class="title">Trò chơi từ vựng</h1><p>Chọn Unit rồi chọn trò chơi. Mỗi trò chơi xong được ⭐ thưởng!</p></div><span class="gbn-em">' + (hasArt('chip-celebrate') ? art('chip-celebrate', 120) : '🎮') + '</span></section>' +
      '<div class="uscroll" role="tablist" aria-label="Chọn Unit">' + UNITS.map(function (x) {
        return '<a role="tab" aria-selected="' + (x.n === n) + '" class="uchip' + (x.n === n ? ' on' : '') + '" href="#/games/' + x.n + '" title="' + esc(x.title) + '"><span>' + uic(x, 26) + '</span>Unit ' + x.n + '</a>';
      }).join('') + '</div>' +
      '<div class="chead" style="margin-top:6px"><h2 class="sub">' + cu.icon + ' Unit ' + n + ' · ' + esc(cu.title) + '</h2><span class="muted small">' + cu.vocab.length + ' từ · ' + GAMES.length + ' trò chơi</span></div>' +
      GCATS.map(function (c) {
        var list = GAMES.filter(function (x) { return x.cat === c.id; });
        return '<section class="gcat"><h3 class="gcat-h"><span>' + c.em + '</span>' + c.name + ' <small>' + c.d + '</small></h3><div class="gtiles">' + list.map(function (x) { return gameTile(x, n, g); }).join('') + '</div></section>';
      }).join('') + '</main>' + footer());
    var on = document.querySelector('.uchip.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  /* Unit ít từ (lớp 1): thêm từ của các Unit trước để trò chơi đủ lựa chọn */
  function gameWords(u, min) {
    var w = u.vocab.slice(), has = function (v) { return w.some(function (x) { return x[0] === v[0]; }); }, k;
    for (k = u.n - 2; k >= 0 && w.length < (min || 0); k--) UNITS[k].vocab.forEach(function (v) { if (w.length < min && !has(v)) w.push(v); });
    for (k = u.n; k < UNITS.length && w.length < Math.min(min || 0, 6); k++) UNITS[k].vocab.forEach(function (v) { if (w.length < Math.min(min, 6) && !has(v)) w.push(v); });
    return w.map(function (v) { return { en: v[0], vi: v[1], pic: v[2] }; });
  }
  function startGame(kind, n) {
    var u = unitOf(n); if (!u) { go('#/games'); return; }
    var w = gameWords(u, kind === 'cards' || kind === 'speak' ? 0 : 8);
    G = { kind: kind, n: +n, u: u, score: 0, done: false, sc: 0, cb: 0, maxCb: 0, intro: kind !== 'cards' };
    gameBg(kind);
    if (IMPL()[kind]) { G.words = w; IMPL()[kind].init(G); drawGame(); return; }
    if (kind === 'cards') Object.assign(G, { list: w, queue: w.map(function (_, k) { return k; }), known: 0, miss: 0, again: {}, flip: false, front: 'en', anim: '' });
    else if (kind === 'listen') {
      G.rounds = shuffle(w).slice(0, 10).map(function (x) { var o = shuffle([x].concat(shuffle(w.filter(function (y) { return y.en !== x.en && y.vi !== x.vi; })).slice(0, 3))); return { w: x, o: o }; });
      G.i = 0; G.pick = null;
    } else if (kind === 'spell') {
      var single = w.filter(function (x) { return /^[A-Za-z]{3,10}$/.test(x.en); });
      if (single.length < 5) single = single.concat(w.filter(function (x) { return !/^[A-Za-z]{3,10}$/.test(x.en) && /^[A-Za-z' -]{3,24}$/.test(x.en) && x.en.replace(/[^A-Za-z]/g, '').length <= 16; }).sort(function (a, b) { return a.en.length - b.en.length; }).slice(0, 8 - single.length));
      G.rounds = shuffle(single).slice(0, 8).map(function (x) { var letters = []; x.en.split('').forEach(function (c, i) { if (/[A-Za-z]/.test(c)) letters.push(i); }); return { w: x, letters: letters, tiles: shuffle(letters), fill: [], tries: 0 }; });
      G.i = 0;
    } else { go('#/games'); return; }
    drawGame();
    if (kind === 'listen') setTimeout(function () { if (G && G.kind === 'listen') speak(G.rounds[0].w.en); }, 2700);
  }
  function gname(k) { return GAMES.filter(function (x) { return x.id === k; })[0].name; }
  function drawGame() {
    var g = G, body = '', frac = 0, right = '';
    if (g.done) body = gameResult();
    else if (IMPL()[g.kind]) { var rv = IMPL()[g.kind].view(g); body = rv.body; frac = rv.frac || 0; right = rv.right || ''; }
    else if (g.kind === 'cards') {
      var c = g.list[g.queue[0]], showEn = g.front === 'en', ag = g.again[g.queue[0]] || 0;
      var fEn = '<div class="pic">' + picHtml(c.pic, 'lg') + '</div><div class="w">' + esc(c.en) + '</div>', fVi = '<div class="w" style="font-size:36px">' + esc(c.vi) + '</div><div style="font-size:44px">' + picHtml(c.pic) + '</div>';
      frac = g.known / g.list.length; right = '<span class="ghud">✅ Đã nhớ <b>' + g.known + '/' + g.list.length + '</b></span>';
      body = '<div class="gwrap"><div class="fcstat"><span class="fs-k">😄 Đã nhớ: <b>' + g.known + '</b></span><span class="fs-q">' + (hasArt('card-back') ? art('card-back', 0, 'fs-cb') : '🃏') + ' Còn: <b>' + g.queue.length + '</b> thẻ</span><span class="fs-m">😕 Lần quên: <b>' + g.miss + '</b></span></div>' +
        '<div class="fc-deck">' + (hasArt('card-back') ? '<div class="fc-pile" aria-hidden="true">' + Array.apply(null, Array(Math.min(4, Math.max(0, g.queue.length - 1)))).map(function (_, i) { return art('card-back', 0, 'fc-pb p' + i); }).join('') + '</div>' : '') +
        '<div class="flip ' + (g.flip ? 'on ' : '') + (g.anim || '') + '" data-act="gflip" role="button" tabindex="0" aria-label="Lật thẻ">' + (ag ? '<span class="again">Ôn lại lần ' + (ag + 1) + '</span>' : '') + '<div class="flip-in"><div class="face f">' + (showEn ? fEn : fVi) + '<span class="hint">Bấm vào thẻ để lật</span></div><div class="face b">' + (showEn ? fVi : fEn) + '</div></div></div></div>' +
        '<div class="gctrl">' + sayBtn(c.en) + '<button class="btn btn-lg btn-yel" data-act="gflip">🔄 Lật thẻ</button></div>' +
        '<div class="fcbtns"><button class="fcb no" data-act="gforget"><span>😕</span>Chưa nhớ<small>Thẻ sẽ quay lại sau</small></button><button class="fcb yes" data-act="gknow"><span>😄</span>Đã nhớ<small>Bỏ thẻ ra khỏi chồng</small></button></div>' +
        '<div class="gctrl" style="margin-top:12px"><button class="btn btn-sm" data-act="gshuffle">' + ic('shuffle', 16) + 'Trộn thẻ</button><button class="btn btn-sm" data-act="gside">' + ic('swap', 16) + (showEn ? 'Mặt trước: tiếng Việt' : 'Mặt trước: tiếng Anh') + '</button></div>' +
        '<p class="ghelp">Phím: Space lật thẻ · ← chưa nhớ · → đã nhớ</p></div>';
    } else if (g.kind === 'listen') {
      var r = g.rounds[g.i]; frac = g.i / g.rounds.length; right = '<span class="tag tag-yel" style="font-size:14px">⭐ ' + g.score + ' · ' + (g.i + 1) + '/' + g.rounds.length + '</span>';
      body = '<div class="gwrap"><button class="bigsay" data-say="' + esc(r.w.en) + '" aria-label="Nghe lại">' + ic('sound', 54, '#fff', 2.2) + '</button><p class="center head" style="font-size:22px;margin-bottom:18px">Nghe và chọn đúng hình nhé</p><div class="lgrid">' +
        r.o.map(function (x, k) { var c = g.pick == null ? '' : x === r.w ? 'right' : k === g.pick ? 'wrong' : ''; return '<button type="button" class="lopt ' + c + '" data-lpick="' + k + '"' + (g.pick != null ? ' disabled' : '') + '><span class="pic">' + picHtml(x.pic) + '</span><span class="m">' + esc(x.vi) + '</span>' + (g.pick != null && x === r.w ? '<span class="head" style="font-size:20px;color:var(--mint-dk)">' + esc(x.en) + '</span>' : '') + '</button>'; }).join('') + '</div></div>';
    } else if (g.kind === 'spell') {
      var sr = g.rounds[g.i], chars = sr.w.en.split(''); frac = g.i / g.rounds.length; right = '<span class="tag tag-yel" style="font-size:14px">⭐ ' + g.score + ' · ' + (g.i + 1) + '/' + g.rounds.length + '</span>';
      var slotH = '', li = 0;
      chars.forEach(function (ch) {
        if (/[A-Za-z]/.test(ch)) { var t = sr.fill[li]; slotH += '<button type="button" class="slot' + (t != null ? ' f' : '') + '" data-slot="' + li + '"' + (sr.lock ? ' disabled' : '') + ' aria-label="Ô chữ ' + (li + 1) + '">' + (t != null ? esc(chars[t]) : '') + '</button>'; li++; }
        else slotH += ch === ' ' ? '<span class="slot gap"></span>' : '<span class="slot fixed">' + esc(ch) + '</span>';
      });
      body = '<div class="gwrap center"><div style="font-size:84px;line-height:1">' + picHtml(sr.w.pic, 'lg') + '</div><p class="head" style="font-size:26px;margin-top:10px">' + esc(sr.w.vi) + ' ' + sayBtn(sr.w.en, 'sm') + '</p>' +
        '<div class="slots' + (sr.state ? ' ' + sr.state : '') + '">' + slotH + '</div><div class="ltiles">' + sr.tiles.map(function (t) { return '<button type="button" class="lt' + (sr.fill.indexOf(t) >= 0 ? ' used' : '') + '" data-tile="' + t + '"' + (sr.lock ? ' disabled' : '') + '>' + esc(chars[t]) + '</button>'; }).join('') + '</div>' +
        '<div class="gctrl"><button class="btn btn-sm" data-act="sclear"' + (sr.lock ? ' disabled' : '') + '>' + ic('undo', 16) + 'Xếp lại</button><button class="btn btn-sm" data-act="shint"' + (sr.lock ? ' disabled' : '') + '>💡 Gợi ý</button></div></div>';
    }
    var gm = GAMES.filter(function (x) { return x.id === g.kind; })[0] || {};
    var pchip = g.kind === 'cards' ? '' : '<span class="gpts" id="gpts"><span class="gp-l">ĐIỂM</span><b>' + g.sc + '</b>' + (g.cb >= 2 ? '<span class="gp-c">x' + comboMult(g.cb) + ' 🔥' + g.cb + '</span>' : '') + '</span>';
    app.innerHTML = topBar('#/games/' + g.n, (gm.em || '') + ' ' + gname(g.kind), 'Unit ' + g.n + ' · ' + g.u.title, g.done ? 1 : frac, g.done ? '' : '<span class="gtr">' + right + pchip + '</span>', 'gtop c-' + (gm.cat || 'warm')) + '<main class="wrap page gpage">' + body + '</main>';
    document.body.classList.add('in-game'); document.body.setAttribute('data-gcat', gm.cat || 'warm');
    if (!g.done && g.intro) { g.intro = false; countdown(function () { if (G === g && !g.done && IMPL()[g.kind] && IMPL()[g.kind].mounted) IMPL()[g.kind].mounted(g); }); return; }
    if (!g.done && IMPL()[g.kind] && IMPL()[g.kind].mounted) IMPL()[g.kind].mounted(g);
  }
  /* ---------- Hiệu ứng game: điểm, combo, đếm ngược, nền động ---------- */
  var LASTXY = [window.innerWidth / 2, window.innerHeight / 2];
  document.addEventListener('pointerdown', function (e) { LASTXY = [e.clientX, e.clientY]; }, true);
  function comboMult(c) { return c >= 8 ? 4 : c >= 5 ? 3 : c >= 3 ? 2 : 1; }
  function floater(txt, cls, x, y) { var f = document.createElement('div'); f.className = 'floater ' + (cls || ''); f.textContent = txt; f.style.left = x + 'px'; f.style.top = y + 'px'; document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1100); }
  function particles(x, y, ok) {
    var em = ok ? ['⭐', '✨', '💖', '🌟'] : ['💥'], n = ok ? 10 : 4;
    for (var i = 0; i < n; i++) { var s = document.createElement('span'); s.className = 'ptc'; s.textContent = em[i % em.length]; var a = Math.random() * Math.PI * 2, d = 50 + Math.random() * 70; s.style.left = x + 'px'; s.style.top = y + 'px'; s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d - 30 + 'px'); document.body.appendChild(s); setTimeout(function (el) { return function () { el.remove(); }; }(s), 900); }
  }
  var gameHit = LN.gameHit = function (ok) {
    var g = G; if (!g || g.done) return;
    var x = LASTXY[0], y = LASTXY[1];
    if (ok) {
      g.cb++; g.maxCb = Math.max(g.maxCb, g.cb); var m = comboMult(g.cb), add = 100 * m; g.sc += add;
      floater('+' + add, m > 1 ? 'big' : '', x, y - 20); particles(x, y, true);
      if (g.cb === 3 || g.cb === 5 || g.cb === 8 || (g.cb > 8 && g.cb % 5 === 0)) { var cb = document.createElement('div'); cb.className = 'combo'; cb.innerHTML = '<span>COMBO x' + m + '</span><small>' + g.cb + ' câu đúng liên tiếp 🔥</small>'; document.body.appendChild(cb); setTimeout(function () { cb.remove(); }, 1300); sfx.combo(); }
      flash('ok');
    } else {
      if (g.cb >= 3) floater('Mất combo!', 'lost', x, y - 20); g.cb = 0; particles(x, y, false); flash('no');
      var pgEl = document.querySelector('.gpage'); if (pgEl) { pgEl.classList.remove('shake'); void pgEl.offsetWidth; pgEl.classList.add('shake'); }
    }
    var chip = document.getElementById('gpts');
    if (chip) { chip.innerHTML = '<span class="gp-l">ĐIỂM</span><b>' + g.sc + '</b>' + (g.cb >= 2 ? '<span class="gp-c">x' + comboMult(g.cb) + ' 🔥' + g.cb + '</span>' : ''); chip.classList.remove('pulse'); void chip.offsetWidth; chip.classList.add('pulse'); }
  };
  function flash(k) { var f = document.createElement('div'); f.className = 'gflash ' + k; document.body.appendChild(f); setTimeout(function () { f.remove(); }, 450); }
  function countdown(done) {
    var o = document.createElement('div'); o.className = 'cdown'; document.body.appendChild(o);
    var seq = ['3', '2', '1', 'BẮT ĐẦU!'], i = 0;
    (function step() {
      if (!document.body.contains(o)) return;
      if (i >= seq.length) { o.remove(); done(); return; }
      var cn = 'countdown-' + ['3', '2', '1', 'go'][i];
      o.innerHTML = '<span class="' + (i === 3 ? 'go' : '') + (hasArt(cn) ? ' cd-art' : '') + '">' + (hasArt(cn) ? art(cn, 0, 'cd-img', seq[i]) : seq[i]) + '</span>'; if (i < 3) sfx.tick(); else sfx.go(); i++; setTimeout(step, i === 4 ? 650 : 600);
    })();
  }
  var GBG = { warm: ['🌱', '🃏', '🎧', '🌼', '✨'], fast: ['🎈', '⭐', '☁️', '🚀', '⚡'], quiz: ['❓', '⭐', '🎉', '💡', '🏆'], word: ['🔤', '✏️', '📚', '🧩', '✨'], talk: ['🎤', '🎵', '👀', '💬', '✨'] };
  function gameBg(kind) {
    var old = document.getElementById('gbg'); if (old) old.remove();
    var gm = GAMES.filter(function (x) { return x.id === kind; })[0] || {}, set = GBG[gm.cat] || GBG.warm, d = document.createElement('div'); d.id = 'gbg'; d.className = 'gbg';
    for (var i = 0; i < 16; i++) { var s = document.createElement('span'); s.textContent = i % 4 === 0 ? (gm.em || set[0]) : set[i % set.length]; s.style.left = (Math.random() * 96) + '%'; s.style.animationDuration = (14 + Math.random() * 16) + 's'; s.style.animationDelay = (-Math.random() * 20) + 's'; s.style.fontSize = (22 + Math.random() * 26) + 'px'; d.appendChild(s); }
    document.body.appendChild(d);
  }
  function finishGame(st, earned, text) {
    var p = prog(), total = G.total || (G.rounds ? G.rounds.length : G.pairs || (G.list || []).length);
    p.games[G.n] = p.games[G.n] || {}; p.games[G.n][G.kind] = Math.max(p.games[G.n][G.kind] || 0, st);
    p.vlearn[G.n] = true; p.stars += earned; p.days[dayKey()] = (p.days[dayKey()] || 0) + total;
    p.topics.vocab = p.topics.vocab || [0, 0];
    if (G.kind !== 'cards') { p.topics.vocab[0] += G.score; p.topics.vocab[1] += total; }
    p.log.push({ id: 'game-' + G.kind + '-' + G.n, title: gname(G.kind) + ' · Unit ' + G.n, right: G.score, total: total, t: Date.now(), game: true });
    saveProg(p);
    var bk = G.kind + '_' + G.n; p.gbest = p.gbest || {}; G.prevBest = p.gbest[bk] || 0; G.newBest = G.kind !== 'cards' && G.sc > G.prevBest; if (G.newBest) { p.gbest[bk] = G.sc; saveProg(p); }
    G.done = true; G.st = st; G.earned = earned; G.text = text; sfx.win(); if (st >= 2) confetti(); drawGame(); animResult();
  }
  function gameResult() {
    var cur = GAMES.filter(function (x) { return x.id === G.kind; })[0], sug = shuffle(GAMES.filter(function (x) { return x.id !== G.kind && x.cat !== cur.cat; })).slice(0, 3).concat(GAMES.filter(function (x) { return x.id !== G.kind && x.cat === cur.cat; }).slice(0, 1));
    var pg = prog().games[G.n] || {};
    var sprite = hasArt('trophy-big') && hasArt('star-1');
    var hero = sprite ? '<div class="gres-hero">' + art(G.st >= 3 ? 'chip-trophy' : G.st >= 2 ? 'chip-celebrate' : 'chip-wave', 0, 'gr-chip') + '<div class="trophy">' + art(G.st >= 3 ? 'trophy-big' : G.st >= 2 ? 'icon-medal-2' : 'icon-medal-3', 0, 'gr-trophy' + (G.st >= 3 ? '' : ' medal'), G.st >= 3 ? 'Cúp vàng' : 'Huy chương') + '</div></div>' :
      '<div class="trophy">' + (G.st >= 3 ? '🏆' : G.st >= 2 ? '🥈' : '🎖️') + '</div>' + chibi({ size: 110, mood: G.st >= 2 ? 'wow' : 'happy', pose: G.st >= 2 ? 'cheer' : 'wave', acc: G.st >= 3 ? 'crown' : 'bow' });
    var starsH = sprite ? '<div class="rstars rstars-art">' + art('star-' + Math.max(1, Math.min(3, G.st)), 0, 'gr-stars', G.st + ' sao') + '</div>' : '<div class="rstars">' + [1, 2, 3].map(function (k) { return '<span class="rs' + (k <= G.st ? ' on' : '') + '" style="--i:' + k + '">★</span>'; }).join('') + '</div>';
    return '<div class="gwrap"><div class="gres">' + hero + starsH + '<p class="head rt">' + esc(G.text) + '</p>' +
      (G.kind !== 'cards' ? '<div class="rpts"><div><span>Điểm</span><b id="rcount" data-to="' + G.sc + '">0</b></div><div><span>Combo cao nhất</span><b>🔥 ' + G.maxCb + '</b></div><div><span>Kỷ lục</span><b>' + Math.max(G.sc, G.prevBest) + '</b></div></div>' + (G.newBest ? '<p class="newbest">🎉 KỶ LỤC MỚI! 🎉</p>' : '') : '') +
      '<p class="rsub">+' + G.earned + ' ⭐ · ' + (G.st >= 3 ? 'Xuất sắc!' : G.st >= 2 ? 'Giỏi lắm!' : 'Cố lên, chơi lại để được 3 sao nhé!') + '</p>' +
      '<div class="gctrl"><button class="btn btn-lg btn-pink" data-act="gagain">🔁 Chơi lại</button><a class="btn btn-lg" href="#/games/' + G.n + '">🎮 Chọn trò khác</a><a class="btn btn-lg btn-yel" href="#/unit/' + G.n + '/pattern">Học mẫu câu →</a></div>' +
      '<p class="small muted" style="margin:22px 0 10px;font-weight:800">Thử tiếp:</p><div class="gtiles mini">' + sug.map(function (x) { return gameTile(x, G.n, pg); }).join('') + '</div></div></div>';
  }
  function animResult() {
    var el = document.getElementById('rcount'); if (el) { var to = +el.getAttribute('data-to'), t0 = performance.now(); (function f(now) { var k = Math.min(1, (now - t0) / 1200); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1 && document.body.contains(el)) requestAnimationFrame(f); })(t0); }
    [1, 2, 3].forEach(function (k) { if (k <= G.st) setTimeout(function () { sfx.star(k); }, 350 + k * 330); });
  }
  function gameAct(a) {
    var g = G;
    if (g.kind !== 'cards') return false;
    if (a === 'gflip') { g.flip = !g.flip; g.anim = ''; sfx.flip(); drawGame(); if ((g.front === 'en') !== g.flip) speak(g.list[g.queue[0]].en); return true; }
    if (a === 'gknow' || a === 'gforget') {
      var k = g.queue.shift();
      if (a === 'gknow') { g.known++; sfx.ok(); burst(true, pick(['Nhớ rồi!', 'Giỏi quá!', 'Tuyệt!'])); g.anim = 'in-r'; }
      else { g.miss++; g.again[k] = (g.again[k] || 0) + 1; var pos = Math.min(g.queue.length, 2 + Math.floor(Math.random() * 2)); g.queue.splice(pos, 0, k); sfx.flip(); burst(false, 'Ôn lại sau nhé!'); g.anim = 'in-l'; }
      g.flip = false;
      if (!g.queue.length) { g.score = g.list.length; var n = g.list.length, st = g.miss <= 1 ? 3 : g.miss <= Math.ceil(n / 2) ? 2 : 1; finishGame(st, Math.max(3, n - g.miss), 'Đã nhớ hết ' + n + ' từ' + (g.miss ? ' (quên ' + g.miss + ' lần)' : ' ngay lần đầu!')); return true; }
      drawGame(); if (g.front === 'en') speak(g.list[g.queue[0]].en); return true;
    }
    if (a === 'gshuffle') { g.queue = shuffle(g.queue); g.flip = false; drawGame(); toast('Đã trộn thẻ'); return true; }
    if (a === 'gside') { g.front = g.front === 'en' ? 'vi' : 'en'; g.flip = false; drawGame(); return true; }
    return false;
  }
  function gameClick(t) {
    var g = G; if (!g || g.done) return false;
    var a = t.getAttribute('data-act');
    if (a && gameAct(a)) return true;
    if (IMPL()[g.kind]) return !!IMPL()[g.kind].click(g, t);
    if (g.kind === 'listen' && t.hasAttribute('data-lpick')) {
      if (g.pick != null) return true; var r = g.rounds[g.i], k = +t.getAttribute('data-lpick'), right = r.o[k] === r.w; g.pick = k;
      if (right) { g.score++; sfx.ok(); burst(true); gameHit(true); } else { sfx.bad(); burst(false, 'Đáp án: ' + r.w.en); gameHit(false); }
      drawGame();
      setTimeout(function () {
        if (G !== g) return;
        if (g.i + 1 < g.rounds.length) { g.i++; g.pick = null; drawGame(); speak(g.rounds[g.i].w.en); }
        else { var f = g.score / g.rounds.length; finishGame(f >= 0.9 ? 3 : f >= 0.7 ? 2 : 1, g.score, 'Đúng ' + g.score + ' / ' + g.rounds.length + ' từ!'); }
      }, right ? 900 : 1600);
      return true;
    }
    if (g.kind === 'spell') {
      var sr = g.rounds[g.i]; if (sr.lock) return true;
      if (t.hasAttribute('data-tile')) { sr.fill.push(+t.getAttribute('data-tile')); sr.state = ''; drawGame(); if (sr.fill.length === sr.letters.length) spellCheck(); return true; }
      if (t.hasAttribute('data-slot')) { var si = +t.getAttribute('data-slot'); if (sr.fill[si] != null) { sr.fill.splice(si, 1); sr.state = ''; drawGame(); } return true; }
      if (a === 'sclear') { sr.fill = []; sr.state = ''; drawGame(); return true; }
      if (a === 'shint') {
        var chars = sr.w.en.split(''), want = chars[sr.letters[sr.fill.length]];
        var cand = sr.tiles.filter(function (tt) { return sr.fill.indexOf(tt) < 0 && chars[tt].toLowerCase() === want.toLowerCase(); })[0];
        if (cand != null) { sr.fill.push(cand); sr.tries = Math.max(sr.tries, 1); drawGame(); if (sr.fill.length === sr.letters.length) spellCheck(); }
        return true;
      }
    }
    return false;
  }
  function spellCheck() {
    var g = G, sr = g.rounds[g.i], chars = sr.w.en.split('');
    var ok = sr.fill.every(function (t, k) { return chars[t].toLowerCase() === chars[sr.letters[k]].toLowerCase(); });
    if (ok) { sr.state = 'ok'; sr.lock = true; if (sr.tries === 0) g.score++; sfx.ok(); burst(true); gameHit(true); speak(sr.w.en); drawGame(); setTimeout(nextSpell, 1100); }
    else {
      sr.tries++; sr.state = 'bad'; sfx.bad(); burst(false, sr.tries >= 2 ? 'Đáp án: ' + sr.w.en : 'Thử lại nhé!'); gameHit(false);
      if (sr.tries >= 2) { sr.fill = sr.letters.slice(); sr.lock = true; sr.state = ''; drawGame(); toast('Đáp án: ' + sr.w.en); speak(sr.w.en); setTimeout(nextSpell, 1900); }
      else { drawGame(); setTimeout(function () { if (G !== g) return; sr.fill = []; sr.state = ''; drawGame(); }, 700); }
    }
  }
  function nextSpell() { var g = G; if (!g || g.kind !== 'spell' || g.done) return; if (g.i + 1 < g.rounds.length) { g.i++; drawGame(); } else { var f = g.score / g.rounds.length; finishGame(f >= 0.9 ? 3 : f >= 0.6 ? 2 : 1, g.score, 'Ghép đúng ' + g.score + ' / ' + g.rounds.length + ' từ!'); } }

  /* ================= Ngữ pháp tổng hợp ================= */
  var topicPool = LN.topicPool = function (tid) { var n = 0; Object.keys(EX).forEach(function (k) { var e = EX[k].ex; if (e.topic === tid && e.reading == null) n += itemCount(e); }); return n; };
  var BLOCKS = function () { return (window.GRAMMAR_BLOCKS || []).concat([{ id: 'other', title: 'Chủ điểm thêm', sub: 'Do giáo viên bổ sung' }]); };
  LN.BLOCKS = BLOCKS;
  var gtableHtml = LN.gtableHtml = function (rows) {
    if (!rows || !rows.length) return '';
    return '<div class="tblw"><table class="gtbl"><tbody>' + rows.map(function (r) {
      if (r.length === 1 && /^##\s*/.test(r[0])) return '<tr class="gh"><td colspan="3">' + esc(r[0].replace(/^##\s*/, '')) + '</td></tr>';
      return '<tr>' + r.map(function (c, i) { return '<td' + (r.length < 3 && i === r.length - 1 ? ' colspan="' + (4 - r.length) + '"' : '') + '>' + esc(c) + '</td>'; }).join('') + '</tr>';
    }).join('') + '</tbody></table></div>';
  };
  /* Chuyển nội dung dạng cũ (giải thích / bảng / ví dụ) sang định dạng dòng */
  var oldToMark = LN.oldToMark = function (t) {
    var L = [];
    if (t.explain) L.push(t.explain, '');
    if (t.table && t.table.length) {
      L.push('# Công thức');
      var w = 0; t.table.forEach(function (r) { if (!(r.length === 1 && /^##/.test(r[0]))) w = Math.max(w, r.length); });
      L.push('| ' + ['Mẫu', 'Ví dụ', 'Ghi chú'].slice(0, Math.max(2, w)).join(' | ') + ' |');
      t.table.forEach(function (r) { if (r.length === 1 && /^##/.test(r[0])) L.push('', '## ' + r[0].replace(/^##\s*/, ''), '| ' + ['Mẫu', 'Ví dụ', 'Ghi chú'].slice(0, Math.max(2, w)).join(' | ') + ' |'); else L.push('| ' + r.join(' | ') + ' |'); });
      L.push('');
    }
    if (t.examples && t.examples.length) { L.push('# Ví dụ'); t.examples.forEach(function (x) { L.push('> ' + x); }); }
    return L.join('\n');
  };
  function inl(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); }
  function rowCls(c) { c = c.replace(/\*\*/g, '').trim(); return /^\(\+\)/.test(c) ? 'r-pos' : /^\((–|-|−)\)/.test(c) ? 'r-neg' : /^\(\?\)/.test(c) ? 'r-q' : /^Trả lời ngắn/i.test(c) ? 'r-sa' : /^Câu hỏi Wh/i.test(c) ? 'r-wh' : ''; }
  /* Trình hiển thị định dạng dòng: # mục · ## tiêu đề nhỏ · | bảng · - gạch đầu dòng · @ dấu hiệu · > ví dụ || dịch · ! lưu ý · !! lỗi hay gặp */
  var gmark = LN.gmark = function (src, opts) {
    opts = opts || {};
    var lines = String(src || '').replace(/\r/g, '').split('\n'), out = [], secs = [], open = false, i = 0, sn = 0;
    function closeSec() { if (open) { out.push('</section>'); open = false; } }
    while (i < lines.length) {
      var l = lines[i], t = l.trim();
      if (!t) { i++; continue; }
      if (/^#\s+/.test(t)) {
        closeSec(); sn++; var h = t.replace(/^#\s+/, ''); secs.push({ id: 'sec' + sn, h: h });
        out.push('<section class="gsec" id="sec' + sn + '"><h2 class="gsec-h">' + inl(h) + '</h2>'); open = true; i++; continue;
      }
      if (!open) { out.push('<section class="gsec gintro">'); open = true; }
      if (/^##\s+/.test(t)) { out.push('<h3 class="gsub">' + inl(t.replace(/^##\s+/, '')) + '</h3>'); i++; continue; }
      if (/^\|/.test(t)) {
        var rows = []; while (i < lines.length && /^\|/.test(lines[i].trim())) { var r = lines[i].trim().replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map(function (c) { return c.trim(); }); if (!r.every(function (c) { return /^:?-{2,}:?$/.test(c); })) rows.push(r); i++; }
        var hd = rows.shift() || [], cc = hd.map(function (c) { return rowCls(c).replace('r-', 'c-'); });
        out.push('<div class="tblw"><table class="ftbl' + (cc.some(Boolean) ? ' colmode' : '') + '"><thead><tr>' + hd.map(function (c, k) { return '<th' + (cc[k] ? ' class="' + cc[k] + '"' : '') + '>' + inl(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          rows.map(function (r) { var rc = rowCls(r[0] || ''); return '<tr' + (rc ? ' class="' + rc + '"' : '') + '>' + r.map(function (c, k) { return k === 0 && rc ? '<th scope="row">' + inl(c) + '</th>' : '<td' + (cc[k] ? ' class="' + cc[k] + '"' : '') + '>' + inl(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>');
        continue;
      }
      if (/^-\s+/.test(t)) { var li = []; while (i < lines.length && /^-\s+/.test(lines[i].trim())) { li.push('<li>' + inl(lines[i].trim().replace(/^-\s+/, '')) + '</li>'); i++; } out.push('<ul class="gul">' + li.join('') + '</ul>'); continue; }
      if (/^@\s*/.test(t)) { out.push('<div class="sig"><span class="sig-l">Dấu hiệu nhận biết</span>' + t.replace(/^@\s*/, '').split(',').map(function (c) { return c.trim(); }).filter(Boolean).map(function (c) { return '<span class="chip">' + inl(c) + '</span>'; }).join('') + '</div>'); i++; continue; }
      if (/^>\s*/.test(t)) {
        var exs = []; while (i < lines.length && /^>\s*/.test(lines[i].trim())) { var p = lines[i].trim().replace(/^>\s*/, '').split('||'), en = p[0].trim(), vi = (p[1] || '').trim(); exs.push('<div class="gex">' + (opts.noSay ? '' : sayBtn(en.replace(/\*\*/g, ''), 'sm')) + '<div><p class="en">' + inl(en) + '</p>' + (vi ? '<p class="vi">' + inl(vi) + '</p>' : '') + '</div></div>'); i++; }
        out.push('<div class="gexs">' + exs.join('') + '</div>'); continue;
      }
      if (/^!!\s*/.test(t)) { out.push('<div class="gwarn"><span class="bx">⚠ Lỗi hay gặp</span>' + inl(t.replace(/^!!\s*/, '')) + '</div>'); i++; continue; }
      if (/^!\s*/.test(t)) { out.push('<div class="gtip"><span class="bx">💡 Lưu ý</span>' + inl(t.replace(/^!\s*/, '')) + '</div>'); i++; continue; }
      out.push('<p class="gp">' + inl(t) + '</p>'); i++;
    }
    closeSec();
    return { html: out.join(''), secs: secs };
  };
  function topicBody(t) { return t.body != null ? t.body : oldToMark(t); }
  function topicDetail(t, opts) {
    opts = opts || {};
    var p = opts.p, units = UNITS.filter(function (u) { return u.topic === t.id || u.exercises.some(function (e) { return e.topic === t.id; }); });
    var pool = topicPool(t.id), imps = LN.importsFor(t.id);
    var mN = p ? openMistakes(p).filter(function (m) { return EX[m.exId].ex.topic === t.id; }).length : 0;
    var g = gmark(topicBody(t));
    var gps = LN.practiceFor(t.id);
    var prac = gps.length ? '<div class="gprac' + (opts.admin ? ' adm' : '') + '"><p class="gp-h">📝 Luyện tập theo từng phần <span>' + gps.length + ' bài · ' + gps.reduce(function (a, e) { return a + e.items.length; }, 0) + ' câu</span></p><div class="gp-list">' + gps.map(function (e, k) {
      var r = p && p.ex[e.id], st = r ? starsFor(r.best) : 0;
      return (opts.admin ? '<span' : '<a href="#/ex/' + e.id + '"') + ' class="gp-it' + (r ? ' done' : '') + '"><span class="gp-n">' + (k + 1) + '</span><span class="gp-t">' + esc(e.title) + '<small>' + e.items.length + ' câu' + (r ? ' · đúng ' + r.best + '%' : '') + '</small></span><span class="gp-s">' + (r ? stars(st) : '<b>Làm bài →</b>') + '</span>' + (opts.admin ? '</span>' : '</a>');
    }).join('') + '</div></div>' : '';
    var head = '<div class="ghead"><span class="gic">' + esc(t.icon || '📘') + '</span><div style="flex:1;min-width:0"><p class="gkick">' + esc(t.block === 'cd' ? 'Chuyên đề ' + (t.no || '') : (t.grade ? 'Lớp ' + t.grade + ' · ' : '') + (t.group || '')) + (t.en ? ' · ' + esc(t.en) : '') + '</p><h1 class="title">' + esc(t.title) + '</h1>' + (t.summary ? '<p class="gsum">' + inl(t.summary) + '</p>' : '') + '</div>' + (mN ? '<a class="tag tag-yel" href="#/play/topic-' + t.id + '">' + mN + ' câu sai cần ôn</a>' : '') + '</div>';
    var toc = g.secs.length > 2 ? '<nav class="gtoc" aria-label="Mục lục"><p class="gtoc-h">Mục lục</p>' + g.secs.map(function (x, k) { return '<a href="#" data-jump="' + x.id + '"><span>' + (k + 1) + '</span>' + inl(x.h) + '</a>'; }).join('') + '</nav>' : '';
    var extra = (units.length ? '<section class="gsec"><h2 class="gsec-h">Có trong bài học</h2><div style="display:flex;gap:8px;flex-wrap:wrap">' + units.map(function (u) { return opts.admin ? '<span class="btn btn-sm" style="cursor:default">' + u.icon + ' Unit ' + u.n + '</span>' : '<a class="btn btn-sm" href="#/unit/' + u.n + '/pattern">' + u.icon + ' Unit ' + u.n + '</a>'; }).join('') + '</div></section>' : '') +
      prac + (imps.length ? '<section class="gsec"><h2 class="gsec-h">Bài tập của chủ điểm</h2><div class="stack" style="gap:10px">' + imps.map(function (e) {
        var r = p && p.ex[e.id];
        return '<div class="exc"><span class="ic" style="background:var(--lav-soft)">📝</span><div class="inf"><p class="t">' + esc(e.title) + '</p><p class="s">' + e.items.length + ' câu' + (r ? ' · đúng ' + r.best + '%' : '') + '</p></div>' + (opts.admin ? '' : '<a class="btn ' + (r ? '' : 'btn-pink') + '" href="#/ex/' + e.id + '">' + (r ? 'Làm lại' : 'Làm bài') + '</a>') + '</div>';
      }).join('') + '</div></section>' : '') +
      (pool && !opts.admin ? '<div class="hello" style="margin-top:4px;background:var(--pink-soft);border-color:var(--pink-mid)">' + chick(76) + '<div style="flex:1 1 240px"><p class="head" style="font-size:22px">Luyện 10 câu về phần này</p><p class="muted small">Lấy ngẫu nhiên từ ' + pool + ' câu, làm sai có giải thích.</p></div><a class="btn btn-lg btn-pink" href="#/play/topic-' + t.id + '">Luyện ngay</a></div>' : '');
    var jump = gps.length ? '<a class="gp-jump" href="#" data-jump="gprac">📝 ' + gps.length + ' bài luyện tập ↓</a>' : '';
    return { head: head.replace('</h1>', '</h1>' + jump), toc: toc, body: g.html, extra: extra.replace('<div class="gprac', '<div id="gprac" class="gprac'), secs: g.secs };
  }
  function bindToc() {
    [].slice.call(document.querySelectorAll('[data-jump]')).forEach(function (a) {
      a.addEventListener('click', function (ev) { ev.preventDefault(); var el = document.getElementById(a.getAttribute('data-jump')); if (el) { var y = el.getBoundingClientRect().top + window.scrollY - 86; window.scrollTo({ top: y, behavior: 'smooth' }); } });
    });
  }
  var spyObs = null;
  function scrollSpy() {
    if (spyObs) { spyObs.disconnect(); spyObs = null; }
    var links = [].slice.call(document.querySelectorAll('.gtoc a[data-jump]')); if (!links.length || !window.IntersectionObserver) return;
    var vis = {};
    function upd() {
      var best = null; links.forEach(function (a) { var id = a.getAttribute('data-jump'), el = document.getElementById(id); if (!el) return; var top = el.getBoundingClientRect().top; if (top < window.innerHeight * 0.35 && (!best || top > best.top)) best = { id: id, top: top }; });
      if (!best) { var f = links[0]; best = { id: f.getAttribute('data-jump') }; }
      links.forEach(function (a) { var on = a.getAttribute('data-jump') === best.id; if (on !== a.classList.contains('on')) { a.classList.toggle('on', on); if (on && a.scrollIntoView) { var box = a.closest('.gtoc-w'); if (box) { var r = a.getBoundingClientRect(), b = box.getBoundingClientRect(); if (r.top < b.top || r.bottom > b.bottom) box.scrollTop += r.top - b.top - 60; } } } });
    }
    window.removeEventListener('scroll', LN._spy); LN._spy = function () { if (!document.querySelector('.gtoc')) { window.removeEventListener('scroll', LN._spy); return; } cancelAnimationFrame(LN._spyRaf); LN._spyRaf = requestAnimationFrame(upd); };
    window.addEventListener('scroll', LN._spy, { passive: true }); upd();
  }
  LN.bindToc = function () { bindToc(); scrollSpy(); };
  var grammarBody = LN.grammarBody = function (tid, opts) {
    opts = opts || {};
    var list = grammar(), t = list.filter(function (x) { return x.id === tid; })[0] || list[0];
    var base = opts.base || '#/grammar/';
    var nav = '<nav class="glist" aria-label="Chủ điểm">' + BLOCKS().map(function (b) {
      var items = list.filter(function (x) { return (x.block || 'other') === b.id; }); if (!items.length) return '';
      return '<p class="grp">' + esc(b.title) + '</p>' + items.map(function (x) { return '<a href="' + base + x.id + '" class="' + (t && x.id === t.id ? 'on' : '') + '">' + esc(x.icon || '') + ' ' + (x.block === 'cd' ? x.no + '. ' : '') + esc(x.title) + '</a>'; }).join('');
    }).join('') + '</nav>';
    if (!t) return { nav: nav, main: '<div class="card empty">' + (hasArt('empty-generic') ? art('empty-generic', 260, 'empty-art') : chick(120)) + '<h2>Chưa có chủ điểm nào</h2></div>', t: null };
    var d = topicDetail(t, opts);
    return { nav: nav, main: '<div class="gdoc">' + d.head + d.toc + d.body + d.extra + '</div>', t: t };
  };
  function gcardHtml(x, mBy, showGrade) {
    var ex = topicPool(x.id), np = LN.practiceFor(x.id).length;
    return '<a class="gcard b-' + (x.block || 'other') + '" href="#/grammar/' + x.id + '"><span class="gic">' + esc(x.icon || '📘') + '</span><span class="gno">' + (x.block === 'cd' ? 'Chuyên đề ' + x.no : (showGrade && x.grade ? 'Lớp ' + x.grade + ' · ' : '') + esc(x.group || '')) + '</span><span class="gt">' + esc(x.title) + '</span>' + (x.summary ? '<span class="gen">' + esc(x.summary.length > 80 ? x.summary.slice(0, 78) + '…' : x.summary) + '</span>' : '') +
      '<span class="gft">' + (np ? '<span class="tag tag-mint">📝 ' + np + ' bài luyện</span>' : ex ? '<span class="tag tag-mint">' + ex + ' câu luyện</span>' : '<span class="tag tag-soft">Lý thuyết</span>') + (mBy[x.id] ? '<span class="tag tag-yel">' + mBy[x.id] + ' câu sai</span>' : '') + '</span></a>';
  }
  function viewGrammar(tid) {
    var list = grammar(), p = prog(), BL = BLOCKS().filter(function (b) { return list.some(function (x) { return (x.block || 'other') === b.id; }); });
    var isBlock = !tid || BL.some(function (b) { return b.id === tid; });
    if (isBlock) {
      var u = me(), cur = tid || (BL.some(function (b) { return b.id === 'l' + (u && u.grade); }) ? 'l' + u.grade : BL[0].id), blk = BL.filter(function (b) { return b.id === cur; })[0];
      var mBy = {}; openMistakes(p).forEach(function (m) { var tt = EX[m.exId].ex.topic; mBy[tt] = (mBy[tt] || 0) + 1; });
      var items = list.filter(function (x) { return (x.block || 'other') === cur; });
      render(header('grammar') + '<main class="wrap page"><section class="gbanner gb-gram"><div><h1 class="title">Ngữ pháp tổng hợp</h1><p>Lớp 1 → 12 và 20 chuyên đề · công thức gọn, ví dụ có đọc mẫu, bài luyện theo từng phần.</p></div>' +
        '<input class="inp" id="g-search" placeholder="🔍 Tìm trong tất cả các lớp… (vd: bị động)" aria-label="Tìm chủ điểm"></section>' +
        '<div class="glay"><nav class="gtabs" aria-label="Chọn lớp"><p class="gtabs-h">📚 Chọn lớp</p>' + BL.map(function (b) { var n = list.filter(function (x) { return (x.block || 'other') === b.id; }).length; return '<a href="#/grammar/' + b.id + '" class="gtab' + (b.id === cur ? ' on' : '') + (u && b.id === 'l' + u.grade ? ' mine' : '') + '">' + (b.id === 'cd' ? '🎓 ' : b.id === 'other' ? '➕ ' : '') + esc(b.title) + '<small>' + n + '</small></a>'; }).join('') + '</nav>' +
        '<div class="glay-main"><div id="g-res" hidden></div><section class="gblock-sec" id="g-blk"><div class="chead" style="margin:6px 0 12px"><h2 class="sub">' + esc(blk.title) + (u && blk.id === 'l' + u.grade ? ' <span class="tag tag-pink">Lớp của bé</span>' : '') + '</h2><span class="small muted">' + esc(blk.sub || '') + ' · ' + items.length + ' chủ điểm</span></div><div class="gcards">' + items.map(function (x) { return gcardHtml(x, mBy); }).join('') + '</div></section></div></div></main>' + footer());
      var si = document.getElementById('g-search');
      si.addEventListener('input', function () {
        var q = si.value.trim().toLowerCase(), res = document.getElementById('g-res'), blkEl = document.getElementById('g-blk');
        if (!q) { res.hidden = true; blkEl.hidden = false; return; }
        var hits = list.filter(function (x) { return (x.title + ' ' + (x.en || '') + ' ' + (x.summary || '') + ' ' + (x.group || '')).toLowerCase().indexOf(q) >= 0; });
        res.hidden = false; blkEl.hidden = true;
        res.innerHTML = '<p class="small muted" style="margin:8px 0 12px">Tìm thấy ' + hits.length + ' chủ điểm</p><div class="gcards">' + hits.slice(0, 60).map(function (x) { return gcardHtml(x, mBy, true); }).join('') + '</div>';
      });
      return;
    }
    var t = list.filter(function (x) { return x.id === tid; })[0];
    if (!t) { go('#/grammar'); return; }
    var same = list.filter(function (x) { return (x.block || 'other') === (t.block || 'other'); }), ix = same.indexOf(t), prev = same[ix - 1], next = same[ix + 1];
    var d = topicDetail(t, { p: p });
    render(header('grammar') + '<main class="wrap page"><a href="#/grammar/' + (t.block === 'cd' ? 'cd' : t.block || '') + '" class="backlink">← ' + (t.block === 'cd' ? '20 chuyên đề' : t.grade ? 'Ngữ pháp lớp ' + t.grade : 'Tất cả chủ điểm') + '</a><div class="gpage-l' + (d.toc ? '' : ' notoc') + '">' + (d.toc ? '<aside class="gtoc-w">' + d.toc + '</aside>' : '') +
      '<div class="gdoc">' + d.head + d.body + d.extra +
      '<div class="gnav2">' + (prev ? '<a class="btn" href="#/grammar/' + prev.id + '">← ' + esc(prev.title) + '</a>' : '<span></span>') + (next ? '<a class="btn" href="#/grammar/' + next.id + '">' + esc(next.title) + ' →</a>' : '') + '</div></div></div></main>' + footer());
    LN.bindToc();
  }

  /* ================= Ôn câu sai ================= */
  function viewMistakes() {
    var p = prog(), ms = openMistakes(p), by = {};
    ms.forEach(function (m) { var t = EX[m.exId].ex.topic; (by[t] = by[t] || []).push(m); });
    var keys = Object.keys(by).sort(function (a, b) { return by[b].length - by[a].length; });
    render(header('mistakes') + '<main class="wrap page"><div class="chead"><div><h1 class="title">Ôn câu sai</h1><p class="muted">Câu nào làm sai sẽ vào đây. Làm đúng khi ôn lại là được xoá.</p></div>' + (ms.length ? '<a class="btn btn-lg btn-pink" href="#/play/mistakes">💪 Ôn ' + Math.min(12, ms.length) + ' câu</a>' : '') + '</div>' +
      (ms.length ? '<div class="stack">' + keys.map(function (t) {
        return '<section class="card"><div class="chead"><h2>' + esc(topicName(t)) + ' <span class="muted" style="font-size:16px">· ' + by[t].length + ' câu</span></h2>' + (t !== 'vocab' && t !== 'reading' ? '<a href="#/grammar/' + t + '" style="font-weight:800">Xem lại lý thuyết</a>' : '') + '</div>' +
          by[t].slice(0, 6).map(function (m) { var it = itemFrom(m.exId, m.idx), r = EX[m.exId]; return '<div class="wl"><p style="font-weight:800">' + esc(it.type === 'order' ? it.w.split('/').join(' / ') : it.q) + '</p><p class="r">Đáp án: ' + esc(answerText(it)) + '</p>' + explainHtml(it, true) + '<p class="tiny muted">' + (r.unit ? 'Unit ' + r.unit.n : 'Bài nạp thêm') + ' · ' + esc(r.ex.title) + ' · sai ' + m.n + ' lần</p></div>'; }).join('') +
          (by[t].length > 6 ? '<p class="small muted" style="padding-top:8px">… và ' + (by[t].length - 6) + ' câu nữa</p>' : '') + '</section>';
      }).join('') + '</div>' : '<div class="card empty">' + (hasArt('empty-mistakes') ? art('empty-mistakes', 280, 'empty-art') : chick(140, 'wow')) + '<h2>Chưa có câu sai nào!</h2><p class="muted" style="margin-bottom:18px">Làm bài đi, câu nào sai sẽ hiện ở đây.</p><a class="btn btn-pink" href="#/home">Về trang chủ</a></div>') +
      '</main>' + footer());
  }

  /* ================= Điều hướng ================= */
  var go = LN.go = function (h) { if (location.hash === h) route(); else location.hash = h; };
  function parts0() { return (location.hash.replace(/^#\/?/, '').split('/')[0]) || ''; }
  function route() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    [].slice.call(document.querySelectorAll('.confetti,.burst,.cdown,.combo,.floater,.ptc')).forEach(function (x) { x.remove(); });
    if (parts0() !== 'game') { var gb = document.getElementById('gbg'); if (gb) gb.remove(); document.body.removeAttribute('data-gcat'); }
    var h = location.hash.replace(/^#/, '') || '/', parts = h.split('/').filter(Boolean), u = me();
    var needG = parts[0] === 'admin' ? Object.keys(LAZY).filter(function (g) { return LN.needLoad(g); }) : u && LN.needLoad(u.grade) ? [u.grade] : [];
    if (needG.length) {
      render('<main class="wrap page" style="text-align:center;padding-top:80px">' + chick(120, 'wow') + '<h2 class="sub" style="margin-top:16px">Chíp đang tải bài học…</h2><p class="muted">Lần đầu hơi lâu một chút, những lần sau sẽ nhanh hơn.</p></main>');
      Promise.all(needG.map(function (g) { return LN.loadGrade(g); })).then(route, function (e) {
        render('<main class="wrap page" style="text-align:center;padding-top:80px">' + chick(120, 'sad') + '<h2 class="sub" style="margin-top:16px">Chưa tải được bài học</h2><p class="muted">Kiểm tra mạng rồi bấm tải lại nhé. (' + esc(e.message) + ')</p><p><button class="btn btn-pink" onclick="location.reload()">Tải lại</button></p></main>');
      });
      return;
    }
    if (u && parts[0] !== 'admin') LN.useGrade(u.grade);
    if (parts[0] === 'admin') { G = null; S = null; LN.useGrade(4); LN.adminRoute(parts.slice(1)); return; }
    var open = parts.length === 0 || parts[0] === 'auth';
    if (!u && !open) { pendingRoute = '#' + h; viewAuth('login', 'Đăng nhập để vào học nhé. Chưa có tài khoản thì bấm Đăng ký.'); return; }
    if (parts[0] !== 'game') G = null;
    if (parts[0] !== 'ex' && parts[0] !== 'play') { stashPlay(); S = null; }
    switch (parts[0]) {
      case undefined: if (u) go('#/home'); else viewLanding(); break;
      case 'auth': pendingRoute = null; if (u) go('#/home'); else viewAuth(parts[1]); break;
      case 'home': viewHome(); break;
      case 'learn': viewLearn(); break;
      case 'unit': viewUnit(+parts[1], parts[2]); break;
      case 'ex': case 'play': viewPlay(parts[1]); break;
      case 'games': viewGames(parts[1]); break;
      case 'game': startGame(parts[1], parts[2]); break;
      case 'grammar': viewGrammar(parts[1]); break;
      case 'mistakes': viewMistakes(); break;
      case 'account': viewAccount(); break;
      case 'ai': if (LN.viewAI) LN.viewAI(); else go('#/home'); break;
      default: go(u ? '#/home' : '#/');
    }
  }
  LN.route = route;
  window.addEventListener('hashchange', route);

  /* ================= Sự kiện ================= */
  document.addEventListener('click', function (ev) {
    var ao = ev.target.closest('[data-ao]');
    if (ao) { var bx = ao.closest('.aud-q'); bx.querySelectorAll('.aud-o').forEach(function (b) { b.classList.remove('sel', 'right', 'wrong'); }); ao.classList.add('sel'); var lab = ao.textContent; if (/^[\x00-\x7F’]+$/.test(lab) && /[a-z]/i.test(lab)) speak(lab); return; }
    var ac = ev.target.closest('[data-audchk]');
    if (ac) { var cu = unitOf(+location.hash.split('/')[2]); if (cu) audCheck(cu, +ac.getAttribute('data-audchk')); return; }
    var t = ev.target.closest('[data-say],[data-act],[data-go],[data-pick],[data-build],[data-unbuild],[data-ml],[data-mr],[data-lpick],[data-mflip],[data-tile],[data-slot],[data-g]');
    if (!t || t.disabled) return;
    if (t.hasAttribute('data-say')) { speak(t.getAttribute('data-say')); return; }
    if (t.getAttribute('data-act') === 'pweye') { var pi = document.getElementById(t.getAttribute('data-for')); if (pi) { pi.type = pi.type === 'password' ? 'text' : 'password'; t.classList.toggle('on', pi.type === 'text'); pi.focus(); } return; }
    if (t.getAttribute('data-act') === 'music') { var ms = !settings().music; setSetting('music', ms); if (ms) { ac(); musicStart(); } else musicStop(); toast(ms ? '🎵 Đã bật nhạc nền' : 'Đã tắt nhạc nền'); var bm = document.querySelector('[data-act=music]'); if (bm) { bm.classList.toggle('on', ms); bm.innerHTML = cic(ms ? 'music' : 'musicoff', 24); bm.setAttribute('aria-pressed', ms); } return; }
    if (t.hasAttribute('data-go')) { go(t.getAttribute('data-go')); return; }
    if (G && gameClick(t)) return;
    var a = t.getAttribute('data-act');
    if (a === 'gagain' && G) { startGame(G.kind, G.n); return; }
    if (S) {
      if (t.hasAttribute('data-pick')) { S.sel = +t.getAttribute('data-pick'); var os = S.items && S.items[S.i] && optSay(S.items[S.i], S.sel); if (os) speak(os); drawPlay(); return; }
      if (t.hasAttribute('data-build')) { S.built.push(+t.getAttribute('data-build')); drawPlay(); return; }
      if (t.hasAttribute('data-unbuild')) { S.built.splice(+t.getAttribute('data-unbuild'), 1); drawPlay(); return; }
      if (t.hasAttribute('data-ml')) { var li = +t.getAttribute('data-ml'); if (S.pairs[li] != null) { delete S.pairs[li]; S.act = null; } else S.act = S.act === li ? null : li; drawPlay(); return; }
      if (t.hasAttribute('data-mr')) { var ri = +t.getAttribute('data-mr'); Object.keys(S.pairs).forEach(function (k) { if (S.pairs[k] === ri) delete S.pairs[k]; }); if (S.act != null) { S.pairs[S.act] = ri; S.act = null; } else toast('Bấm một câu bên trái trước nhé.'); drawPlay(); return; }
      if (a === 'check') { var inp = document.getElementById('ans'); if (inp) S.typed = inp.value; checkItem(); return; }
      if (a === 'next') { nextItem(); return; }
      if (a === 'checkmatch') { checkMatch(); return; }
      if (a === 'finishmatch') { finishSet(); drawPlay(); return; }
      if (a === 'retry') { viewPlay(S.id); return; }
      if (a === 'clearbuild') { S.built = []; drawPlay(); return; }
    }
    if (a === 'logout') { if (LN.cloud) { LN.cloud.flush(); LN.cloud.logout(); } store.del('ln_session'); S = null; G = null; go('#/'); toast('Đã thoát. Hẹn gặp lại!'); }
    else if (a === 'sound') { var sn = !settings().sound; setSetting('sound', sn); var bs = document.querySelector('[data-act=sound]'); if (bs) { bs.classList.toggle('on', sn); bs.innerHTML = cic(sn ? 'sound' : 'mute', 24); bs.setAttribute('aria-pressed', sn); } toast(sn ? 'Đã bật âm thanh đúng / sai' : 'Đã tắt âm thanh đúng / sai'); if (sn) sfx.ok(); }
    else if (a === 'chest') { var pc = prog(); pc.chest = pc.chest || {}; if (!pc.chest[dayKey()]) { pc.chest[dayKey()] = true; pc.stars += 10; saveProg(pc); sfx.win(); confetti(); burst(true, '+10 ⭐ Rương quà!'); setTimeout(route, 900); } }
    else if (a === 'setgrade') { var all = users(), me2 = store.get('ln_session'); all[me2].grade = 4; store.set('ln_users', all); route(); }
    else if (a && LN.adminClick) LN.adminClick(a, t, ev);
  });
  document.addEventListener('input', function (ev) { if (ev.target.id === 'ans' && S) S.typed = ev.target.value; });
  ['keyup', 'keydown'].forEach(function (evn) { document.addEventListener(evn, function (ev) { if (ev.target && ev.target.type === 'password' || (ev.target && ev.target.closest && ev.target.closest('.pwbox'))) { var w = document.querySelector('[data-caps="' + ev.target.id + '"]'); if (w && ev.getModifierState) w.hidden = !ev.getModifierState('CapsLock'); } }); });
  document.addEventListener('keydown', function (ev) {
    if (G && !G.done && IMPL()[G.kind] && IMPL()[G.kind].key) { IMPL()[G.kind].key(G, ev); return; }
    if (G && !G.done && G.kind === 'cards') {
      var tag = ev.target.tagName;
      if ((ev.key === ' ' || ev.key === 'Enter') && !(tag === 'BUTTON' || tag === 'A' || tag === 'INPUT')) { ev.preventDefault(); gameAct('gflip'); }
      else if ((ev.key === ' ' || ev.key === 'Enter') && ev.target.classList.contains('flip')) { ev.preventDefault(); gameAct('gflip'); }
      else if (ev.key === 'ArrowRight') gameAct('gknow');
      else if (ev.key === 'ArrowLeft') gameAct('gforget');
      return;
    }
    if (ev.key !== 'Enter' || !S || !/^#\/(ex|play)\//.test(location.hash)) return;
    if (ev.target.tagName === 'BUTTON' && ev.target.id !== 'nextbtn') return;
    ev.preventDefault();
    if (S.phase === 'ask' && !S.match) { var inp = document.getElementById('ans'); if (inp) S.typed = inp.value; checkItem(); }
    else if (S.phase === 'fb' && !S.match) nextItem();
  });

  LN.drawGame = function () { drawGame(); };
  LN.finishGame = function (st, earned, text) { finishGame(st, earned, text); };
  LN.curGame = function () { return G; };
  LN.sfx = sfx; LN.confetti = confetti; LN.matches = matches; LN.norm = norm; LN.gname = gname;
  LN.boot = function () { route(); };
})();
