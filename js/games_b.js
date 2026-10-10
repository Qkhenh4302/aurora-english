/* games_b.js — Trò chơi: "Đua xe siêu tốc" (kart) và "Câu cá vàng" (fishing).
 *
 * CÁCH GIẢI TỰ ĐỘNG (automated test recipe):
 *  kart:    lặp tới khi có .gres:
 *             if (!g.lock && g.phase === 'race') click [data-g="o:" + g.rounds[g.i].a]; chờ ~1300 ms.
 *           (g.rounds[g.i].a = chỉ số đáp án đúng trong g.rounds[g.i].o). Sau câu cuối có màn về đích ~4.5 s rồi mới hiện kết quả.
 *           Trả lời đúng hết → về nhất, g.score === g.total (12), 3 sao.
 *  fishing: lặp tới khi có .gres:
 *             if (!g.busy) { var f = g.fish.filter(function (f) { return f.target && !f.dead && !f.flee && !f.caught; })[0];
 *                            if (f) click [data-g="hit:" + f.id]; }
 *             chờ ~1700 ms (nếu chưa có cá đúng thì chờ 200 ms rồi thử lại). Cá đúng luôn được thả vào ngay đầu mỗi lượt.
 *           (g.target = từ cần tìm; mỗi con cá trong g.fish có f.target = true nếu mang từ đúng; cá mập có f.shark = true.)
 *           Câu đủ 10 con không mất mồi → g.score === g.total (10), 3 sao.
 */
