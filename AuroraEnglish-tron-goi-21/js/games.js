/* Trò chơi từ vựng mở rộng — mỗi trò: init(g), view(g) → {body, frac, right}, click(g, el), mounted(g)?, key(g, ev)? */
(function () {
  'use strict';
  var LN = window.LN, esc = LN.esc, shuffle = LN.shuffle, pic = LN.picHtml, ic = LN.ic;
  var IMPL = LN.GAME_IMPL = {}, A = LN.art, AU = LN.artUrl;
  function alive(g) { return LN.curGame() === g && !g.done; }
  function stars(r) { return r >= 0.9 ? 3 : r >= 0.65 ? 2 : 1; }
  function done(g, ratio, text) { if (g.done) return; LN.finishGame(stars(ratio), g.score, text); }
  function others(g, w, n, key) { key = key || 'vi'; return shuffle(g.words.filter(function (x) { return x.en !== w.en && x[key] !== w[key]; })).slice(0, n); }
  function mcq(g, w, key) { var o = shuffle([w].concat(others(g, w, 3, key))); return { w: w, o: o, a: o.indexOf(w) }; }
  function hud(parts) { return '<span class="tag tag-yel" style="font-size:14px">' + parts.join(' · ') + '</span>'; }
  function yes(t) { LN.sfx.ok(); LN.burst(true, t); LN.gameHit(true); }
  function no(t) { LN.sfx.bad(); LN.burst(false, t); LN.gameHit(false); }
  var SHAPES = ['▲', '◆', '●', '■'];
  function hearts(n) { var h = ''; for (var i = 0; i < 3; i++) h += A(i < n ? 'hp-heart' : 'hp-heart-empty', 22, 'hp-ic', i < n ? '❤' : ''); return h; }
  function promptBox(w, opts) { opts = opts || {}; return '<div class="gprompt">' + (opts.noPic ? '' : '<span class="gp-pic">' + pic(w.pic) + '</span>') + '<span class="gp-t">' + esc(opts.text || w.vi) + '</span>' + (opts.say ? LN.sayBtn(w.en, 'sm') : '') + '</div>'; }
  function optBtns(o, pick, ans, label) {
    return '<div class="opts g2">' + o.map(function (x, k) {
      var c = pick == null ? '' : k === ans ? 'right' : k === pick ? 'wrong' : '';
      return '<button type="button" class="opt gopt go' + k + ' ' + c + '" data-g="o:' + k + '"' + (pick != null ? ' disabled' : '') + '><span class="k">' + SHAPES[k % 4] + '</span><span>' + esc(label(x)) + '</span></button>';
    }).join('') + '</div>';
  }
  function arg(t) { var v = t.getAttribute('data-g') || ''; var i = v.indexOf(':'); return i < 0 ? [v, null] : [v.slice(0, i), v.slice(i + 1)]; }
  function later(g, ms, fn) { setTimeout(function () { if (alive(g)) fn(); }, ms); }
  function singleWords(g, max) {
    var a = g.words.filter(function (x) { return /^[A-Za-z]{3,10}$/.test(x.en); });
    if (a.length < 4) a = a.concat(g.words.filter(function (x) { return !/^[A-Za-z]{3,10}$/.test(x.en) && x.en.replace(/[^A-Za-z]/g, '').length <= 10 && x.en.replace(/[^A-Za-z]/g, '').length >= 3; }));
    return shuffle(a).slice(0, max);
  }

  /* ---------- Nối từ ---------- */
  IMPL.match = {
    init: function (g) { g.list = shuffle(g.words).slice(0, 6); g.pool = shuffle(g.list.map(function (_, i) { return i; })); g.place = {}; g.sel = null; g.checked = false; g.total = g.list.length; },
    view: function (g) {
      var placed = Object.keys(g.place).map(function (k) { return g.place[k]; });
      var body = '<div class="gwrap"><p class="ginst">Bấm một từ tiếng Anh, rồi bấm vào nghĩa của nó.</p><div class="mslots">' + g.list.map(function (w, j) {
        var pw = g.place[j], c = g.checked ? (pw === j ? 'right' : 'wrong') : pw != null ? 'filled' : '';
        return '<button type="button" class="mslot ' + c + '" data-g="slot:' + j + '"' + (g.checked ? ' disabled' : '') + '><span class="ms-pic">' + pic(w.pic, 'xs') + '</span><span class="ms-vi">' + esc(w.vi) + '</span><span class="ms-box">' + (pw != null ? esc(g.list[pw].en) : '…') + '</span>' + (g.checked && pw !== j ? '<span class="fix">Đúng: ' + esc(w.en) + '</span>' : '') + '</button>';
      }).join('') + '</div><div class="wchips" style="justify-content:center;margin-top:18px">' + g.pool.filter(function (i) { return placed.indexOf(i) < 0; }).map(function (i) {
        return '<button type="button" class="wchip' + (g.sel === i ? ' in' : '') + '" data-g="chip:' + i + '">' + esc(g.list[i].en) + '</button>';
      }).join('') + '</div><div class="gctrl">' + (g.checked ? '<button class="btn btn-lg btn-pink" data-g="done">Xem kết quả</button>' : placed.length === g.list.length ? '<button class="btn btn-lg btn-mint" data-g="check">Kiểm tra</button>' : '') + '</div></div>';
      return { body: body, frac: placed.length / g.list.length, right: hud(['Đã nối ' + placed.length + '/' + g.list.length]) };
    },
    click: function (g, t) {
      var a = arg(t);
      if (a[0] === 'chip') { g.sel = +a[1]; LN.drawGame(); LN.speak(g.list[g.sel].en); return true; }
      if (a[0] === 'slot') {
        var j = +a[1];
        if (g.sel != null) { g.place[j] = g.sel; g.sel = null; LN.sfx.flip(); }
        else if (g.place[j] != null) delete g.place[j];
        LN.drawGame(); return true;
      }
      if (a[0] === 'check') { g.checked = true; g.score = g.list.filter(function (_, j) { return g.place[j] === j; }).length; g.score === g.list.length ? yes('Đúng hết!') : no('Đúng ' + g.score + '/' + g.list.length); LN.drawGame(); return true; }
      if (a[0] === 'done') { done(g, g.score / g.total, 'Nối đúng ' + g.score + '/' + g.total + ' cặp!'); return true; }
    }
  };

  /* ---------- Tìm từ đúng ---------- */
  IMPL.find = {
    init: function (g) { g.list = shuffle(g.words); g.grid = shuffle(g.words); g.i = 0; g.err = 0; g.found = {}; g.total = g.list.length; },
    view: function (g) {
      var w = g.list[g.i];
      return { body: '<div class="gwrap">' + promptBox(w) + '<div class="fgrid">' + g.grid.map(function (x, k) {
        return '<button type="button" class="fword' + (g.found[x.en] ? ' gone' : '') + (g.bad === k ? ' shake' : '') + '" data-g="w:' + k + '">' + esc(x.en) + '</button>';
      }).join('') + '</div></div>', frac: g.i / g.total, right: hud([(g.i + 1) + '/' + g.total, 'Sai ' + g.err]) };
    },
    click: function (g, t) {
      var a = arg(t); if (a[0] !== 'w') return false;
      var k = +a[1], x = g.grid[k], w = g.list[g.i];
      if (x.en === w.en) {
        g.found[x.en] = 1; g.i++; g.bad = null; yes(); LN.speak(x.en);
        if (g.i >= g.total) { g.score = Math.max(0, g.total - g.err); done(g, g.score / g.total, 'Tìm đủ ' + g.total + ' từ, sai ' + g.err + ' lần!'); return true; }
      } else { g.err++; g.bad = k; no(); }
      LN.drawGame(); return true;
    }
  };

  /* ---------- Trắc nghiệm có đồng hồ ---------- */
  function timerMounted(g, secs, onTimeout) {
    clearInterval(g.tmr); if (g.pick != null) return;
    var start = g.qStart || (g.qStart = Date.now());
    var lastTick = null;
    g.tmr = setInterval(function () {
      if (!alive(g) || g.pick != null) { clearInterval(g.tmr); return; }
      var left = secs - (Date.now() - start) / 1000, el = document.getElementById('tbar'), num = document.getElementById('tnum');
      if (el) { el.style.width = Math.max(0, left / secs * 100) + '%'; el.className = left / secs < 0.25 ? 'low' : left / secs < 0.5 ? 'mid' : ''; }
      if (num) num.textContent = Math.max(0, Math.ceil(left));
      var sec = Math.ceil(left); if (left <= 3.05 && left > 0 && sec !== lastTick) { lastTick = sec; LN.sfx.tick(); }
      if (left <= 0) { clearInterval(g.tmr); onTimeout(); }
    }, 100);
  }
  IMPL.quiz = {
    init: function (g) { g.rounds = shuffle(g.words).slice(0, 10).map(function (w) { return mcq(g, w); }); g.i = 0; g.pick = null; g.total = g.rounds.length; },
    view: function (g) {
      var r = g.rounds[g.i];
      return { body: '<div class="gwrap"><div class="tbar"><i id="tbar"></i><b id="tnum"></b></div><div class="qcard" style="text-align:center"><div style="font-size:64px;line-height:1">' + pic(r.w.pic) + '</div><p class="qtext" style="margin:10px 0 20px">' + esc(r.w.en) + ' ' + LN.sayBtn(r.w.en, 'sm') + '</p>' +
        optBtns(r.o, g.pick, r.a, function (x) { return x.vi; }) + '</div></div>', frac: g.i / g.total, right: hud(['⭐ ' + g.score, (g.i + 1) + '/' + g.total]) };
    },
    mounted: function (g) { timerMounted(g, 20, function () { IMPL.quiz.answer(g, -1); }); },
    answer: function (g, k) {
      var r = g.rounds[g.i]; g.pick = k; if (k === r.a) { g.score++; yes(); LN.speak(r.w.en); } else no(k < 0 ? 'Hết giờ!' : ''); LN.drawGame();
      later(g, k === r.a ? 1000 : 2000, function () { if (g.i + 1 < g.total) { g.i++; g.pick = null; g.qStart = null; LN.drawGame(); } else done(g, g.score / g.total, 'Đúng ' + g.score + '/' + g.total + ' câu!'); });
    },
    click: function (g, t) { var a = arg(t); if (a[0] === 'o' && g.pick == null) { IMPL.quiz.answer(g, +a[1]); return true; } }
  };

  /* ---------- Đấu trường ---------- */
  IMPL.gameshow = {
    init: function (g) {
      var kinds = ['en', 'vi', 'ear'];
      g.rounds = shuffle(g.words).slice(0, 12).map(function (w, i) { var m = mcq(g, w); m.kind = kinds[i % 3]; return m; });
      g.i = 0; g.pick = null; g.lives = 3; g.pts = 0; g.streak = 0; g.total = g.rounds.length;
    },
    view: function (g) {
      var r = g.rounds[g.i], q;
      if (r.kind === 'en') q = '<div style="font-size:56px;line-height:1">' + pic(r.w.pic) + '</div><p class="qtext" style="margin:10px 0 18px">"' + esc(r.w.en) + '" nghĩa là gì?</p>';
      else if (r.kind === 'vi') q = '<p class="qtext" style="margin:10px 0 18px">Từ nào nghĩa là "' + esc(r.w.vi) + '"?</p>';
      else q = '<button class="bigsay" data-say="' + esc(r.w.en) + '" style="width:96px;height:96px;margin-bottom:14px" aria-label="Nghe">' + ic('sound', 42, '#fff', 2.2) + '</button><p class="qtext" style="margin:0 0 18px">Nghe và chọn nghĩa đúng</p>';
      var host = g.pick == null ? 'chip-mic' : g.pick === r.a ? 'chip-celebrate' : 'chip-oops';
      return { body: '<div class="gwrap"><div class="gshow-stage" style="background-image:url(' + AU('stage-bg') + ')"><span class="gs-lives">' + hearts(g.lives) + '</span>' + A('buzzer', 0, 'gs-buzz gs-bl') +
        '<span class="gs-host">' + A(host, 0, 'gs-chip' + (g.pick != null ? ' gs-react' : '')) + A('podium', 0, 'gs-pod') + '</span>' + A('buzzer', 0, 'gs-buzz gs-br') +
        '<span class="gs-score"><span class="gs-pts">' + g.pts + ' điểm</span>' + (g.streak >= 2 ? '<span class="tag tag-pink">Chuỗi ' + g.streak + ' 🔥</span>' : '') + '</span></div><div class="tbar"><i id="tbar"></i><b id="tnum"></b></div><div class="qcard" style="text-align:center">' + q +
        optBtns(r.o, g.pick, r.a, function (x) { return r.kind === 'vi' ? x.en : x.vi; }) + '</div></div>', frac: g.i / g.total, right: hud([(g.i + 1) + '/' + g.total]) };
    },
    mounted: function (g) {
      var r = g.rounds[g.i]; if (r.kind === 'ear' && g.pick == null && !r.said) { r.said = 1; setTimeout(function () { if (alive(g)) LN.speak(r.w.en); }, 300); }
      timerMounted(g, 15, function () { IMPL.gameshow.answer(g, -1); });
    },
    answer: function (g, k) {
      var r = g.rounds[g.i], ok = k === r.a, left = Math.max(0, 15 - (Date.now() - g.qStart) / 1000);
      g.pick = k;
      if (ok) { g.score++; g.streak++; g.pts += Math.round((100 + left * 10) * (g.streak >= 3 ? 2 : 1)); yes(g.streak >= 3 ? 'x2 điểm! 🔥' : ''); } else { g.streak = 0; g.lives--; no(k < 0 ? 'Hết giờ!' : ''); }
      LN.drawGame();
      later(g, ok ? 1000 : 2000, function () {
        if (g.lives > 0 && g.i + 1 < g.total) { g.i++; g.pick = null; g.qStart = null; LN.drawGame(); }
        else done(g, g.score / g.total, g.pts + ' điểm · đúng ' + g.score + '/' + g.total);
      });
    },
    click: function (g, t) { var a = arg(t); if (a[0] === 'o' && g.pick == null) { IMPL.gameshow.answer(g, +a[1]); return true; } }
  };

  /* ---------- Bắn bóng bay & Trái cây bay (arcade) ---------- */
  function shooter(mode) {
    var FR = ['apple', 'orange', 'watermelon', 'banana', 'strawberry', 'grape'], COL = ['red', 'yellow', 'green', 'blue', 'purple'];
    return {
      init: function (g) { g.queue = shuffle(g.words).slice(0, Math.min(8, g.words.length)); g.i = 0; g.lives = 3; g.total = g.queue.length; g.objs = []; },
      view: function (g) {
        return { body: '<div class="gwrap" style="max-width:900px">' + '<div id="gprompt">' + promptBox(g.queue[g.i], { say: false }) + '</div>' +
          '<div class="stage st-' + mode + '" id="stage" role="application" aria-label="Khu vực chơi"' + (mode === 'balloon' ? ' style="background-image:url(' + AU('sky-bg') + ')"' : '') + '><div class="sdeco"></div></div><p class="ghelp">' + (mode === 'balloon' ? '🎯 Bấm vào quả bóng có từ tiếng Anh đúng với nghĩa ở trên' : '🍉 Bấm trúng trái cây có từ đúng trước khi nó rơi xuống') + '</p></div>',
          frac: g.i / g.total, right: '<span class="ghud" id="ghud">' + hearts(g.lives) + ' <b>⭐ ' + g.score + '</b></span>' };
      },
      mounted: function (g) {
        g.stage = document.getElementById('stage'); g.W = g.stage.clientWidth; g.H = g.stage.clientHeight;
        this.wave(g);
        var last = performance.now(), self = this, myLoop = g.loopId = (g.loopId || 0) + 1;
        var loop = function (now) {
          if (!alive(g) || g.loopId !== myLoop || !document.body.contains(g.stage)) return;
          var dt = Math.min(0.05, (now - last) / 1000), objs = g.objs; last = now;
          for (var k = 0; k < objs.length; k++) {
            var o = objs[k]; if (o.dead) continue;
            if (o.delay > 0) { o.delay -= dt; continue; }
            if (mode === 'balloon') {
              o.y -= o.sp * dt; o.x += Math.sin((now / 700) + k) * 0.25;
              if (o.y < -120) { if (o.target && ++o.passes >= 2) { self.miss(g); break; } if (o.target) LN.toast('Nhanh tay lên nào! ⏰'); o.y = g.H + 20 + Math.random() * 60; }
            } else {
              o.vy += g.grav * dt; o.x += o.vx * dt; o.y += o.vy * dt; o.rot += o.vr * dt;
              if (o.y > g.H + 30 && o.vy > 0) { if (o.target && ++o.passes >= 3) { self.miss(g); break; } self.launch(g, o, 0.25 + Math.random() * 0.5); }
            }
            o.el.style.transform = 'translate(' + o.x + 'px,' + o.y + 'px)' + (mode === 'fruit' ? ' rotate(' + o.rot + 'deg)' : '');
          }
          requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
      },
      launch: function (g, o, delay) {
        var h = g.H * (0.5 + Math.random() * 0.3);
        o.x = 20 + o.lane * (g.W - 150) / 3 + (Math.random() - 0.5) * 40; o.x = Math.max(10, Math.min(g.W - 150, o.x));
        o.y = g.H + 20; o.vy = -Math.sqrt(2 * g.grav * h); o.vx = (g.W / 2 - o.x - 65) * 0.12 + (Math.random() - 0.5) * 30; o.vr = (Math.random() - 0.5) * 60; o.rot = 0; o.delay = delay || 0;
      },
      wave: function (g) {
        if (!g.stage) return;
        [].slice.call(g.stage.querySelectorAll('.balloon,.fruitb')).forEach(function (e) { e.remove(); });
        g.objs = []; g.grav = 300 * Math.max(0.8, Math.min(1.3, g.H / 440));
        var w = g.queue[g.i], set = shuffle([w].concat(others(g, w, 3, 'en'))), lanes = shuffle([0, 1, 2, 3]), self = this;
        set.forEach(function (x, k) {
          var el = document.createElement('button'); el.type = 'button'; el.className = mode === 'balloon' ? 'balloon' : 'fruitb';
          el.setAttribute('data-g', 'hit:' + k); el.setAttribute('aria-label', x.en);
          if (mode === 'balloon') el.innerHTML = A('balloon-' + COL[(k + g.i) % COL.length], 0, 'bl-img') + A('balloon-pop', 0, 'bl-pop') + '<span' + (x.en.length > 9 ? ' class="l"' : '') + '>' + esc(x.en) + '</span>';
          else el.innerHTML = '<span class="fe">' + A('fruit-' + FR[Math.floor(Math.random() * FR.length)], 0, 'fr-img') + A('fruit-splash', 0, 'fr-splash') + '</span><span class="fw">' + esc(x.en) + '</span>';
          g.stage.appendChild(el);
          var o = { el: el, w: x, target: x === w, lane: lanes[k], passes: 0, x: 0, y: g.H + 30, rot: 0 };
          if (mode === 'balloon') { o.x = 12 + lanes[k] * (g.W - 140) / 3; o.y = g.H + 20 + k * 55; o.sp = 42 + g.i * 3 + Math.random() * 16; o.delay = 0; }
          else self.launch(g, o, 0.2 + k * 0.55);
          o.el.style.transform = 'translate(' + o.x + 'px,' + o.y + 'px)';
          g.objs.push(o);
        });
      },
      hud: function (g) { var h = document.getElementById('ghud'); if (h) h.innerHTML = hearts(g.lives) + ' <b>⭐ ' + g.score + '</b>'; var p = document.getElementById('gprompt'); if (p && g.queue[g.i]) p.innerHTML = promptBox(g.queue[g.i]); },
      next: function (g) { g.i++; if (g.i >= g.total) { done(g, g.score / g.total, 'Trúng ' + g.score + '/' + g.total + ' từ!'); return; } this.hud(g); this.wave(g); },
      miss: function (g) { g.lives--; no('Để lọt mất rồi!'); if (g.lives <= 0) { done(g, g.score / g.total, 'Trúng ' + g.score + '/' + g.total + ' từ'); return; } this.hud(g); this.wave(g); },
      click: function (g, t) {
        var a = arg(t); if (a[0] !== 'hit') return false;
        var o = g.objs[+a[1]]; if (!o || o.dead || o.delay > 0) return true;
        if (o.target) { o.dead = true; o.el.classList.add('pop'); g.objs.forEach(function (x) { x.dead = true; }); g.score++; LN.sfx.pop(); yes(); LN.speak(o.w.en); var self = this; this.hud(g); later(g, 600, function () { self.next(g); }); }
        else { o.dead = true; o.el.classList.add('pop', 'bad'); g.lives--; no('“' + o.w.en + '” = ' + o.w.vi); this.hud(g); if (g.lives <= 0) { done(g, g.score / g.total, 'Trúng ' + g.score + '/' + g.total + ' từ'); } }
        return true;
      }
    };
  }
  IMPL.balloon = shooter('balloon');
  IMPL.fruit = shooter('fruit');

  /* ---------- Máy bay (arcade) ---------- */
  IMPL.airplane = {
    init: function (g) { g.queue = shuffle(g.words).slice(0, Math.min(8, g.words.length)); g.i = 0; g.lives = 3; g.lane = 1; g.total = g.queue.length; g.speed = 95; },
    view: function (g) {
      return { body: '<div class="gwrap" style="max-width:920px"><div id="gprompt">' + promptBox(g.queue[g.i]) + '</div><div class="stage sky" id="stage" style="background-image:url(' + AU('sky-bg') + ')"><div class="sdeco"></div><div class="plane" id="plane">' + A('plane-chip', 0, 'plane-img', 'máy bay') + '</div>' +
        [0, 1, 2, 3].map(function (k) { return '<button type="button" class="lane" data-g="lane:' + k + '" style="top:' + k * 25 + '%" aria-label="Làn ' + (k + 1) + '"></button>'; }).join('') + '</div>' +
        '<div class="gctrl"><button class="ibtn big" data-g="up" aria-label="Lên">' + ic('up', 26) + '</button><button class="ibtn big" data-g="down" aria-label="Xuống">' + ic('down', 26) + '</button><span class="ghelp" style="margin:0">Phím ↑ ↓ hoặc bấm vào làn bay để lái máy bay vào đám mây có từ đúng</span></div></div>',
        frac: g.i / g.total, right: '<span class="ghud" id="ghud">' + hearts(g.lives) + ' <b>⭐ ' + g.score + '</b></span>' };
    },
    mounted: function (g) {
      g.stage = document.getElementById('stage'); g.plane = document.getElementById('plane'); g.W = g.stage.clientWidth; g.H = g.stage.clientHeight;
      this.place(g); this.wave(g);
      var last = performance.now(), self = this, myLoop = g.loopId = (g.loopId || 0) + 1;
      var loop = function (now) {
        if (!alive(g) || g.loopId !== myLoop || !document.body.contains(g.stage)) return;
        var dt = Math.min(0.05, (now - last) / 1000), gone = true, objs = g.objs; last = now;
        for (var k = 0; k < objs.length; k++) {
          var o = objs[k]; if (o.dead) continue; o.x -= g.speed * dt; o.el.style.transform = 'translate(' + o.x + 'px,0)';
          if (o.x < 120 && o.x > -20 && o.lane === g.lane) { o.dead = true; self.hit(g, o); if (g.objs !== objs) break; }
          if (o.x > -180) gone = false;
        }
        if (gone && !g.waiting && g.objs === objs) { g.waiting = true; self.miss(g); }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },
    place: function (g) { if (g.plane) g.plane.style.top = (g.lane * 25 + 12.5) + '%'; },
    wave: function (g) {
      g.waiting = false; g.objs = [];
      [].slice.call(g.stage.querySelectorAll('.cloud')).forEach(function (e) { e.remove(); });
      var w = g.queue[g.i], set = shuffle([w].concat(others(g, w, 3, 'en')));
      set.forEach(function (x, k) {
        var el = document.createElement('div'); el.className = 'cloud'; el.innerHTML = A(k % 2 ? 'cloud-2' : 'cloud-1', 0, 'cl-img') + '<span' + (x.en.length > 11 ? ' class="l"' : '') + '>' + esc(x.en) + '</span>'; el.style.top = (k * 25 + 12.5) + '%'; g.stage.appendChild(el);
        g.objs.push({ el: el, w: x, lane: k, x: g.W + 20 + Math.random() * 80, target: x === w });
      });
    },
    hud: function (g) { var h = document.getElementById('ghud'); if (h) h.innerHTML = hearts(g.lives) + ' <b>⭐ ' + g.score + '</b>'; var p = document.getElementById('gprompt'); if (p && g.queue[g.i]) p.innerHTML = promptBox(g.queue[g.i]); },
    hit: function (g, o) {
      o.el.classList.add(o.target ? 'ok' : 'bad');
      if (o.target) { g.score++; yes(); LN.speak(o.w.en); g.speed = Math.min(150, g.speed + 7); g.waiting = true; g.objs.forEach(function (x) { x.dead = true; }); var self = this; this.hud(g); later(g, 700, function () { self.next(g); }); }
      else { g.lives--; no('“' + o.w.en + '” = ' + o.w.vi); this.hud(g); if (g.lives <= 0) done(g, g.score / g.total, 'Bay trúng ' + g.score + '/' + g.total + ' từ'); }
    },
    next: function (g) { g.i++; if (g.i >= g.total) { done(g, g.score / g.total, 'Bay trúng ' + g.score + '/' + g.total + ' từ!'); return; } this.hud(g); this.wave(g); },
    miss: function (g) { g.lives--; no('Bay trượt mất rồi!'); this.hud(g); if (g.lives <= 0) { done(g, g.score / g.total, 'Bay trúng ' + g.score + '/' + g.total + ' từ'); return; } this.wave(g); },
    move: function (g, d) { g.lane = Math.max(0, Math.min(3, g.lane + d)); this.place(g); LN.sfx.flip(); },
    key: function (g, ev) { if (ev.key === 'ArrowUp') { ev.preventDefault(); this.move(g, -1); } else if (ev.key === 'ArrowDown') { ev.preventDefault(); this.move(g, 1); } },
    click: function (g, t) { var a = arg(t); if (a[0] === 'up') { this.move(g, -1); return true; } if (a[0] === 'down') { this.move(g, 1); return true; } if (a[0] === 'lane') { g.lane = +a[1]; this.place(g); return true; } }
  };

  /* ---------- Mê cung (arcade) ---------- */
  var MW = 11, MH = 9;
  function wall(x, y) { return x % 2 === 1 && y % 2 === 1; }
  var GSTART = [[0, 4], [10, 4], [5, 0], [5, 8]];
  IMPL.maze = {
    init: function (g) { g.queue = shuffle(g.words).slice(0, Math.min(6, g.words.length)); g.i = 0; g.lives = 3; g.total = g.queue.length; this.reset(g); },
    reset: function (g) { g.p = { x: 5, y: 4 }; var s0 = GSTART[Math.floor(Math.random() * 4)]; g.e = { x: s0[0], y: s0[1] }; g.grace = Date.now() + 2500; var w = g.queue[g.i]; if (w) g.zones = shuffle([w].concat(others(g, w, 3, 'en'))); },
    corners: [[0, 0], [10, 0], [0, 8], [10, 8]],
    view: function (g) {
      var cells = '';
      for (var y = 0; y < MH; y++) for (var x = 0; x < MW; x++) cells += '<div class="mz' + (wall(x, y) ? ' w' : '') + '"></div>';
      var zones = this.corners.map(function (c, k) { return '<div class="mzone z' + k + '" style="left:' + (c[0] * 100 / MW) + '%;top:' + (c[1] * 100 / MH) + '%">' + A('maze-goal', 0, 'mz-goal') + '<span>' + esc(g.zones[k].en) + '</span></div>'; }).join('');
      return { body: '<div class="gwrap" style="max-width:660px"><div id="gprompt">' + promptBox(g.queue[g.i]) + '</div><div class="maze" id="maze" style="--floor:url(' + AU('maze-floor-tile') + ');--wall:url(' + AU('maze-wall-tile') + ')">' + cells + zones + '<div class="mtok mrun" id="mp">' + A('maze-chip', 0, 'mt-img', 'gà con') + '</div><div class="mtok mghost" id="me">' + A('maze-ghost', 0, 'mt-img', 'bạn ma') + '</div></div>' +
        '<div class="dpad"><button class="ibtn big" data-g="mv:0,-1" aria-label="Lên">' + ic('up', 24) + '</button><div><button class="ibtn big" data-g="mv:-1,0" aria-label="Trái">' + ic('left', 24) + '</button><button class="ibtn big" data-g="mv:1,0" aria-label="Phải">' + ic('right', 24) + '</button></div><button class="ibtn big" data-g="mv:0,1" aria-label="Xuống">' + ic('down', 24) + '</button></div>' +
        '<p class="ghelp">Dùng phím mũi tên (hoặc nút) đưa gà con 🐥 tới góc có từ đúng. Né bạn ma 👻 nhé!</p></div>',
        frac: g.i / g.total, right: '<span class="ghud" id="ghud">' + hearts(g.lives) + ' <b>⭐ ' + g.score + '</b></span>' };
    },
    pos: function (id, c) { var el = document.getElementById(id); if (el) { el.style.left = (c.x * 100 / MW) + '%'; el.style.top = (c.y * 100 / MH) + '%'; } },
    mounted: function (g) {
      this.pos('mp', g.p); this.pos('me', g.e);
      clearInterval(g.tmr); var self = this, ms = Math.max(700, 1000 - g.i * 50);
      g.tmr = setInterval(function () {
        if (!alive(g) || !document.getElementById('maze')) { clearInterval(g.tmr); return; }
        if (Date.now() < g.grace) return;
        var best = null, bd = 1e9;
        shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]).forEach(function (d) {
          var nx = g.e.x + d[0], ny = g.e.y + d[1];
          if (nx < 0 || ny < 0 || nx >= MW || ny >= MH || wall(nx, ny)) return;
          var dd = Math.abs(nx - g.p.x) + Math.abs(ny - g.p.y); if (dd < bd) { bd = dd; best = [nx, ny]; }
        });
        if (best && Math.random() < 0.8) { g.e.x = best[0]; g.e.y = best[1]; self.pos('me', g.e); }
        self.check(g);
      }, ms);
    },
    check: function (g) {
      if (g.e.x === g.p.x && g.e.y === g.p.y) { g.lives--; no('Bạn ma bắt được rồi!'); if (g.lives <= 0) { clearInterval(g.tmr); done(g, g.score / g.total, 'Đúng ' + g.score + '/' + g.total + ' từ'); return; } g.p = { x: 5, y: 4 }; var s0 = GSTART[Math.floor(Math.random() * 4)]; g.e = { x: s0[0], y: s0[1] }; g.grace = Date.now() + 2000; this.pos('mp', g.p); this.pos('me', g.e); this.hud(g); return; }
      var k = -1; this.corners.forEach(function (c, i) { if (c[0] === g.p.x && c[1] === g.p.y) k = i; });
      if (k < 0) return;
      var ok = g.zones[k] === g.queue[g.i];
      if (ok) { g.score++; yes(); LN.speak(g.zones[k].en); g.i++; if (g.i >= g.total) { clearInterval(g.tmr); done(g, g.score / g.total, 'Về đích ' + g.score + '/' + g.total + ' từ!'); return; } }
      else { g.lives--; no('“' + g.zones[k].en + '” = ' + g.zones[k].vi); if (g.lives <= 0) { clearInterval(g.tmr); done(g, g.score / g.total, 'Đúng ' + g.score + '/' + g.total + ' từ'); return; } }
      this.reset(g); LN.drawGame();
    },
    hud: function (g) { var h = document.getElementById('ghud'); if (h) h.innerHTML = hearts(g.lives) + ' <b>⭐ ' + g.score + '</b>'; },
    move: function (g, dx, dy) { var nx = g.p.x + dx, ny = g.p.y + dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH || wall(nx, ny)) return; g.p = { x: nx, y: ny }; this.pos('mp', g.p); this.check(g); },
    key: function (g, ev) { var m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[ev.key]; if (m) { ev.preventDefault(); this.move(g, m[0], m[1]); } },
    click: function (g, t) { var a = arg(t); if (a[0] === 'mv') { var d = a[1].split(',').map(Number); this.move(g, d[0], d[1]); return true; } }
  };

  /* Từ cho ô chữ / tìm chữ: ưu tiên từ đơn; Unit toàn cụm từ thì lấy từ khoá trong cụm (gợi ý: cụm từ có chỗ trống) */
  var STOP = ['the', 'and', 'with', 'around', 'playing', 'going', 'doing', 'having', 'taking', 'putting', 'telling', 'making', 'some', 'your', 'from'];
  function gridWords(g, max) {
    var seen = {}, out = [];
    function add(o) { if (seen[o.wd] || o.wd.length < 3 || o.wd.length > 10) return; seen[o.wd] = 1; out.push(o); }
    shuffle(g.words).forEach(function (w) { if (/^[A-Za-z]{3,10}$/.test(w.en)) add({ w: w, wd: w.en.toUpperCase() }); });
    if (out.length < 5) shuffle(g.words).forEach(function (w) {
      if (/^[A-Za-z]{3,10}$/.test(w.en)) return;
      var parts = w.en.split(/[^A-Za-z]+/).filter(function (x) { return x.length >= 3 && x.length <= 10 && STOP.indexOf(x.toLowerCase()) < 0; });
      if (!parts.length) parts = w.en.split(/[^A-Za-z]+/).filter(function (x) { return x.length >= 3 && x.length <= 10; });
      parts.sort(function (a, b) { return b.length - a.length; });
      for (var i = 0; i < parts.length; i++) { if (!seen[parts[i].toUpperCase()]) { add({ w: w, wd: parts[i].toUpperCase(), hint: w.en.replace(parts[i], '____') }); break; } }
    });
    return out.slice(0, max);
  }
  function clueText(o) { return o.hint ? esc(o.w.vi) + ' <span class="muted">· ' + esc(o.hint) + '</span>' : esc(o.w.vi); }

  /* ---------- Ô chữ ---------- */
  function buildCrossword(words) {
    var cells = {}, placed = [];
    function get(x, y) { return cells[x + ',' + y]; }
    function canPlace(wd, x, y, dir) {
      var dx = dir === 'h' ? 1 : 0, dy = dir === 'h' ? 0 : 1, cross = 0;
      if (get(x - dx, y - dy) || get(x + dx * wd.length, y + dy * wd.length)) return -1;
      for (var i = 0; i < wd.length; i++) {
        var cx = x + dx * i, cy = y + dy * i, c = get(cx, cy);
        if (c) { if (c !== wd[i]) return -1; cross++; }
        else if (get(cx + dy, cy + dx) || get(cx - dy, cy - dx)) return -1;
      }
      return cross;
    }
    function put(w, wd, x, y, dir) { for (var i = 0; i < wd.length; i++) cells[(dir === 'h' ? x + i : x) + ',' + (dir === 'h' ? y : y + i)] = wd[i]; placed.push({ w: w, wd: wd, x: x, y: y, dir: dir }); }
    words.sort(function (a, b) { return b.wd.length - a.wd.length; }).forEach(function (o, idx) {
      if (!idx) { put(o.w, o.wd, 0, 0, 'h'); return; }
      var best = null;
      placed.forEach(function (p) {
        for (var i = 0; i < p.wd.length; i++) for (var j = 0; j < o.wd.length; j++) {
          if (p.wd[i] !== o.wd[j]) continue;
          var dir = p.dir === 'h' ? 'v' : 'h', px = p.dir === 'h' ? p.x + i : p.x, py = p.dir === 'h' ? p.y : p.y + i;
          var x = dir === 'h' ? px - j : px, y = dir === 'h' ? py : py - j, c = canPlace(o.wd, x, y, dir);
          if (c > 0 && (!best || c > best.c)) best = { x: x, y: y, dir: dir, c: c };
        }
      });
      if (best) put(o.w, o.wd, best.x, best.y, best.dir);
    });
    var minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9;
    Object.keys(cells).forEach(function (k) { var p = k.split(',').map(Number); minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]); maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]); });
    var grid = {}; Object.keys(cells).forEach(function (k) { var p = k.split(',').map(Number); grid[(p[0] - minX) + ',' + (p[1] - minY)] = cells[k]; });
    placed.forEach(function (p) { p.x -= minX; p.y -= minY; });
    placed.sort(function (a, b) { return a.y - b.y || a.x - b.x; });
    var nums = {}, n = 0; placed.forEach(function (p) { var k = p.x + ',' + p.y; if (!nums[k]) nums[k] = ++n; p.num = nums[k]; });
    return { grid: grid, words: placed, nums: nums, W: maxX - minX + 1, H: maxY - minY + 1 };
  }
  IMPL.crossword = {
    init: function (g) {
      var ws = gridWords(g, 8);
      g.cw = buildCrossword(ws); g.vals = {}; g.marks = null; g.total = g.cw.words.length;
    },
    view: function (g) {
      var cw = g.cw, html = '<div class="cw" style="grid-template-columns:repeat(' + cw.W + ', 40px)">';
      for (var y = 0; y < cw.H; y++) for (var x = 0; x < cw.W; x++) {
        var k = x + ',' + y;
        if (!cw.grid[k]) { html += '<div class="cwc empty"></div>'; continue; }
        var m = g.marks ? (g.marks[k] ? ' ok' : ' bad') : '';
        html += '<div class="cwc' + m + '">' + (cw.nums[k] ? '<i>' + cw.nums[k] + '</i>' : '') + '<input maxlength="1" data-cell="' + k + '" value="' + esc(g.vals[k] || '') + '" aria-label="Ô ' + k + '" autocomplete="off"></div>';
      }
      html += '</div>';
      function clues(dir) { return cw.words.filter(function (p) { return p.dir === dir; }).map(function (p) { return '<li><b>' + p.num + '.</b> ' + pic(p.w.pic, 'xs') + ' ' + clueText(p) + ' <span class="tiny muted">(' + p.wd.length + ' chữ)</span></li>'; }).join(''); }
      return { body: '<div class="row" style="align-items:flex-start;justify-content:center"><div class="card" style="overflow-x:auto">' + html + '</div><div class="card side"><h2>Ngang →</h2><ol class="clues">' + clues('h') + '</ol><h2 style="margin-top:14px">Dọc ↓</h2><ol class="clues">' + clues('v') + '</ol>' +
        '<div class="gctrl" style="justify-content:flex-start"><button class="btn btn-mint" data-g="check">Kiểm tra</button><button class="btn btn-sm" data-g="hint">💡 Gợi ý 1 chữ</button>' + (g.marks ? '<button class="btn btn-pink" data-g="done">Hoàn thành</button>' : '') + '</div></div></div>',
        frac: Object.keys(g.vals).length / Object.keys(g.cw.grid).length, right: hud([g.total + ' từ']) };
    },
    mounted: function (g) {
      var cw = g.cw, cell = function (x, y) { return document.querySelector('.cw input[data-cell="' + x + ',' + y + '"]'); };
      [].slice.call(document.querySelectorAll('.cw input')).forEach(function (inp) {
        var p = inp.getAttribute('data-cell').split(',').map(Number);
        inp.addEventListener('focus', function () { if (!g.dir) g.dir = cw.grid[(p[0] + 1) + ',' + p[1]] ? 'h' : 'v'; inp.select(); });
        inp.addEventListener('input', function () {
          inp.value = inp.value.toUpperCase().replace(/[^A-Z]/g, '').slice(-1); g.vals[inp.getAttribute('data-cell')] = inp.value;
          if (!inp.value) return;
          var h = cell(p[0] + 1, p[1]), v = cell(p[0], p[1] + 1), nx = g.dir === 'v' ? (v || h) : (h || v);
          if (nx) { g.dir = nx === h ? 'h' : 'v'; nx.focus(); }
        });
        inp.addEventListener('keydown', function (ev) {
          if (ev.key === 'Backspace' && !inp.value) { var b = g.dir === 'v' ? cell(p[0], p[1] - 1) || cell(p[0] - 1, p[1]) : cell(p[0] - 1, p[1]) || cell(p[0], p[1] - 1); if (b) b.focus(); }
          var m = { ArrowRight: [1, 0, 'h'], ArrowLeft: [-1, 0, 'h'], ArrowDown: [0, 1, 'v'], ArrowUp: [0, -1, 'v'] }[ev.key];
          if (m) { ev.preventDefault(); var c = cell(p[0] + m[0], p[1] + m[1]); if (c) { g.dir = m[2]; c.focus(); } }
        });
        inp.addEventListener('click', function () { g.dir = g.dir === 'h' && cell(p[0], p[1] + 1) ? 'v' : cell(p[0] + 1, p[1]) ? 'h' : 'v'; });
      });
    },
    click: function (g, t) {
      var a = arg(t), cw = g.cw;
      if (a[0] === 'check') {
        g.marks = {}; Object.keys(cw.grid).forEach(function (k) { g.marks[k] = (g.vals[k] || '') === cw.grid[k]; });
        g.score = cw.words.filter(function (p) { for (var i = 0; i < p.wd.length; i++) { var k = (p.dir === 'h' ? p.x + i : p.x) + ',' + (p.dir === 'h' ? p.y : p.y + i); if (!g.marks[k]) return false; } return true; }).length;
        if (g.score === g.total) { yes('Giải xong!'); done(g, 1, 'Giải xong ô chữ ' + g.total + ' từ!'); return true; }
        no('Đúng ' + g.score + '/' + g.total + ' từ'); LN.toast('Đúng ' + g.score + '/' + g.total + ' từ. Ô đỏ là chữ chưa đúng.'); LN.drawGame(); return true;
      }
      if (a[0] === 'hint') { var miss = Object.keys(cw.grid).filter(function (k) { return g.vals[k] !== cw.grid[k]; }); if (miss.length) { var k = miss[Math.floor(Math.random() * miss.length)]; g.vals[k] = cw.grid[k]; g.marks = null; LN.drawGame(); } return true; }
      if (a[0] === 'done') { done(g, g.score / g.total, 'Đúng ' + g.score + '/' + g.total + ' từ'); return true; }
    }
  };

  /* ---------- Tìm chữ ---------- */
  IMPL.wordsearch = {
    init: function (g) {
      var N = 10, grid = [], seen = {}, ws = gridWords(g, 8);
      for (var y = 0; y < N; y++) { grid.push([]); for (var x = 0; x < N; x++) grid[y].push(''); }
      var dirs = [[1, 0], [0, 1], [1, 1]], placed = [];
      ws.forEach(function (o) {
        for (var tries = 0; tries < 300; tries++) {
          var d = dirs[Math.floor(Math.random() * dirs.length)], x0 = Math.floor(Math.random() * N), y0 = Math.floor(Math.random() * N);
          var ex = x0 + d[0] * (o.wd.length - 1), ey = y0 + d[1] * (o.wd.length - 1); if (ex >= N || ey >= N) continue;
          var ok = true; for (var i = 0; i < o.wd.length; i++) { var c = grid[y0 + d[1] * i][x0 + d[0] * i]; if (c && c !== o.wd[i]) { ok = false; break; } }
          if (!ok) continue;
          var cells = []; for (i = 0; i < o.wd.length; i++) { grid[y0 + d[1] * i][x0 + d[0] * i] = o.wd[i]; cells.push((x0 + d[0] * i) + ',' + (y0 + d[1] * i)); }
          o.cells = cells; placed.push(o); break;
        }
      });
      var AB = 'ABCDEFGHIJKLMNOPRSTUVWY'; for (y = 0; y < N; y++) for (x = 0; x < N; x++) if (!grid[y][x]) grid[y][x] = AB[Math.floor(Math.random() * AB.length)];
      g.N = N; g.grid = grid; g.list = placed; g.found = {}; g.start = null; g.total = placed.length;
    },
    view: function (g) {
      var hit = {}; g.list.forEach(function (o) { if (g.found[o.wd]) o.cells.forEach(function (c) { hit[c] = 1; }); });
      var html = '<div class="ws" style="grid-template-columns:repeat(' + g.N + ', minmax(0, 1fr))">';
      for (var y = 0; y < g.N; y++) for (var x = 0; x < g.N; x++) { var k = x + ',' + y; html += '<button type="button" class="wsc' + (hit[k] ? ' f' : '') + (g.start === k ? ' s' : '') + '" data-g="c:' + k + '">' + g.grid[y][x] + '</button>'; }
      html += '</div>';
      return { body: '<div class="row" style="align-items:flex-start;justify-content:center"><div class="card" style="flex:0 1 480px">' + html + '<p class="small muted center" style="margin-top:10px">Bấm chữ đầu, rồi bấm chữ cuối của từ (ngang, dọc hoặc chéo).</p></div>' +
        '<div class="card side"><h2>Tìm các từ</h2>' + g.list.map(function (o) { return '<div class="wsw' + (g.found[o.wd] ? ' f' : '') + '">' + pic(o.w.pic, 'xs') + ' <b>' + esc(o.hint ? o.wd.toLowerCase() : o.w.en) + '</b> <span class="muted small">' + (o.hint ? esc(o.w.en) + ' · ' : '') + esc(o.w.vi) + '</span></div>'; }).join('') + '</div></div>',
        frac: Object.keys(g.found).length / g.total, right: hud(['Đã tìm ' + Object.keys(g.found).length + '/' + g.total]) };
    },
    click: function (g, t) {
      var a = arg(t); if (a[0] !== 'c') return false;
      if (!g.start) { g.start = a[1]; LN.drawGame(); return true; }
      var s = g.start.split(',').map(Number), e = a[1].split(',').map(Number), dx = Math.sign(e[0] - s[0]), dy = Math.sign(e[1] - s[1]);
      var len = Math.max(Math.abs(e[0] - s[0]), Math.abs(e[1] - s[1])) + 1, straight = (e[0] - s[0]) === 0 || (e[1] - s[1]) === 0 || Math.abs(e[0] - s[0]) === Math.abs(e[1] - s[1]);
      g.start = null;
      if (straight && len > 1) {
        var str = ''; for (var i = 0; i < len; i++) str += g.grid[s[1] + dy * i][s[0] + dx * i];
        var rev = str.split('').reverse().join('');
        var o = g.list.filter(function (x) { return !g.found[x.wd] && (x.wd === str || x.wd === rev); })[0];
        if (o) { g.found[o.wd] = 1; g.score++; yes(o.w.en); LN.speak(o.w.en); if (g.list.every(function (x) { return g.found[x.wd]; })) { done(g, 1, 'Tìm đủ ' + g.total + ' từ!'); return true; } }
        else no('Chưa phải từ cần tìm');
      } else no('Chọn theo hàng thẳng nhé');
      LN.drawGame(); return true;
    }
  };

  /* ---------- Xem và nhớ ---------- */
  IMPL.watch = {
    init: function (g) { g.round = 0; g.rounds = 2; g.total = 0; this.newRound(g); },
    newRound: function (g) {
      var n = Math.min(4, Math.floor(g.words.length / 2)), all = shuffle(g.words);
      g.shown = all.slice(0, n); g.opts = shuffle(all.slice(0, Math.min(all.length, n * 2 + 1))); g.sel = {}; g.phase = 'show'; g.left = 8; g.checked = false; g.total += n;
    },
    view: function (g) {
      var body;
      if (g.phase === 'show') body = '<div class="gwrap"><p class="ginst">Nhớ thật kỹ các hình này nhé! Còn <b id="wcd">' + g.left + '</b> giây</p><div class="ftiles">' + g.shown.map(function (w) { return '<div class="ftile on2"><span class="fp">' + pic(w.pic) + '</span><span class="fe">' + esc(w.en) + '</span></div>'; }).join('') + '</div></div>';
      else body = '<div class="gwrap"><p class="ginst">Vừa rồi có những từ nào? Bấm chọn tất cả.</p><div class="ftiles">' + g.opts.map(function (w, k) {
        var c = g.checked ? (g.shown.indexOf(w) >= 0 ? (g.sel[k] ? ' ok' : ' missed') : (g.sel[k] ? ' bad' : '')) : (g.sel[k] ? ' picked' : '');
        return '<button type="button" class="ftile' + c + '" data-g="p:' + k + '"' + (g.checked ? ' disabled' : '') + '><span class="fp">' + pic(w.pic) + '</span><span class="fe">' + esc(w.en) + '</span></button>';
      }).join('') + '</div><div class="gctrl">' + (g.checked ? '<button class="btn btn-lg btn-pink" data-g="next">' + (g.round + 1 < g.rounds ? 'Vòng tiếp' : 'Xem kết quả') + '</button>' : '<button class="btn btn-lg btn-mint" data-g="check">Kiểm tra</button>') + '</div></div>';
      return { body: body, frac: g.round / g.rounds, right: hud(['Vòng ' + (g.round + 1) + '/' + g.rounds, '⭐ ' + g.score]) };
    },
    mounted: function (g) {
      if (g.phase !== 'show') return; clearInterval(g.tmr);
      g.tmr = setInterval(function () { if (!alive(g)) { clearInterval(g.tmr); return; } g.left--; var el = document.getElementById('wcd'); if (el) el.textContent = g.left; if (g.left <= 0) { clearInterval(g.tmr); g.phase = 'pick'; LN.drawGame(); } }, 1000);
    },
    click: function (g, t) {
      var a = arg(t);
      if (a[0] === 'p') { var k = +a[1]; g.sel[k] = !g.sel[k]; LN.drawGame(); return true; }
      if (a[0] === 'check') { g.checked = true; var got = 0, bad = 0; g.opts.forEach(function (w, k) { if (g.sel[k]) { if (g.shown.indexOf(w) >= 0) got++; else bad++; } }); g.score += Math.max(0, got - bad); (got === g.shown.length && !bad) ? yes('Nhớ đúng hết!') : no('Nhớ được ' + got + '/' + g.shown.length); LN.drawGame(); return true; }
      if (a[0] === 'next') { g.round++; if (g.round >= g.rounds) { done(g, g.score / g.total, 'Nhớ đúng ' + g.score + '/' + g.total + ' từ!'); return true; } this.newRound(g); LN.drawGame(); return true; }
    }
  };

  /* ---------- Gõ đáp án ---------- */
  IMPL.type = {
    init: function (g) { g.rounds = shuffle(g.words).slice(0, 10); g.i = 0; g.res = null; g.hint = 0; g.total = g.rounds.length; },
    view: function (g) {
      var w = g.rounds[g.i];
      return { body: '<div class="gwrap" style="max-width:620px"><div class="qcard" style="text-align:center"><div style="font-size:80px;line-height:1">' + pic(w.pic, 'lg') + '</div><p class="qtext" style="margin:12px 0 6px">' + esc(w.vi) + '</p>' +
        '<p class="muted small" style="margin-bottom:14px">' + (g.hint ? 'Gợi ý: <b>' + esc(w.en.slice(0, g.hint)) + '…</b> (' + w.en.length + ' ký tự)' : w.en.replace(/[A-Za-z]/g, '_ ').trim()) + '</p>' +
        '<input class="inp big" id="tans" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Gõ từ tiếng Anh" style="text-align:center"' + (g.res ? ' disabled value="' + esc(g.res.given) + '"' : '') + '>' +
        (g.res ? '<div class="fb ' + (g.res.ok ? 'ok' : 'no') + '"><div style="flex:1"><p class="h">' + (g.res.ok ? 'Chính xác!' : 'Đáp án: ' + esc(w.en)) + '</p></div>' + LN.sayBtn(w.en, 'sm') + '</div>' : '') +
        '<div class="gctrl">' + (g.res ? '<button class="btn btn-lg btn-pink" data-g="next" id="tnext">' + (g.i + 1 < g.total ? 'Từ tiếp' : 'Xem kết quả') + '</button>' : '<button class="btn btn-sm" data-g="hint">💡 Gợi ý</button><button class="btn btn-lg btn-mint" data-g="check">Kiểm tra</button>') + '</div></div></div>',
        frac: g.i / g.total, right: hud(['⭐ ' + g.score, (g.i + 1) + '/' + g.total]) };
    },
    mounted: function (g) { var i = document.getElementById(g.res ? 'tnext' : 'tans'); if (i) i.focus(); },
    key: function (g, ev) { if (ev.key !== 'Enter') return; ev.preventDefault(); if (g.res) this.click(g, { getAttribute: function () { return 'next'; } }); else this.click(g, { getAttribute: function () { return 'check'; } }); },
    click: function (g, t) {
      var a = arg(t), w = g.rounds[g.i];
      if (a[0] === 'hint') { g.hint = Math.min(w.en.length - 1, g.hint + 1); var v = (document.getElementById('tans') || {}).value; LN.drawGame(); if (v) document.getElementById('tans').value = v; return true; }
      if (a[0] === 'check') { var given = (document.getElementById('tans') || {}).value || ''; if (!given.trim()) { LN.toast('Gõ từ tiếng Anh đã nhé.'); return true; } var ok = LN.norm(given) === LN.norm(w.en); g.res = { ok: ok, given: given }; if (ok) { g.score++; yes(); } else no(); LN.speak(w.en); LN.drawGame(); return true; }
      if (a[0] === 'next') { if (g.i + 1 < g.total) { g.i++; g.res = null; g.hint = 0; LN.drawGame(); } else done(g, g.score / g.total, 'Gõ đúng ' + g.score + '/' + g.total + ' từ!'); return true; }
    }
  };

  /* ---------- Đúng cặp hay không ---------- */
  IMPL.pair = {
    init: function (g) {
      g.rounds = shuffle(g.words.concat(g.words)).slice(0, 12).map(function (w) { var yes = Math.random() < 0.5, o = others(g, w, 1)[0]; return { w: w, vi: yes || !o ? w.vi : o.vi, yes: yes || !o }; });
      g.i = 0; g.pick = null; g.total = g.rounds.length;
    },
    view: function (g) {
      var r = g.rounds[g.i], c = g.pick == null ? '' : (g.pick === r.yes ? ' ok' : ' bad');
      return { body: '<div class="gwrap" style="max-width:640px"><div class="paircard' + c + '"><div style="font-size:64px;line-height:1">' + pic(r.w.pic) + '</div><p class="head" style="font-size:38px">' + esc(r.w.en) + '</p><p style="font-size:20px;color:var(--ink3)">có nghĩa là</p><p class="head" style="font-size:30px;color:var(--pink-dk)">' + esc(r.vi) + '</p>' +
        (g.pick != null && !r.yes ? '<p class="small" style="margin-top:6px">Nghĩa đúng: <b>' + esc(r.w.vi) + '</b></p>' : '') + '</div>' +
        '<div class="gctrl"><button class="btn btn-lg btn-mint" data-g="ans:1"' + (g.pick != null ? ' disabled' : '') + '>✓ Đúng cặp</button><button class="btn btn-lg btn-pink" data-g="ans:0"' + (g.pick != null ? ' disabled' : '') + '>✗ Không phải</button></div></div>',
        frac: g.i / g.total, right: hud(['⭐ ' + g.score, (g.i + 1) + '/' + g.total]) };
    },
    click: function (g, t) {
      var a = arg(t); if (a[0] !== 'ans' || g.pick != null) return false;
      var r = g.rounds[g.i]; g.pick = a[1] === '1'; if (g.pick === r.yes) { g.score++; yes(); } else no(); LN.speak(r.w.en); LN.drawGame();
      later(g, g.pick === r.yes ? 1000 : 2200, function () { if (g.i + 1 < g.total) { g.i++; g.pick = null; LN.drawGame(); } else done(g, g.score / g.total, 'Đúng ' + g.score + '/' + g.total + ' lần!'); });
      return true;
    }
  };

  /* ---------- Mở hộp quà ---------- */
  IMPL.openbox = {
    init: function (g) { g.boxes = shuffle(g.words).slice(0, Math.min(12, g.words.length)).map(function (w) { return mcq(g, w); }); g.state = {}; g.cur = null; g.pick = null; g.total = g.boxes.length; },
    view: function (g) {
      var body = '<div class="gwrap" style="max-width:820px">';
      if (g.cur != null) {
        var r = g.boxes[g.cur];
        body += '<div class="qcard" style="text-align:center"><p class="small muted ob-head">' + A('giftbox-open', 0, 'ob-open') + 'HỘP SỐ ' + (g.cur + 1) + '</p><div style="font-size:60px;line-height:1;margin:8px 0">' + pic(r.w.pic) + '</div><p class="qtext" style="margin-bottom:18px">"' + esc(r.w.en) + '" nghĩa là gì? ' + LN.sayBtn(r.w.en, 'sm') + '</p>' + optBtns(r.o, g.pick, r.a, function (x) { return x.vi; }) +
          (g.pick != null ? '<div class="gctrl"><button class="btn btn-lg btn-pink" data-g="close">Mở hộp khác</button></div>' : '') + '</div>';
      } else body += '<p class="ginst">Chọn một hộp quà để mở!</p><div class="boxes">' + g.boxes.map(function (_, k) {
        var s = g.state[k]; return '<button type="button" class="gbox' + (s ? ' ' + s : '') + '" data-g="box:' + k + '"' + (s ? ' disabled' : '') + ' aria-label="Hộp ' + (k + 1) + '"><span class="bn">' + (k + 1) + '</span>' + (s ? A('giftbox-open', 0, 'gb-img') + A(s === 'ok' ? 'fx-correct' : 'fx-wrong', 0, 'gb-res') : A('giftbox-' + (k % 3 + 1), 0, 'gb-img')) + '</button>';
      }).join('') + '</div>';
      var opened = Object.keys(g.state).length;
      return { body: body + '</div>', frac: opened / g.total, right: hud(['⭐ ' + g.score, 'Đã mở ' + opened + '/' + g.total]) };
    },
    click: function (g, t) {
      var a = arg(t);
      if (a[0] === 'box') { g.cur = +a[1]; g.pick = null; LN.sfx.flip(); LN.drawGame(); return true; }
      if (a[0] === 'o' && g.pick == null) { var r = g.boxes[g.cur]; g.pick = +a[1]; var ok = g.pick === r.a; g.state[g.cur] = ok ? 'ok' : 'bad'; if (ok) { g.score++; yes(); LN.speak(r.w.en); } else no(); LN.drawGame(); return true; }
      if (a[0] === 'close') { g.cur = null; if (Object.keys(g.state).length >= g.total) { done(g, g.score / g.total, 'Mở hết ' + g.total + ' hộp, đúng ' + g.score + '!'); return true; } LN.drawGame(); return true; }
    }
  };

  /* ---------- Vòng quay ---------- */
  var WCOL = ['#FFC2D4', '#FFE494', '#B6E9D4', '#BFE0FA', '#DCCFFF', '#FFD9BF'];
  IMPL.wheel = {
    init: function (g) { g.segs = shuffle(g.words).slice(0, Math.min(10, g.words.length)); g.rot = 0; g.spins = 0; g.cur = null; g.reveal = false; g.total = Math.min(8, g.segs.length); },
    view: function (g) {
      var n = g.segs.length, R = 150, paths = '';
      g.segs.forEach(function (w, k) {
        var a0 = (k / n) * 2 * Math.PI - Math.PI / 2, a1 = ((k + 1) / n) * 2 * Math.PI - Math.PI / 2, am = (a0 + a1) / 2;
        var x0 = R + R * Math.cos(a0), y0 = R + R * Math.sin(a0), x1 = R + R * Math.cos(a1), y1 = R + R * Math.sin(a1);
        paths += '<path d="M' + R + ' ' + R + ' L' + x0 + ' ' + y0 + ' A' + R + ' ' + R + ' 0 ' + (n === 1 ? 1 : 0) + ' 1 ' + x1 + ' ' + y1 + ' Z" fill="' + WCOL[k % WCOL.length] + '" stroke="#fff" stroke-width="3"/>' +
          '<text x="' + (R + R * 0.62 * Math.cos(am)) + '" y="' + (R + R * 0.62 * Math.sin(am)) + '" text-anchor="middle" dominant-baseline="middle" font-size="' + (n > 8 ? 13 : 15) + '" font-weight="800" fill="#3B2A3A" transform="rotate(' + (am * 180 / Math.PI + 90) + ' ' + (R + R * 0.62 * Math.cos(am)) + ' ' + (R + R * 0.62 * Math.sin(am)) + ')">' + esc(w.en.length > 12 ? w.en.slice(0, 11) + '…' : w.en) + '</text>';
      });
      var card = '';
      if (g.cur != null) {
        var w = g.segs[g.cur], q = g.q;
        card = '<div class="qcard" style="text-align:center"><div style="font-size:60px;line-height:1">' + pic(w.pic) + '</div><p class="head" style="font-size:34px;margin:8px 0">' + esc(w.en) + ' ' + LN.sayBtn(w.en, 'sm') + '</p><p class="muted" style="margin-bottom:12px">Từ này nghĩa là gì?</p>' +
          optBtns(q.o, g.pick, q.a, function (x) { return x.vi; }) + (g.pick != null ? '<div class="gctrl"><button class="btn btn-lg btn-pink" data-g="nextspin">' + (g.spins + 1 >= g.total ? 'Xem kết quả' : '🎡 Quay tiếp') + '</button></div>' : '') + '</div>';
      }
      return { body: '<div class="row" style="align-items:center;justify-content:center"><div class="wheelw"><div class="wpin">' + A('wheel-pointer', 0, 'wpin-img') + '</div><svg id="wheel" class="wheel" viewBox="0 0 300 300" style="transform:rotate(' + g.rot + 'deg)">' + paths + '<image href="' + AU('wheel-center') + '" x="116" y="116" width="68" height="68"/></svg>' +
        (g.cur == null && !g.spinning ? '<div class="gctrl"><button class="btn btn-lg btn-pink" data-g="spin">🎡 Quay!</button></div>' : '') + '</div>' + (card ? '<div style="flex:1 1 320px;max-width:420px">' + card + '</div>' : '') + '</div>',
        frac: g.spins / g.total, right: hud(['⭐ ' + g.score, 'Lượt ' + Math.min(g.spins + (g.cur != null ? 0 : 1), g.total) + '/' + g.total]) };
    },
    mounted: function (g) {
      if (g.target == null) return;
      var el = document.getElementById('wheel'), tgt = g.target; g.target = null;
      el.getBoundingClientRect(); el.style.transition = 'transform 3.4s cubic-bezier(.15,.85,.2,1)'; el.style.transform = 'rotate(' + tgt.rot + 'deg)';
      var tk = setInterval(function () { if (!alive(g)) { clearInterval(tk); return; } LN.sfx.tick(); }, 180); setTimeout(function () { clearInterval(tk); }, 2600);
      later(g, 3500, function () { g.rot = tgt.rot; g.spinning = false; g.cur = tgt.k; g.pick = null; g.q = mcq(g, g.segs[g.cur]); LN.sfx.whoosh(); LN.drawGame(); LN.speak(g.segs[g.cur].en); });
    },
    click: function (g, t) {
      var a = arg(t);
      if (a[0] === 'spin' && !g.spinning) {
        var n = g.segs.length, k = Math.floor(Math.random() * n), center = (k + 0.5) * 360 / n;
        var base = g.rot - (g.rot % 360), rot = base + 360 * 4 + (360 - center) + (Math.random() - 0.5) * (300 / n);
        g.spinning = true; g.target = { k: k, rot: rot }; LN.drawGame(); return true;
      }
      if (a[0] === 'o' && g.cur != null && g.pick == null) { g.pick = +a[1]; if (g.pick === g.q.a) { g.score++; yes(); } else no('Nghĩa đúng: ' + g.segs[g.cur].vi); LN.drawGame(); return true; }
      if (a[0] === 'nextspin' && g.pick != null) {
        g.segs.splice(g.cur, 1); g.cur = null; g.pick = null; g.spins++; g.rot = g.rot % 360;
        if (g.spins >= g.total || !g.segs.length) { done(g, g.score / g.total, 'Đúng ' + g.score + '/' + g.total + ' từ!'); return true; }
        LN.drawGame(); return true;
      }
    }
  };

  /* ---------- Thẻ nói: chấm phát âm theo %, ghi âm để nghe lại, có hướng dẫn ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function lev(a, b) { var m = a.length, n = b.length, d = [], i, j; for (i = 0; i <= m; i++) { d[i] = [i]; } for (j = 1; j <= n; j++) d[0][j] = j; for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
  function simPct(said, target) {
    var t = LN.norm(target).replace(/[^a-z ]/g, ''), s = LN.norm(said).replace(/[^a-z ]/g, '');
    if (!s) return 0; if ((' ' + s + ' ').indexOf(' ' + t + ' ') >= 0) return 100;
    var tt = t.replace(/ /g, ''), best = 0, words = s.split(' '), L = t.split(' ').length;
    for (var i = 0; i < words.length; i++) { var chunk = words.slice(i, i + L).join(''); best = Math.max(best, 1 - lev(chunk, tt) / Math.max(chunk.length, tt.length)); }
    best = Math.max(best, 1 - lev(s.replace(/ /g, ''), tt) / Math.max(s.replace(/ /g, '').length, tt.length));
    return Math.max(0, Math.round(best * 100));
  }
  var SPK_ERR = { 'not-allowed': 'Trình duyệt chưa cho dùng micro. Bấm biểu tượng 🔒 / 🎤 trên thanh địa chỉ → Cho phép micro, rồi thử lại.', 'service-not-allowed': 'Trình duyệt chưa cho dùng dịch vụ nhận giọng nói. Hãy mở bằng Chrome hoặc Edge.', network: 'Chấm tự động cần kết nối Internet (Chrome/Edge gửi giọng nói lên máy chủ để nhận dạng).', 'no-speech': 'Máy chưa nghe thấy tiếng. Em nói to và gần micro hơn nhé.', 'audio-capture': 'Không tìm thấy micro. Hãy cắm tai nghe có micro hoặc dùng máy có micro.', nosr: 'Trình duyệt này không chấm tự động được (hãy dùng Chrome hoặc Edge). Em nghe lại giọng mình rồi tự chấm nhé.' };
  IMPL.speak = {
    init: function (g) { g.deck = shuffle(g.words).slice(0, Math.min(8, g.words.length)); g.i = 0; g.sst = 'ready'; g.best = []; g.total = g.deck.length; g.guide = g.n === 1 || !LN.store.get('ln_spk_guide', false); },
    view: function (g) {
      var w = g.deck[g.i], b = g.best[g.i];
      var guide = '<details class="spk-guide"' + (g.guide ? ' open' : '') + '><summary>📖 Hướng dẫn luyện nói</summary><ol><li><b>Bấm 🔊 Nghe mẫu</b> (hoặc 🐢 nghe chậm) và nghe thật kỹ.</li><li><b>Bấm 🎤 Bấm để nói</b> rồi nói to, rõ từng âm khi nút chuyển sang màu đỏ. Máy tự dừng sau khoảng 4 giây.</li><li>Xem <b>điểm phát âm (%)</b>, bấm <b>▶ Nghe lại giọng em</b> để so với giọng mẫu. Chưa tốt thì bấm 🔁 Nói lại.</li></ol><p class="spk-tips">💡 Mẹo: ngồi gần micro, chỗ yên tĩnh · nói rõ <b>âm cuối</b> (s, t, d, k) · tập chậm trước rồi nhanh dần · từ 80% trở lên là đạt.</p></details>';
      var card = '<div class="spk-card"><p class="spk-k">THẺ ' + (g.i + 1) + '/' + g.total + '</p><div class="spk-pic">' + pic(w.pic, 'lg') + '</div><p class="spk-vi">' + esc(w.vi) + '</p><p class="spk-en">' + esc(w.en) + '</p>' +
        '<div class="spk-ctl"><button class="btn" data-g="hear">🔊 Nghe mẫu</button><button class="btn" data-g="slow">🐢 Nghe chậm</button></div>';
      var act;
      if (g.sst === 'aiwait') act = '<div class="ai-wait">' + LN.art('chip-think', 70, 'bob', '') + '<p class="spk-s">Chíp AI đang nghe và chấm giọng em…</p></div>';
      else if (g.sst === 'listening') act = '<button class="spk-mic on" data-g="stop" aria-label="Dừng"><span>🎤</span></button><p class="spk-s">Đang nghe… em nói đi! <small>(bấm để dừng)</small></p>';
      else if (g.sst === 'result') {
        var r = g.res, col = r.pct >= 80 ? '#1EB980' : r.pct >= 50 ? '#FFB703' : '#FF4F6D', C = 2 * Math.PI * 44;
        act = '<div class="spk-res"><div class="spk-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="#F1E8EE" stroke-width="10"/><circle cx="50" cy="50" r="44" fill="none" stroke="' + col + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (C * r.pct / 100) + ' ' + C + '" transform="rotate(-90 50 50)"/></svg><b style="color:' + col + '">' + (r.self ? r.selfTxt : r.pct + '%') + '</b></div><div class="spk-fb"><p class="spk-h">' + (r.pct >= 80 ? '🎉 Phát âm tốt lắm!' : r.pct >= 50 ? '🙂 Gần đúng rồi, thử lại nhé!' : '💪 Chưa giống lắm, nghe mẫu rồi nói lại nhé!') + '</p>' +
          (r.heard != null ? '<p class="small">Máy nghe thấy: <b>“' + esc(r.heard || '…') + '”</b></p>' : '') + (r.err ? '<p class="spk-err">' + esc(SPK_ERR[r.err] || ('Lỗi: ' + r.err)) + '</p>' : '') + (LN.ai ? LN.ai.feedbackHtml(r) : '') +
          (r.audio ? '<div class="spk-ctl" style="justify-content:flex-start"><button class="btn btn-yel" data-g="mine">▶ Nghe lại giọng em</button><button class="btn" data-g="hear">🔊 Giọng mẫu</button></div>' : '') +
          (r.needSelf ? '<p class="small" style="margin-top:8px"><b>Em tự chấm:</b> giọng em giống mẫu không?</p><div class="spk-ctl" style="justify-content:flex-start"><button class="btn btn-mint" data-g="self:90">😀 Giống</button><button class="btn btn-yel" data-g="self:60">🙂 Gần giống</button><button class="btn" data-g="self:30">😕 Chưa giống</button></div>' : '') + '</div></div>' +
          '<div class="spk-ctl"><button class="btn btn-lg" data-g="again">🔁 Nói lại</button>' + (r.needSelf ? '' : '<button class="btn btn-lg btn-pink" data-g="next">' + (g.i + 1 < g.total ? 'Từ tiếp ➡' : 'Xem kết quả') + '</button>') + '</div>';
      } else act = '<button class="spk-mic" data-g="mic" aria-label="Bấm để nói"><span>🎤</span></button><p class="spk-s">Bấm để nói' + (b != null ? ' · lần tốt nhất: <b>' + b + '%</b>' : '') + '</p>';
      return { body: '<div class="gwrap" style="max-width:720px">' + guide + card + '<div class="spk-act">' + act + '</div></div></div>', frac: g.i / g.total, right: hud(['Đạt ' + g.score + '/' + g.total]) };
    },
    rec: function (g) {
      var self = this, w = g.deck[g.i], res = { heard: null, alts: [], err: null, audio: null }, pending = 0, finished = false, stream = null, mr = null, chunks = [], recog = null;
      g.sst = 'listening'; LN.drawGame(); if (window.speechSynthesis) speechSynthesis.cancel();
      function finish() {
        if (finished || pending > 0) return; finished = true; clearTimeout(g.spkT);
        if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
        if (!alive(g) || g.sst !== 'listening') return;
        if (res.blob && !res.aiTried && LN.ai && LN.ai.ready()) {
          res.aiTried = true; g.sst = 'aiwait'; LN.drawGame();
          var card = g.deck[g.i], pr = self.scoreAlt ? LN.ai.answer(res.blob, card) : LN.ai.pron(res.blob, w.en, w.vi);
          pr.then(function (x) {
            if (!alive(g) || g.sst !== 'aiwait') return;
            res.ai = x; res.heard = x.heard != null ? x.heard : res.heard; res.err = null; res.needSelf = false;
            res.pct = Math.max(0, Math.min(100, Math.round(+x.score || 0))); g.res = res; g.sst = 'result';
            g.best[g.i] = Math.max(g.best[g.i] || 0, res.pct); if (res.pct >= 80) yes(res.pct + '%'); else no(res.pct + '%');
            LN.drawGame(); if (x.praise && res.pct >= 80) LN.speak(x.praise);
          }).catch(function () { if (!alive(g) || g.sst !== 'aiwait') return; g.sst = 'listening'; finished = false; finish(); });
          return;
        }
        var pct = 0; res.alts.forEach(function (a) { pct = Math.max(pct, self.scoreAlt ? self.scoreAlt(g, a) : simPct(a, w.en)); });
        res.pct = pct; res.needSelf = !SR || (res.err && res.err !== 'no-speech' && !res.alts.length); if (!SR && !res.err) res.err = 'nosr';
        if (res.needSelf && !res.audio && res.err === 'nosr') res.err = 'nosr';
        g.res = res; g.sst = 'result';
        if (!res.needSelf) { g.best[g.i] = Math.max(g.best[g.i] || 0, pct); if (pct >= 80) yes(pct + '%'); else no(pct + '%'); }
        LN.drawGame();
      }
      g.stopRec = function () { try { if (recog) recog.stop(); } catch (e) {} try { if (mr && mr.state !== 'inactive') mr.stop(); } catch (e) {} };
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder) {
        pending++;
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
          stream = s; mr = new MediaRecorder(s); mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
          mr.onstop = function () { if (chunks.length) { res.blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' }); res.audio = URL.createObjectURL(res.blob); } pending--; finish(); };
          mr.start();
        }).catch(function (e) { res.err = res.err || (e && e.name === 'NotAllowedError' ? 'not-allowed' : 'audio-capture'); pending--; finish(); });
      }
      if (SR) {
        try {
          recog = new SR(); recog.lang = 'en-US'; recog.maxAlternatives = 5; recog.interimResults = false; recog.continuous = false; pending++;
          recog.onresult = function (e) { for (var i = 0; i < e.results.length; i++) for (var j = 0; j < e.results[i].length; j++) res.alts.push(e.results[i][j].transcript); res.heard = res.alts[0] || ''; try { if (mr && mr.state !== 'inactive') mr.stop(); } catch (x) {} };
          recog.onerror = function (e) { res.err = e.error || 'error'; };
          recog.onend = function () { pending--; if (res.heard == null && !res.err) res.err = 'no-speech'; try { if (mr && mr.state !== 'inactive') mr.stop(); } catch (x) {} finish(); };
          recog.start();
        } catch (e) { pending--; res.err = 'service-not-allowed'; }
      }
      clearTimeout(g.spkT); g.spkT = setTimeout(function () { g.stopRec(); }, 4500);
      if (!pending) setTimeout(finish, 50);
    },
    click: function (g, t) {
      var a = arg(t), w = g.deck[g.i];
      if (a[0] === 'hear') { LN.speak(w.en); return true; }
      if (a[0] === 'slow') { LN.speak(w.en, 0.55); return true; }
      if (a[0] === 'mic') { LN.store.set('ln_spk_guide', true); g.guide = false; this.rec(g); return true; }
      if (a[0] === 'stop') { if (g.stopRec) g.stopRec(); return true; }
      if (a[0] === 'mine') { if (g.res && g.res.audio) { try { new Audio(g.res.audio).play(); } catch (e) {} } return true; }
      if (a[0] === 'self') { var v = +a[1]; g.best[g.i] = Math.max(g.best[g.i] || 0, v); g.res.needSelf = false; g.res.self = true; g.res.pct = v; g.res.selfTxt = v >= 80 ? '😀' : v >= 50 ? '🙂' : '😕'; if (v >= 80) yes(); else no(); LN.drawGame(); return true; }
      if (a[0] === 'again') { g.sst = 'ready'; g.res = null; LN.drawGame(); return true; }
      if (a[0] === 'next') { this.next(g); return true; }
    },
    next: function (g) {
      g.score = g.best.filter(function (x) { return x >= 70; }).length;
      if (g.i + 1 < g.total) { g.i++; g.sst = 'ready'; g.res = null; LN.drawGame(); LN.speak(g.deck[g.i].en); }
      else { var avg = Math.round(g.best.reduce(function (s, x) { return s + (x || 0); }, 0) / g.total); done(g, g.score / g.total, 'Nói đạt ' + g.score + '/' + g.total + ' từ · điểm phát âm TB ' + avg + '%'); }
    }
  };

  /* ---------- Hỏi – đáp: nghe câu hỏi, trả lời bằng giọng nói (lớp 1: câu hỏi soạn theo Unit; lớp khác: lấy từ mẫu câu) ---------- */
  function spkCards(u) {
    if (u.speaking && u.speaking.length) return u.speaking.map(function (c) { return { q: c.q, vi: c.vi || '', pic: c.pic || '💬', a: c.a, hint: c.hint || '', open: !!c.open }; });
    var out = [];
    (u.patterns || []).forEach(function (pt) { pt.ex.forEach(function (e) { if (/\?\s*$/.test(e[0]) && out.length < 10) { var pp = LN.sentPics(e[0] + ' ' + e[1], 1); out.push({ q: e[0], vi: '', pic: pp[0] || '💬', a: [e[1]], hint: e[1].split(' ').slice(0, 2).join(' ') + ' …' }); } }); });
    return out;
  }
  function frames(c) { return c.a.filter(function (x) { return /…|\.\.\./.test(x); }).map(function (x) { return LN.norm(x.replace(/…|\.\.\./g, '')).replace(/[^a-z' ]/g, '').trim(); }).filter(Boolean); }
  IMPL.speakq = {
    init: function (g) { g.deck = spkCards(g.u).slice(0, 10); g.i = 0; g.sst = 'ready'; g.best = []; g.total = g.deck.length || 1; g.guide = !LN.store.get('ln_spkq_guide', false); g.showHint = false; },
    scoreAlt: function (g, said) {
      var c = g.deck[g.i], best = 0;
      c.a.forEach(function (x) { if (!/…|\.\.\./.test(x)) best = Math.max(best, simPct(said, x)); });
      if (c.open) { var s = LN.norm(said).replace(/[^a-z' ]/g, '').trim(); frames(c).forEach(function (f) { if (s.indexOf(f) >= 0 && s.length > f.length + 1) best = 100; }); }
      return best;
    },
    view: function (g) {
      if (!g.deck.length) return { body: '<div class="gwrap"><div class="qcard" style="text-align:center"><p class="head">Unit này chưa có câu hỏi luyện nói.</p></div></div>', frac: 1, right: '' };
      var c = g.deck[g.i], b = g.best[g.i];
      var guide = '<details class="spk-guide"' + (g.guide ? ' open' : '') + '><summary>📖 Hướng dẫn</summary><ol><li>Nghe <b>câu hỏi</b> (bấm 🔊 để nghe lại).</li><li>Nhìn hình, bấm <b>🎤</b> rồi <b>trả lời to</b> bằng tiếng Anh. Không nhớ thì bấm <b>💡 Gợi ý</b>.</li><li>Xem điểm %, bấm <b>▶ Nghe lại giọng em</b> và <b>🔊 Câu mẫu</b> để so sánh.</li></ol></details>';
      var card = '<div class="spk-card spq"><p class="spk-k">CÂU ' + (g.i + 1) + '/' + g.total + '</p><div class="spq-row"><div class="spk-pic">' + pic(c.pic, 'lg') + '</div><div class="spq-bub"><p class="spq-q">' + esc(c.q) + '</p>' + (c.vi ? '<p class="spk-vi">' + esc(c.vi) + '</p>' : '') + '</div></div>' +
        '<div class="spk-ctl"><button class="btn" data-g="hear">🔊 Nghe câu hỏi</button><button class="btn" data-g="hint">💡 Gợi ý</button></div>' +
        (g.showHint ? '<p class="spq-hint">Em có thể nói: <b>' + esc(c.hint || c.a[0]) + '</b></p>' : '');
      var act;
      if (g.sst === 'aiwait') act = '<div class="ai-wait">' + LN.art('chip-think', 70, 'bob', '') + '<p class="spk-s">Chíp AI đang nghe và chấm câu trả lời…</p></div>';
      else if (g.sst === 'listening') act = '<button class="spk-mic on" data-g="stop" aria-label="Dừng"><span>🎤</span></button><p class="spk-s">Đang nghe… em trả lời đi! <small>(bấm để dừng)</small></p>';
      else if (g.sst === 'result') {
        var r = g.res, col = r.pct >= 80 ? '#1EB980' : r.pct >= 50 ? '#FFB703' : '#FF4F6D', C = 2 * Math.PI * 44;
        act = '<div class="spk-res"><div class="spk-ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="#F1E8EE" stroke-width="10"/><circle cx="50" cy="50" r="44" fill="none" stroke="' + col + '" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + (C * r.pct / 100) + ' ' + C + '" transform="rotate(-90 50 50)"/></svg><b style="color:' + col + '">' + (r.self ? r.selfTxt : r.pct + '%') + '</b></div><div class="spk-fb"><p class="spk-h">' + (r.pct >= 80 ? '🎉 Trả lời hay lắm!' : r.pct >= 50 ? '🙂 Gần đúng rồi, thử lại nhé!' : '💪 Nghe câu mẫu rồi nói lại nhé!') + '</p>' +
          (r.heard != null ? '<p class="small">Máy nghe thấy: <b>“' + esc(r.heard || '…') + '”</b></p>' : '') + '<p class="small">Câu mẫu: <b>' + esc(c.a[0]) + '</b></p>' + (r.err ? '<p class="spk-err">' + esc(SPK_ERR[r.err] || ('Lỗi: ' + r.err)) + '</p>' : '') + (LN.ai ? LN.ai.feedbackHtml(r) : '') +
          '<div class="spk-ctl" style="justify-content:flex-start">' + (r.audio ? '<button class="btn btn-yel" data-g="mine">▶ Nghe lại giọng em</button>' : '') + '<button class="btn" data-g="model">🔊 Câu mẫu</button></div>' +
          (r.needSelf ? '<p class="small" style="margin-top:8px"><b>Em tự chấm:</b> em trả lời giống câu mẫu không?</p><div class="spk-ctl" style="justify-content:flex-start"><button class="btn btn-mint" data-g="self:90">😀 Giống</button><button class="btn btn-yel" data-g="self:60">🙂 Gần giống</button><button class="btn" data-g="self:30">😕 Chưa giống</button></div>' : '') + '</div></div>' +
          '<div class="spk-ctl"><button class="btn btn-lg" data-g="again">🔁 Nói lại</button>' + (r.needSelf ? '' : '<button class="btn btn-lg btn-pink" data-g="next">' + (g.i + 1 < g.total ? 'Câu tiếp ➡' : 'Xem kết quả') + '</button>') + '</div>';
      } else act = '<button class="spk-mic" data-g="mic" aria-label="Bấm để trả lời"><span>🎤</span></button><p class="spk-s">Bấm để trả lời' + (b != null ? ' · lần tốt nhất: <b>' + b + '%</b>' : '') + '</p>';
      return { body: '<div class="gwrap" style="max-width:720px">' + guide + card + '<div class="spk-act">' + act + '</div></div></div>', frac: g.i / g.total, right: hud(['Đạt ' + g.score + '/' + g.total]) };
    },
    mounted: function (g) { if (g.deck.length && g.askedAt !== g.i) { g.askedAt = g.i; LN.speak(g.deck[g.i].q); } },
    click: function (g, t) {
      var a = arg(t), c = g.deck[g.i];
      if (a[0] === 'hear') { LN.speak(c.q); return true; }
      if (a[0] === 'model') { LN.speak(c.a[0].replace(/…/g, '')); return true; }
      if (a[0] === 'hint') { g.showHint = !g.showHint; LN.drawGame(); return true; }
      if (a[0] === 'mic') { LN.store.set('ln_spkq_guide', true); g.guide = false; this.rec(g); return true; }
      if (a[0] === 'next') { g.score = g.best.filter(function (x) { return x >= 70; }).length; if (g.i + 1 < g.total) { g.i++; g.sst = 'ready'; g.res = null; g.showHint = false; LN.drawGame(); } else { var avg = Math.round(g.best.reduce(function (s, x) { return s + (x || 0); }, 0) / g.total); done(g, g.score / g.total, 'Trả lời đạt ' + g.score + '/' + g.total + ' câu · điểm nói TB ' + avg + '%'); } return true; }
      return IMPL.speak.click.call(this, g, t);
    }
  };
  IMPL.speakq.rec = IMPL.speak.rec;

  /* ---------- Sắp xếp câu ---------- */
  IMPL.unscramble = {
    init: function (g) {
      var s = []; g.u.patterns.forEach(function (p) { p.ex.forEach(function (e) { [e[0], e[1]].forEach(function (x) { if (s.indexOf(x) < 0 && x.split(' ').length >= 3) s.push(x); }); }); });
      g.rounds = shuffle(s).slice(0, 8).map(function (x) { var ws = x.replace(/[.?!]$/, '').split(' '), w = shuffle(ws), t = 0; while (w.join(' ') === ws.join(' ') && t++ < 10) w = shuffle(ws); return { s: x, w: w }; });
      g.i = 0; g.built = []; g.res = null; g.total = g.rounds.length;
    },
    view: function (g) {
      var r = g.rounds[g.i], end = /\?$/.test(r.s) ? '?' : '.';
      return { body: '<div class="gwrap"><div class="qcard"><span class="qkind">Sắp xếp thành câu</span><div class="build' + (g.built.length ? '' : ' empty') + '">' + g.built.map(function (k, j) { return '<button type="button" class="wchip in" data-g="u:' + j + '"' + (g.res ? ' disabled' : '') + '>' + esc(r.w[k]) + '</button>'; }).join('') + (g.built.length === r.w.length ? '<span class="head" style="font-size:26px">' + end + '</span>' : '') + '</div>' +
        '<div class="wchips">' + r.w.map(function (x, k) { return '<button type="button" class="wchip' + (g.built.indexOf(k) >= 0 ? ' used' : '') + '" data-g="w:' + k + '"' + (g.res ? ' disabled' : '') + '>' + esc(x) + '</button>'; }).join('') + '</div>' +
        (g.res ? '<div class="fb ' + (g.res ? (g.res.ok ? 'ok' : 'no') : '') + '"><div style="flex:1"><p class="h">' + (g.res.ok ? 'Chính xác!' : 'Câu đúng: ' + esc(r.s)) + '</p></div>' + LN.sayBtn(r.s, 'sm') + '</div>' : '') +
        '<div class="qfoot"><span></span>' + (g.res ? '<button class="btn btn-lg btn-pink" data-g="next">' + (g.i + 1 < g.total ? 'Câu tiếp' : 'Xem kết quả') + '</button>' : '<button class="btn btn-lg btn-mint" data-g="check">Kiểm tra</button>') + '</div></div></div>',
        frac: g.i / g.total, right: hud(['⭐ ' + g.score, (g.i + 1) + '/' + g.total]) };
    },
    click: function (g, t) {
      var a = arg(t), r = g.rounds[g.i];
      if (a[0] === 'w') { g.built.push(+a[1]); LN.drawGame(); return true; }
      if (a[0] === 'u') { g.built.splice(+a[1], 1); LN.drawGame(); return true; }
      if (a[0] === 'check') { if (g.built.length < r.w.length) { LN.toast('Dùng hết các từ nhé.'); return true; } var ok = LN.matches(g.built.map(function (k) { return r.w[k]; }).join(' '), [r.s]); g.res = { ok: ok }; if (ok) { g.score++; yes(); } else no(); LN.speak(r.s); LN.drawGame(); return true; }
      if (a[0] === 'next') { if (g.i + 1 < g.total) { g.i++; g.built = []; g.res = null; LN.drawGame(); } else done(g, g.score / g.total, 'Xếp đúng ' + g.score + '/' + g.total + ' câu!'); return true; }
    }
  };

  /* ---------- Phân loại ---------- */
  IMPL.categorize = {
    init: function (g) {
      var other = LN.unitOf(g.n === 1 ? 2 : g.n - 1), ow = other.vocab.map(function (v) { return { en: v[0], vi: v[1], pic: v[2] }; });
      var own = (g.u.vocab || []).map(function (v) { return { en: v[0], vi: v[1], pic: v[2] }; }), mine = own.map(function (w) { return w.en; });   // chỉ lấy đúng từ của bài này (không lấy từ bù của bài khác)
      var a = shuffle(own.length ? own : g.words).slice(0, 5), b = shuffle(ow.filter(function (w) { return mine.indexOf(w.en) < 0; })).slice(0, 5);
      g.groups = [{ name: 'Unit ' + g.n + ': ' + g.u.vi, icon: g.u.icon }, { name: 'Unit ' + other.n + ': ' + other.vi, icon: other.icon }];
      g.items = shuffle(a.map(function (w) { return { w: w, g: 0 }; }).concat(b.map(function (w) { return { w: w, g: 1 }; })));
      g.place = {}; g.sel = null; g.checked = false; g.total = g.items.length;
    },
    view: function (g) {
      var pool = g.items.map(function (x, k) { return k; }).filter(function (k) { return g.place[k] == null; });
      var grp = function (gi) {
        return '<button type="button" class="cgroup' + (g.sel != null ? ' ready' : '') + '" data-g="grp:' + gi + '"' + (g.checked ? ' disabled' : '') + '><span class="cg-h">' + g.groups[gi].icon + ' ' + esc(g.groups[gi].name) + '</span><span class="cg-b">' +
          g.items.map(function (x, k) { if (g.place[k] !== gi) return ''; var c = g.checked ? (x.g === gi ? ' ok' : ' bad') : ''; return '<span class="wchip in' + c + '" data-g="back:' + k + '">' + pic(x.w.pic, 'xs') + ' ' + esc(x.w.en) + '</span>'; }).join('') + '</span></button>';
      };
      return { body: '<div class="gwrap" style="max-width:900px"><p class="ginst">Bấm một từ, rồi bấm vào nhóm chủ đề đúng của nó.</p><div class="wchips" style="justify-content:center;min-height:56px;margin-bottom:16px">' + pool.map(function (k) {
        return '<button type="button" class="wchip' + (g.sel === k ? ' in' : '') + '" data-g="chip:' + k + '">' + pic(g.items[k].w.pic, 'xs') + ' ' + esc(g.items[k].w.en) + '</button>';
      }).join('') + '</div><div class="cgroups">' + grp(0) + grp(1) + '</div><div class="gctrl">' + (g.checked ? '<button class="btn btn-lg btn-pink" data-g="done">Xem kết quả</button>' : !pool.length ? '<button class="btn btn-lg btn-mint" data-g="check">Kiểm tra</button>' : '') + '</div></div>',
        frac: (g.total - pool.length) / g.total, right: hud([(g.total - pool.length) + '/' + g.total]) };
    },
    click: function (g, t) {
      var a = arg(t);
      if (a[0] === 'chip') { g.sel = +a[1]; LN.speak(g.items[g.sel].w.en); LN.drawGame(); return true; }
      if (a[0] === 'back' && !g.checked) { delete g.place[+a[1]]; LN.drawGame(); return true; }
      if (a[0] === 'grp') { if (g.sel != null) { g.place[g.sel] = +a[1]; g.sel = null; LN.sfx.flip(); LN.drawGame(); } return true; }
      if (a[0] === 'check') { g.checked = true; g.score = g.items.filter(function (x, k) { return g.place[k] === x.g; }).length; g.score === g.total ? yes('Đúng hết!') : no('Đúng ' + g.score + '/' + g.total); LN.drawGame(); return true; }
      if (a[0] === 'done') { done(g, g.score / g.total, 'Xếp đúng ' + g.score + '/' + g.total + ' từ!'); return true; }
    }
  };
})();
;
(window.LN_V=window.LN_V||{})["games.js"]="95da3d9c";