(function () {
  'use strict';
  var LN = window.LN, esc = LN.esc, shuffle = LN.shuffle, pic = LN.picHtml, ic = LN.ic;
  var IMPL = LN.GAME_IMPL = LN.GAME_IMPL || {}, A = LN.art, AU = LN.artUrl;
  function img(n, cls, style) { return '<img class="art ' + cls + '" src="' + AU(n) + '" alt="" draggable="false"' + (style ? ' style="' + style + '"' : '') + '>'; }
  function alive(g) { return LN.curGame() === g && !g.done; }
  function stars(r) { return r >= 0.9 ? 3 : r >= 0.65 ? 2 : 1; }
  function others(g, w, n, key) { key = key || 'vi'; return shuffle(g.words.filter(function (x) { return x.en !== w.en && x[key] !== w[key]; })).slice(0, n); }
  function mcq(g, w, key) { var o = shuffle([w].concat(others(g, w, 3, key))); return { w: w, o: o, a: o.indexOf(w) }; }
  function yes(t) { LN.sfx.ok(); LN.burst(true, t); LN.gameHit(true); }
  function no(t) { LN.sfx.bad(); LN.burst(false, t); LN.gameHit(false); }
  function arg(t) { var v = t.getAttribute('data-g') || ''; var i = v.indexOf(':'); return i < 0 ? [v, null] : [v.slice(0, i), v.slice(i + 1)]; }
  function later(g, ms, fn) { setTimeout(function () { if (alive(g)) fn(); }, ms); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function $(id) { return document.getElementById(id); }
  function setBar(f) { var b = document.querySelector('.ptop .bar i'); if (b) b.style.width = Math.round(Math.max(0, Math.min(1, f)) * 100) + '%'; }
  /* danh sách n từ, lặp lại khi Unit có ít từ, tránh 2 từ giống nhau đứng liền nhau */
  function wordQueue(g, n) {
    var out = [];
    while (out.length < n) {
      var s = shuffle(g.words);
      if (out.length && s.length > 1 && s[0].en === out[out.length - 1].en) s.push(s.shift());
      out = out.concat(s);
    }
    return out.slice(0, n);
  }

  /* ======================================================================
     ĐUA XE SIÊU TỐC (kart)
     ====================================================================== */
  var KART_DEF = [
    { id: 'a1', name: 'Thỏ Hồng', head: 'bunny', kart: 'kart-bunny', face: 'bunny-head', c: '#9B5DE5', lane: 0, s: 0.8 },
    { id: 'me', name: 'Em 🐥', head: 'chick', kart: 'kart-chip', face: 'chip-head', c: '#FF4F6D', lane: 2, me: true }, /* xe của em ở làn gần nhất → luôn nhìn rõ */
    { id: 'a2', name: 'Gấu Nâu', head: 'bear', kart: 'kart-bear', face: 'bear-head', c: '#3A86FF', lane: 1, s: 0.58 }
  ];
  var RANKS = ['🥇 Nhất', '🥈 Nhì', '🥉 Ba'];
  IMPL.kart = {
    init: function (g) {
      g.total = 12;
      g.rounds = wordQueue(g, g.total).map(function (w, i) { var m = mcq(g, w); m.kind = (i % 4 === 2) ? 'ear' : 'en'; return m; });
      g.i = 0; g.ans = 0; g.lock = false; g.phase = 'race'; g.scroll = 0; g.rank = 1;
      g.boostUntil = 0; g.spinUntil = 0;
      g.karts = KART_DEF.map(function (d) { return { d: d, pos: 0, goal: d.me ? 0 : 1.5, v: 0, fin: 0 }; });
      g.me = g.karts[1];
    },
    qHtml: function (g) {
      var r = g.rounds[g.i], q;
      if (r.kind === 'ear') q = '<div class="kart-prompt ear"><button type="button" class="bigsay kart-say" data-say="' + esc(r.w.en) + '" aria-label="Nghe lại">' + ic('sound', 34, '#fff', 2.2) + '</button><span class="kart-pt">Nghe và chọn hình đúng!</span></div>';
      else q = '<div class="kart-prompt"><span class="kart-pp">' + pic(r.w.pic) + '</span><span class="kart-pt">' + esc(r.w.vi) + '</span><span class="kart-ph">→ chọn từ tiếng Anh</span></div>';
      var opts = r.o.map(function (x, k) {
        if (r.kind === 'ear') return '<button type="button" class="opt gopt go' + k + ' kart-opt kart-pic" data-g="o:' + k + '" aria-label="' + esc(x.vi) + '"><span class="kart-op">' + pic(x.pic) + '</span><span class="kart-ov">' + esc(x.vi) + '</span><span class="kart-oe">' + esc(x.en) + '</span></button>';
        return '<button type="button" class="opt gopt go' + k + ' kart-opt" data-g="o:' + k + '"><span class="k">' + ['▲', '◆', '●', '■'][k] + '</span><span>' + esc(x.en) + '</span></button>';
      }).join('');
      return q + '<div class="opts g2 kart-opts' + (r.kind === 'ear' ? ' kart-opts-pic' : '') + '">' + opts + '</div>';
    },
    hudHtml: function (g) { return '🏁 <b id="kpos">' + RANKS[g.rank - 1] + '</b> <span id="kq">Câu ' + Math.min(g.i + 1, g.total) + '/' + g.total + '</span>'; },
    view: function (g) {
      var cars = g.karts.map(function (k, j) {
        return '<div class="kart-car kl' + k.d.lane + (k.d.me ? ' me' : '') + '" id="kc' + j + '"><span class="kart-tag">' + esc(k.d.name) + '</span><span class="kart-place" id="kp' + j + '">' + (j + 1) + '</span><span class="kart-flame">' + A('kart-boost', 0, 'kart-fimg') + '</span><span class="kart-dust"></span><div class="kart-body" id="kb' + j + '">' + A(k.d.kart, 0, 'kart-img', k.d.name) + '</div></div>';
      }).join('');
      var dots = g.karts.map(function (k, j) { return '<span class="kart-dot' + (k.d.me ? ' me' : '') + '" id="kd' + j + '" style="background:' + k.d.c + '">' + A(k.d.face, 0, 'kart-dimg') + '</span>'; }).join('');
      var body = '<div class="gwrap kart-wrap">' +
        '<div class="kart-stage" id="kstage" role="img" aria-label="Đường đua">' +
        '<div class="kart-track" id="kroad" style="background-image:url(' + AU('kart-track-bg') + ')"></div>' +
        '<div class="kart-start" id="kstart"><b>START</b></div><div class="kart-finish" id="kfin">' + A('kart-finish-flag', 0, 'kart-flag') + '</div>' +
        cars + '<div class="kart-lines"></div><div class="kart-over" id="kover"></div></div>' +
        '<div class="kart-map" aria-hidden="true"><span class="kart-map-s">🚦</span><div class="kart-map-t">' + dots + '</div><span class="kart-map-f">' + A('kart-finish-flag', 0, 'kart-mapflag') + '</span></div>' +
        '<div class="kart-q" id="kartq">' + this.qHtml(g) + '</div>' +
        '<p class="ghelp">Trả lời đúng để xe 🐥 bật TURBO 🔥 — trả lời sai xe sẽ bị xoay vòng!</p></div>';
      return { body: body, frac: g.ans / g.total, right: '<span class="ghud" id="ghud">' + this.hudHtml(g) + '</span>' };
    },
    mounted: function (g) {
      var stage = $('kstage'); if (!stage) return;
      g.els = { stage: stage, road: $('kroad'), fin: $('kfin'), start: $('kstart'), cars: [], bodies: [], dots: [], places: [] };
      for (var j = 0; j < 3; j++) { g.els.cars.push($('kc' + j)); g.els.dots.push($('kd' + j)); g.els.places.push($('kp' + j)); }
      g.els.cw = g.els.cars[0].offsetWidth || 120;
      this.sayIfEar(g);
      var self = this, last = performance.now(), myLoop = g.loopId = (g.loopId || 0) + 1;
      var loop = function (now) {
        if (!alive(g) || g.loopId !== myLoop || !document.body.contains(stage)) return;
        var dt = Math.min(0.05, (now - last) / 1000); last = now;
        self.step(g, dt, now);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },
    sayIfEar: function (g) { var r = g.rounds[g.i]; if (r && r.kind === 'ear' && !r.said) { r.said = 1; later(g, 350, function () { LN.speak(r.w.en); }); } },
    step: function (g, dt, now) {
      var E = g.els, W = E.stage.clientWidth, ppu = Math.max(9, W / 38), me = g.me, boosting = now < g.boostUntil, spinning = now < g.spinUntil;
      g.karts.forEach(function (k) {
        if (g.phase === 'finish') {
          k.pos += k.v * dt;
          if (k.pos >= 100 && !k.fin) { k.fin = ++g.finCount; if (k.d.me) { LN.sfx.combo(); } }
          if (k.pos > 104) k.v = Math.max(0, k.v - 14 * dt);
          return;
        }
        if (k.d.me) {
          if (!spinning && k.pos < k.goal) k.pos = Math.min(k.goal, k.pos + (boosting ? 11 : 4) * dt);
        } else {
          if (k.pos < k.goal) k.pos = Math.min(k.goal, k.pos + 3.2 * dt);
          else if (k.pos < Math.min(94, k.goal + 2.5)) k.pos += 0.13 * dt; /* xe máy chạy chậm dần khi em đang suy nghĩ */
        }
      });
      var cam = g.phase === 'finish' ? Math.min(me.pos, 103) : me.pos, ax = W * 0.3;
      var spd = g.phase === 'finish' ? me.v * ppu : (boosting ? 380 : spinning ? 20 : 70);
      g.scroll += spd * dt;
      var tile = Math.max(1, E.stage.clientHeight * 1200 / 360); /* ảnh nền đường đua lặp lại theo chiều ngang */
      if (E.road) E.road.style.backgroundPosition = (-(g.scroll % tile)).toFixed(1) + 'px 0';
      var fx = ax + (100 - cam) * ppu; E.fin.style.transform = 'translateX(' + fx + 'px)'; E.fin.style.visibility = fx > -60 && fx < W + 60 ? 'visible' : 'hidden';
      var sx = ax + (0 - cam) * ppu; E.start.style.transform = 'translateX(' + sx + 'px)'; E.start.style.visibility = sx > -80 && sx < W + 60 ? 'visible' : 'hidden';
      var order = g.karts.slice().sort(function (a, b) { return (b.fin ? 1000 - b.fin : b.pos) - (a.fin ? 1000 - a.fin : a.pos); });
      g.karts.forEach(function (k, j) {
        var cw = E.cw, x = ax + (k.pos - cam) * ppu - cw / 2; x = Math.max(4, Math.min(W - cw - 4, x));
        var bob = Math.sin(now / 90 + j * 2) * (k.d.me && boosting ? 1.6 : 0.9);
        E.cars[j].style.transform = 'translate(' + x + 'px,' + bob + 'px)';
        var pl = order.indexOf(k) + 1; if (E.places[j] && E.places[j].textContent !== String(pl)) E.places[j].textContent = pl;
        if (E.dots[j]) E.dots[j].style.left = Math.min(100, k.pos) + '%';
        var fast = k.d.me ? boosting : (g.phase === 'finish' || k.pos < k.goal - 0.3);
        if (E.cars[j].classList.contains('boost') !== fast) E.cars[j].classList.toggle('boost', fast);
      });
      E.stage.classList.toggle('kart-fast', boosting || (g.phase === 'finish' && me.v > 0));
      var rank = order.indexOf(me) + 1;
      if (rank !== g.rank) { var up = rank < g.rank; g.rank = rank; var kp = $('kpos'); if (kp) { kp.textContent = RANKS[rank - 1]; kp.className = up ? 'kart-up' : 'kart-down'; } if (up && g.phase === 'race') LN.toast('Vượt lên! Hạng ' + rank + ' 🏎️💨'); }
      if (g.phase === 'finish' && !g.ended && g.karts.every(function (k) { return k.fin; })) { g.ended = true; this.podium(g); }
    },
    goals: function (g) {
      var T = g.total, n = g.ans, me = g.me;
      me.goal = 3 + 92 * g.score / T;
      g.karts.forEach(function (k) {
        if (k.d.me) return;
        /* bám đuổi: trộn giữa tốc độ riêng của xe máy và vị trí của em (± dao động để lúc vượt lúc bị vượt) */
        var base = 3 + 92 * k.d.s * n / T, lead = k.d.id === 'a1' ? 2.6 * Math.sin(n * 0.9 + 0.6) - 1.6 : 2.4 * Math.sin(n * 0.75 + 2) - 4.2;
        var tgt = base + (me.goal + lead - base) * 0.72;
        k.goal = Math.min(93, Math.max(k.goal, tgt + rnd(-0.6, 0.6)));
      });
    },
    answer: function (g, k) {
      if (g.lock || g.phase !== 'race') return;
      var r = g.rounds[g.i], ok = k === r.a, now = performance.now();
      g.lock = true; g.ans++;
      [].slice.call(document.querySelectorAll('#kartq .kart-opt')).forEach(function (b, j) { b.disabled = true; if (j === r.a) b.classList.add('right'); else if (j === k) b.classList.add('wrong'); });
      if (ok) {
        g.score++; g.boostUntil = now + 1400; LN.sfx.whoosh();
        yes(pick(['TURBO! 🔥', 'Vèo vèo! 💨', 'Tăng tốc! 🚀', 'Siêu nhanh! ⚡']));
        LN.speak(r.w.en);
      } else {
        g.spinUntil = now + 1000; g.boostUntil = 0;
        var b = $('kb1'); if (b) { b.classList.remove('kart-spin'); void b.offsetWidth; b.classList.add('kart-spin'); }
        no('Đáp án: ' + r.w.en);
        later(g, 500, function () { LN.speak(r.w.en); });
      }
      this.goals(g); setBar(g.ans / g.total);
      var self = this;
      later(g, ok ? 1150 : 2000, function () {
        if (g.i + 1 < g.total) { g.i++; g.lock = false; var q = $('kartq'); if (q) q.innerHTML = self.qHtml(g); var kq = $('kq'); if (kq) kq.textContent = 'Câu ' + (g.i + 1) + '/' + g.total; self.sayIfEar(g); }
        else self.finish(g);
      });
    },
    finish: function (g) {
      /* thứ hạng chung cuộc theo tỉ lệ trả lời đúng: ≥80% về nhất, ≥55% về nhì */
      var r = g.score / g.total, rank = r >= 0.8 ? 1 : r >= 0.55 ? 2 : 3, T = [1.7, 2.3, 2.9];
      var free = [1, 2, 3].filter(function (x) { return x !== rank; });
      g.finalRank = rank; g.phase = 'finish'; g.finCount = 0;
      var q = $('kartq'); if (q) q.innerHTML = '<div class="kart-prompt"><span class="kart-pt">🏁 Nước rút về đích!</span></div>';
      [g.karts[1], g.karts[0], g.karts[2]].forEach(function (k) {
        k.place = k.d.me ? rank : free.shift();
        k.v = Math.max(0.6, 100.4 - k.pos) / T[k.place - 1];
      });
      LN.sfx.whoosh();
    },
    podium: function (g) {
      var ov = $('kover'), list = g.karts.slice().sort(function (a, b) { return a.place - b.place; });
      if (ov) {
        ov.innerHTML = '<div class="kart-pod">' + A('kart-trophy-podium', 0, 'kart-pod-img') + list.map(function (k) {
          return '<div class="kart-pod-c p' + k.place + (k.d.me ? ' me' : '') + '"><span class="kart-pod-n">' + esc(k.d.name) + '</span>' + A(k.d.face, 0, 'kart-pod-a') + '</div>';
        }).join('') + '</div>';
        ov.classList.add('on');
      }
      var rank = g.finalRank, txt = (rank === 1 ? 'Về nhất! 🥇' : rank === 2 ? 'Về nhì! 🥈' : 'Về ba! 🥉') + ' Đúng ' + g.score + '/' + g.total + ' câu';
      if (rank === 1) LN.sfx.win(); else LN.sfx.pop();
      later(g, 1700, function () { LN.finishGame(4 - rank, g.score, txt); });
    },
    key: function (g, ev) { var k = ['1', '2', '3', '4'].indexOf(ev.key); if (k >= 0 && !g.lock) { ev.preventDefault(); this.answer(g, k); } },
    click: function (g, t) { var a = arg(t); if (a[0] === 'o') { this.answer(g, +a[1]); return true; } }
  };

  /* ======================================================================
     CÂU CÁ VÀNG (fishing)
     ====================================================================== */
  var FISH = ['fish-1', 'fish-2', 'fish-3', 'fish-4'];
  var WORM = '<svg viewBox="0 0 28 20" width="26" height="19" aria-hidden="true"><path d="M3 14c3-8 7-8 9-2s6 6 9-1 4-6 4-6" fill="none" stroke="#FF7FA8" stroke-width="5" stroke-linecap="round"/><circle cx="24.5" cy="5.5" r="1.2" fill="#3B2A3A"/></svg>';
  IMPL.fishing = {
    init: function (g) {
      g.total = 10; g.queue = wordQueue(g, g.total); g.i = 0; g.baits = 3; g.busy = false; g.fish = []; g.fid = 0; g.fishPts = 0;
      var idx = shuffle([2, 3, 4, 5, 6, 7, 8, 9]); g.gold = {}; idx.slice(0, 3).forEach(function (x) { g.gold[x] = 1; });
      g.dirs = shuffle([1, -1, 1, -1]); g.laneNext = [0, 0, 0, 0]; g.sharkNext = 0;
      this.setRound(g);
    },
    setRound: function (g) { g.target = g.queue[g.i]; g.distract = others(g, g.target, 4); if (!g.distract.length) g.distract = [g.target]; },
    signHtml: function (g) { var w = g.target; return '<span class="gp-pic">' + pic(w.pic) + '</span><span class="gp-t">' + esc(w.vi) + '</span>' + (g.gold[g.i] ? '<span class="fishing-gl">' + A('fish-gold', 0, 'fishing-glimg') + 'Cá vàng x2!</span>' : ''); },
    hudHtml: function (g) { var b = ''; for (var i = 0; i < 3; i++) b += '<span class="fishing-worm' + (i < g.baits ? '' : ' off') + '">' + WORM + '</span>'; return b + ' <b>🐟 ' + g.score + '/' + g.total + '</b>'; },
    view: function (g) {
      var weeds = '', bub = '', i, wx = [3, 17, 46, 71, 90];
      for (i = 0; i < wx.length; i++) weeds += img('seaweed', 'fishing-weed', 'left:' + (wx[i] + rnd(-2, 2)).toFixed(1) + '%;height:' + Math.round(rnd(80, 130)) + 'px;animation-delay:' + (-rnd(0, 3)).toFixed(2) + 's');
      for (i = 0; i < 10; i++) bub += img('bubbles', 'fishing-bub', 'left:' + rnd(2, 96).toFixed(1) + '%;width:' + Math.round(rnd(14, 30)) + 'px;animation-duration:' + rnd(5, 10).toFixed(1) + 's;animation-delay:' + (-rnd(0, 10)).toFixed(1) + 's');
      var body = '<div class="gwrap fishing-wrap"><div class="gprompt fishing-sign" id="fsign">' + this.signHtml(g) + '</div>' +
        '<div class="fishing-stage" id="fstage" role="application" aria-label="Biển câu cá" style="background-image:url(' + AU('sea-bg') + ')">' +
        img('cloud-1', 'fishing-cloud a') + img('cloud-2', 'fishing-cloud b') + bub + weeds +
        '<div class="fishing-boat" id="fboat">' + A('boat-chip', 0, 'fishing-boatimg') + '</div>' +
        '<div class="fishing-line" id="fline">' + A('hook', 0, 'fishing-hook') + '</div>' +
        '</div>' +
        '<p class="ghelp">🎣 Bấm vào chú cá mang từ tiếng Anh đúng với hình ở trên. Cẩn thận cá mập 🦈 nhé!</p></div>';
      return { body: body, frac: g.i / g.total, right: '<span class="ghud" id="ghud">' + this.hudHtml(g) + '</span>' };
    },
    hud: function (g) { var h = $('ghud'); if (h) h.innerHTML = this.hudHtml(g); },
    mounted: function (g) {
      var st = $('fstage'); if (!st) return;
      g.stage = st; g.W = st.clientWidth; g.H = st.clientHeight; g.boat = $('fboat'); g.line = $('fline');
      [].slice.call(st.querySelectorAll('.fishing-fish')).forEach(function (e) { e.remove(); }); g.fish = [];
      g.boatX = g.W / 2; this.placeBoat(g, false); this.measure(g);
      var self = this, last = performance.now(), myLoop = g.loopId = (g.loopId || 0) + 1;
      var loop = function (now) {
        if (!alive(g) || g.loopId !== myLoop || !document.body.contains(st)) return;
        var dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (g.W !== st.clientWidth || g.H !== st.clientHeight) { g.W = st.clientWidth; g.H = st.clientHeight; self.measure(g); }
        self.step(g, dt, now);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },
    placeBoat: function (g, anim) { if (!g.boat) return; var bw = g.boat.offsetWidth || 220, x = Math.max(4, Math.min(g.W - bw - 4, g.boatX - bw / 2)); g.boat.style.transition = anim ? 'transform .4s cubic-bezier(.3,.9,.4,1)' : 'none'; g.boat.style.transform = 'translateX(' + x + 'px)'; g.boatLeft = x; },
    /* mặt nước = mép nước của thuyền (sprite thuyền: đáy thuyền ở y≈200/230; đầu cần câu ở (266, 22)) */
    measure: function (g) { var b = g.boat; g.surf = b ? b.offsetTop + b.offsetHeight * 200 / 230 : 100; },
    laneY: function (g, l) { var top = (g.surf || 100) + 62, bot = g.H - 74; return top + l * (bot - top) / 3; },
    speed: function (g) { return (52 + g.i * 7) * Math.max(0.65, Math.min(1.2, g.W / 900)); },
    spawn: function (g, kind, lane, entry) {
      var f = { id: ++g.fid, lane: lane, dir: g.dirs[lane], ph: rnd(0, 6.3), enter: entry ? 3 : 1, t0: performance.now() }, el = document.createElement('button');
      el.type = 'button'; el.setAttribute('data-g', 'hit:' + f.id);
      if (kind === 'shark') { f.shark = true; el.className = 'fishing-fish fishing-shark' + (f.dir < 0 ? ' fl' : ''); el.setAttribute('aria-label', 'Cá mập'); el.innerHTML = '<span class="fishing-in">' + A('shark', 0, 'fishing-shk') + '</span>'; f.sp = this.speed(g) * 1.55; }
      else {
        f.w = kind === 'target' || kind === 'gold' ? g.target : pick(g.distract); f.target = f.w.en === g.target.en; f.gold = kind === 'gold';
        el.className = 'fishing-fish' + (f.gold ? ' gold' : '') + (f.dir < 0 ? ' fl' : '');
        el.setAttribute('aria-label', f.w.en);
        el.innerHTML = '<span class="fishing-in">' + A(f.gold ? 'fish-gold' : pick(FISH), 0, 'fishing-img') + '<b' + (f.w.en.length > 11 ? ' class="l"' : '') + '>' + esc(f.w.en) + '</b>' + (f.gold ? '<em>x2</em>' : '') + '</span>';
        f.sp = this.speed(g) * rnd(0.85, 1.15) * (f.gold ? 1.3 : 1);
      }
      f.el = el; g.stage.appendChild(el); f.wd = el.offsetWidth || 160; f.ht = el.offsetHeight || 60;
      var mates = g.fish.filter(function (o) { return !o.dead && o.lane === lane; }), x;
      if (f.dir > 0) { x = -f.wd - 10; mates.forEach(function (o) { x = Math.min(x, o.x - f.wd - 50); }); }
      else { x = g.W + 10; mates.forEach(function (o) { x = Math.max(x, o.x + o.wd + 50); }); }
      f.x = x; f.y = this.laneY(g, lane) - f.ht / 2;
      el.style.transform = 'translate(' + f.x + 'px,' + f.y + 'px)';
      g.fish.push(f); return f;
    },
    laneFree: function (g, lane) { var W = g.W, d = g.dirs[lane]; return g.fish.every(function (o) { return o.dead || o.lane !== lane || (d > 0 ? o.x > 60 : o.x + o.wd < W - 60); }); },
    step: function (g, dt, now) {
      var self = this, W = g.W, live = 0, nTarget = 0, haveTarget = false, haveShark = false;
      for (var k = 0; k < g.fish.length; k++) {
        var f = g.fish[k]; if (f.dead) continue;
        if (f.caught) {
          if (f.reel) { var p = Math.min(1, (now - f.reel.t0) / 520), e = p * p * (3 - 2 * p); f.y = f.reel.y0 + (g.lineTop + 34 - f.reel.y0) * e; f.x = f.reel.x0 + (g.tipX - f.wd / 2 - f.reel.x0) * e; if (g.line) g.line.style.height = Math.max(0, f.y - 22 - g.lineTop) + 'px'; }
        } else {
          f.enter = Math.max(1, f.enter - dt * 2.2);
          f.x += f.dir * f.sp * (f.flee ? 5 : f.enter) * dt;
          f.y = self.laneY(g, f.lane) - f.ht / 2 + Math.sin(now / 420 + f.ph) * 7;
          if ((f.dir > 0 && f.x > W + 40) || (f.dir < 0 && f.x + f.wd < -40)) { f.dead = true; f.el.remove(); continue; }
          live++; if (f.target && !f.flee) { haveTarget = true; nTarget++; } if (f.shark) haveShark = true;
        }
        f.el.style.transform = 'translate(' + f.x + 'px,' + f.y + 'px)';
      }
      if (g.fish.length > 40) g.fish = g.fish.filter(function (o) { return !o.dead; });
      if (g.busy || g.over) return;
      var lanes = [0, 1, 2, 3];
      if (!haveTarget) { /* luôn có ít nhất một con cá mang từ đúng */
        var bl = shuffle(lanes).sort(function (a, b) { return (self.laneFree(g, b) ? 1 : 0) - (self.laneFree(g, a) ? 1 : 0); })[0];
        self.spawn(g, g.gold[g.i] ? 'gold' : 'target', bl, true); g.laneNext[bl] = now + rnd(900, 1600); live++; nTarget++;
      }
      var maxLive = 4 + Math.min(2, Math.floor(g.i / 3));
      shuffle(lanes).forEach(function (l) {
        if (live >= maxLive || now < g.laneNext[l] || !self.laneFree(g, l)) return;
        var kind = 'other';
        if (!haveShark && g.i >= 2 && now > g.sharkNext && Math.random() < 0.35) { kind = 'shark'; haveShark = true; g.sharkNext = now + rnd(7000, 11000); }
        else if (nTarget < 2 && Math.random() < 0.12) { kind = 'target'; nTarget++; }
        self.spawn(g, kind, l, false); live++;
        g.laneNext[l] = now + rnd(700, 2200) / (1 + g.i * 0.06);
      });
    },
    hit: function (g, f) {
      var self = this;
      if (f.shark) {
        f.flee = true; f.el.classList.add('chomp'); g.baits--; self.hud(g);
        no('Cá mập đớp mất mồi! 🦈'); self.checkOver(g); return;
      }
      if (!f.target) {
        f.flee = true; f.el.classList.add('bad'); g.baits--; self.hud(g);
        no('“' + f.w.en + '” = ' + f.w.vi);
        g.fish.forEach(function (o) { if (o.target && !o.dead && !o.flee) { o.el.classList.add('hint'); setTimeout(function () { o.el.classList.remove('hint'); }, 1800); } });
        self.checkOver(g); return;
      }
      /* bắt đúng cá */
      g.busy = true; f.caught = true; f.el.classList.add('hooked'); g.score++;
      var before = g.sc; yes(f.gold ? 'Cá vàng! x2 ✨' : pick(['Dính câu! 🎣', 'Tuyệt vời! 🐟', 'Giỏi quá! ⭐']));
      if (f.gold) { g.sc += g.sc - before; var c = document.querySelector('#gpts b'); if (c) c.textContent = g.sc; LN.sfx.combo(); }
      g.fishPts += f.gold ? 2 : 1;
      LN.speak(f.w.en); self.hud(g); setBar(g.score / g.total);
      var bw = (g.boat && g.boat.offsetWidth) || 140, bh = (g.boat && g.boat.offsetHeight) || 115;
      g.boatX = f.x + f.wd / 2 - bw * (266 / 280 - 0.5); self.placeBoat(g, true); /* đưa đầu cần câu tới ngay trên con cá */
      g.tipX = g.boatLeft + bw * 266 / 280; /* toạ độ đầu cần câu */
      g.lineTop = g.boat ? g.boat.offsetTop + bh * 22 / 230 : 20;
      later(g, 380, function () {
        if (!g.line) return;
        g.line.style.left = g.tipX + 'px'; g.line.style.top = g.lineTop + 'px'; g.line.style.transition = 'none'; g.line.style.height = '0px'; g.line.classList.add('on');
        void g.line.offsetWidth; g.line.style.transition = 'height .3s ease-out'; g.line.style.height = Math.max(0, f.y - 22 - g.lineTop) + 'px';
        LN.sfx.whoosh();
      });
      later(g, 720, function () { if (g.line) g.line.style.transition = 'none'; f.reel = { t0: performance.now(), y0: f.y, x0: f.x }; });
      later(g, 1260, function () {
        f.el.classList.add('gone'); self.splash(g, g.tipX); LN.sfx.pop();
        if (g.boat) { g.boat.classList.remove('bob'); void g.boat.offsetWidth; g.boat.classList.add('bob'); }
      });
      later(g, 1600, function () {
        f.dead = true; f.el.remove(); if (g.line) { g.line.classList.remove('on'); g.line.style.height = '0px'; }
        self.next(g);
      });
    },
    splash: function (g, x) { var s = document.createElement('div'); s.className = 'fishing-splash'; s.style.left = x + 'px'; s.style.top = (g.surf || 92) + 'px'; s.innerHTML = '<i></i><i></i><i></i><i></i><i></i>'; g.stage.appendChild(s); setTimeout(function () { s.remove(); }, 900); },
    checkOver: function (g) {
      if (g.baits > 0) return;
      g.over = true; g.busy = true;
      later(g, 1000, function () { LN.finishGame(Math.min(2, stars(g.score / g.total)), g.score, 'Hết mồi rồi! Câu được ' + g.score + '/' + g.total + ' con cá 🐟'); });
    },
    next: function (g) {
      g.i++;
      if (g.i >= g.total) {
        var sg = $('fsign'); if (sg) sg.innerHTML = '<span class="gp-t">🎉 Đầy thuyền cá! 🎉</span>';
        var lost = 3 - g.baits;
        later(g, 700, function () { LN.finishGame(lost <= 1 ? 3 : 2, g.score, 'Câu được ' + g.total + '/' + g.total + ' con cá! 🐟 ' + g.fishPts + ' điểm cá' + (lost ? ' · mất ' + lost + ' mồi' : '')); });
        return;
      }
      this.setRound(g);
      var t = g.target;
      g.fish.forEach(function (o) {
        if (o.dead || o.shark || o.caught) return;
        var conflict = (o.w.vi === t.vi && o.w.en !== t.en) || (o.gold && o.w.en !== t.en);
        o.target = o.w.en === t.en;
        if (conflict) { o.flee = true; o.target = false; }
      });
      var s = $('fsign'); if (s) { s.innerHTML = this.signHtml(g); s.classList.remove('pop'); void s.offsetWidth; s.classList.add('pop'); }
      g.busy = false;
    },
    click: function (g, t) {
      var a = arg(t); if (a[0] !== 'hit') return false;
      if (g.busy || g.over) return true;
      var id = +a[1], f = g.fish.filter(function (o) { return o.id === id; })[0];
      if (!f || f.dead || f.flee || f.caught) return true;
      this.hit(g, f); return true;
    }
  };
})();
