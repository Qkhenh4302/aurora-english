/* Trò chơi bổ sung (bộ "a"): monster — Đại chiến quái vật, whack — Đập chuột chũi
 *
 * HƯỚNG DẪN CHO KIỂM THỬ TỰ ĐỘNG (luôn trả lời đúng):
 *
 *  monster: mỗi lượt g.rounds[g.i] = { w, o, a } — o là 4 lựa chọn tiếng Anh, a là chỉ số đáp án đúng
 *    (g.rounds[g.i].o[g.rounds[g.i].a] === g.rounds[g.i].w). Khi g.pick == null && !g.busy && !g.done,
 *    bấm phần tử [data-g="o:" + g.rounds[g.i].a] (hoặc nhấn phím '1'..'4' = a+1). Sau mỗi câu trò chơi tự chuyển
 *    lượt (≈1.4s; khi hạ boss ≈2.3s + 1.7s giới thiệu Boss 2) — chờ tới khi g.pick == null && !g.busy rồi bấm tiếp.
 *    Kết thúc khi g.done (hết lượt, hạ cả 2 boss, hoặc hết 3 tim).
 *
 *  whack: từ cần tìm là g.queue[g.i]. g.tHole = chỉ số (0..8) của lỗ có chú chuột đang trồi lên cầm từ đúng,
 *    hoặc -1 nếu chuột đúng chưa trồi lên (tương đương g.holes[k].up && g.holes[k].target && !g.holes[k].hit).
 *    Lặp lại (thăm dò ~100ms): nếu !g.lock && g.tHole >= 0 thì bấm [data-g="hit:" + g.tHole]. Kết thúc khi g.done.
 *    Bấm vào lỗ không có chuột (hoặc trong lúc g.lock) không có tác dụng gì.
 */
(function () {
  'use strict';
  var LN = window.LN, esc = LN.esc, shuffle = LN.shuffle, pic = LN.picHtml, ic = LN.ic;
  var IMPL = LN.GAME_IMPL, A = LN.art, AU = LN.artUrl;
  function alive(g) { return LN.curGame() === g && !g.done; }
  function stars(r) { return r >= 0.9 ? 3 : r >= 0.65 ? 2 : 1; }
  function done(g, ratio, text) { if (g.done) return; LN.finishGame(stars(ratio), g.score, text); }
  function others(g, w, n, key) { key = key || 'vi'; return shuffle(g.words.filter(function (x) { return x.en !== w.en && x[key] !== w[key]; })).slice(0, n); }
  function mcq(g, w, key) { var o = shuffle([w].concat(others(g, w, 3, key))); return { w: w, o: o, a: o.indexOf(w) }; }
  function yes(t) { LN.sfx.ok(); LN.burst(true, t); LN.gameHit(true); }
  function no(t) { LN.sfx.bad(); LN.burst(false, t); LN.gameHit(false); }
  var SHAPES = ['▲', '◆', '●', '■'];
  function hearts(n) { var h = ''; for (var i = 0; i < 3; i++) h += A(i < n ? 'hp-heart' : 'hp-heart-empty', 22, 'hp-ic', i < n ? '❤' : ''); return h; }
  function promptBox(w) { return '<div class="gprompt"><span class="gp-pic">' + pic(w.pic) + '</span><span class="gp-t">' + esc(w.vi) + '</span></div>'; }
  function arg(t) { var v = t.getAttribute('data-g') || ''; var i = v.indexOf(':'); return i < 0 ? [v, null] : [v.slice(0, i), v.slice(i + 1)]; }
  function later(g, ms, fn) { setTimeout(function () { if (alive(g)) fn(); }, ms); }
  function rep(c, n) { var s = ''; for (var i = 0; i < n; i++) s += c; return s; }
  function setTopBar(frac) { var b = document.querySelector('.ptop.gtop .bar i'); if (b) b.style.width = Math.round(frac * 100) + '%'; }

  /* =====================================================================
   * Đại chiến quái vật (boss battle)
   * ===================================================================== */
  var DMG = 20;
  var BOSS = {
    1: { name: 'Quái Tím Nghịch Ngợm', secs: 12 },
    2: { name: 'Vua Quái Lửa', secs: 10 }
  };
  /* nhân vật & hiệu ứng: bộ sprite trong window.ART */
  function bossImgs(lvl) { return A(lvl === 2 ? 'monster-boss2' : 'monster-boss1', 0, 'monster-img monster-norm') + A(lvl === 2 ? 'monster-boss2-hit' : 'monster-hit', 0, 'monster-img monster-hitimg'); }
  function bossHp(n, lvl) { return DMG * (lvl === 1 ? Math.max(2, Math.round(n * 0.45)) : Math.max(3, Math.round(n * 0.6))); }

  function monTimer(g, secs, onTimeout) {
    clearInterval(g.tmr); if (g.pick != null || g.busy) return;
    var start = g.qStart || (g.qStart = Date.now()), lastTick = null;
    g.tmr = setInterval(function () {
      if (!alive(g) || g.pick != null || g.busy) { clearInterval(g.tmr); return; }
      var left = secs - (Date.now() - start) / 1000, el = document.getElementById('mon-tbar'), num = document.getElementById('mon-tnum');
      if (el) { el.style.width = Math.max(0, left / secs * 100) + '%'; el.className = left / secs < 0.25 ? 'low' : left / secs < 0.5 ? 'mid' : ''; }
      if (num) num.textContent = Math.max(0, Math.ceil(left)) + 's';
      var sec = Math.ceil(left); if (left <= 3.05 && left > 0 && sec !== lastTick) { lastTick = sec; LN.sfx.tick(); }
      if (left <= 0) { clearInterval(g.tmr); onTimeout(); }
    }, 100);
  }

  IMPL.monster = {
    init: function (g) {
      g.rounds = shuffle(g.words).slice(0, 10).map(function (w) { return mcq(g, w); });
      g.total = g.rounds.length; g.i = 0; g.pick = null; g.hearts = 3; g.streak = 0; g.lvl = 1;
      g.mmax = g.mhp = g.hpShown = bossHp(g.total, 1); g.fx = null; g.busy = false; g.kills = 0;
    },
    view: function (g) {
      var r = g.rounds[g.i], fx = g.fx, boss = BOSS[g.lvl];
      var monCls = 'monster-mon monster-lv' + g.lvl + (fx === 'atk' || fx === 'super' ? ' monster-is-hurt' : '') + (fx === 'matk' ? ' monster-is-lunge' : '') + (g.dead ? ' monster-is-dead' : '') + (fx === 'boss2' ? ' monster-is-enter' : '');
      var heroCls = 'monster-hero' + (fx === 'atk' || fx === 'super' ? ' monster-is-attack' : '') + (fx === 'matk' ? ' monster-is-hurt' : '') + (fx === 'super' ? ' monster-superpow' : '');
      var hh = '';
      for (var i = 0; i < 3; i++) hh += '<span class="monster-heart' + (i < g.hearts ? '' : i === g.hearts && fx === 'matk' ? ' monster-lost' : ' monster-empty') + '">' + A(i < g.hearts || (i === g.hearts && fx === 'matk') ? 'hp-heart' : 'hp-heart-empty', 0, 'monster-hpimg') + '</span>';
      var fxH = '';
      if (fx === 'atk') fxH = '<div class="monster-track"><div class="monster-proj">' + A('confetti-2', 0, 'monster-star') + '</div></div>' + A('fx-slash', 0, 'monster-slash') + '<div class="monster-dmg">-' + g.dmg + '</div>';
      if (fx === 'super') fxH = '<div class="monster-flash"></div>' + A('fx-super', 0, 'monster-beam') + '<div class="monster-superban">⚡ SIÊU CHIÊU! ⚡</div>' + A('fx-slash', 0, 'monster-slash monster-s1') + A('fx-slash', 0, 'monster-slash monster-s2') + A('fx-slash', 0, 'monster-slash monster-s3') + '<div class="monster-dmg monster-big">-' + g.dmg + '</div>';
      if (fx === 'matk') fxH = '<div class="monster-track monster-back"><div class="monster-ball"></div></div><div class="monster-dmg monster-tohero">-1 ❤️</div>';
      if (g.dead) fxH += A('fx-boom', 0, 'monster-boom') + '<div class="monster-koban">' + (g.lvl === 1 ? 'Hạ gục Boss 1! 🎉' : 'Chiến thắng! 🏆') + '</div>';
      if (fx === 'boss2') fxH = '<div class="monster-bossban">👑 BOSS 2! 👑<small>Quái vật to hơn, nhanh hơn!</small></div>';
      var streakH = g.streak > 0 && g.streak % 3 !== 0 ? '<span class="monster-charge">Nạp chiêu ' + rep('⚡', g.streak % 3) + '<i>' + rep('·', 3 - g.streak % 3) + '</i></span>' : g.streak > 0 && fx !== 'super' ? '<span class="monster-charge monster-ready">Sẵn sàng!</span>' : '<span class="monster-charge">Đúng 3 câu liền = SIÊU CHIÊU</span>';
      var arena = '<div class="monster-arena monster-lv' + g.lvl + (fx === 'super' ? ' monster-quaking' : '') + '" id="mon-arena">' +
        '<div class="monster-bg" style="background-image:url(' + AU('battle-bg') + ')"></div>' +
        '<div class="monster-side monster-heroside"><div class="monster-hearts" aria-label="Còn ' + g.hearts + ' tim">' + hh + '</div><div class="' + heroCls + '"><div class="monster-bob">' + A('knight-chip', 0, 'monster-knight') + '</div></div><div class="monster-name">Gà Hiệp Sĩ</div></div>' +
        '<div class="monster-side monster-monside"><div class="monster-hpbox"><span class="monster-lvl">Boss ' + g.lvl + '</span><div class="monster-hp"><i id="mon-hp" style="width:' + (g.hpShown / g.mmax * 100) + '%"></i><b id="mon-hpt">' + g.hpShown + '/' + g.mmax + '</b></div></div>' +
        '<div class="' + monCls + '"><div class="monster-bob">' + bossImgs(g.lvl) + '</div></div><div class="monster-name">' + esc(boss.name) + '</div></div>' +
        fxH + '</div>';
      var reveal = g.pick != null && g.pick !== r.a ? '<div class="monster-reveal">' + (g.pick < 0 ? '⏰ Hết giờ! ' : '') + 'Đáp án đúng: <b>' + esc(r.w.en) + '</b></div>' : '';
      var opts = '<div class="opts g2 monster-opts">' + r.o.map(function (x, k) {
        var c = g.pick == null ? '' : k === r.a ? 'right' : k === g.pick ? 'wrong' : '';
        return '<button type="button" class="opt gopt go' + k + ' ' + c + '" data-g="o:' + k + '"' + (g.pick != null || g.busy ? ' disabled' : '') + '><span class="k">' + SHAPES[k] + '</span><span>' + esc(x.en) + '</span></button>';
      }).join('') + '</div>';
      return {
        body: '<div class="gwrap monster-wrap">' + arena + '<div class="monster-under"><div class="monster-q">' + promptBox(r.w) + streakH + '</div>' +
          '<div class="tbar monster-tbar"><i id="mon-tbar"' + (g.pick != null ? ' style="width:0"' : '') + '></i><b id="mon-tnum">' + (g.pick != null ? '' : boss.secs + 's') + '</b></div>' + reveal + opts +
          '<p class="ghelp">⚔️ Chọn từ tiếng Anh đúng để Gà Hiệp Sĩ tấn công quái vật! (phím 1–4)</p></div></div>',
        frac: g.i / g.total,
        right: '<span class="ghud" id="ghud">' + hearts(g.hearts) + ' <b>' + (g.i + 1) + '/' + g.total + '</b></span>'
      };
    },
    mounted: function (g) {
      if (g.hpShown !== g.mhp) {
        var to = g.mhp;
        later(g, 420, function () {
          g.hpShown = to;
          var b = document.getElementById('mon-hp'), t = document.getElementById('mon-hpt');
          if (b) { b.style.width = (to / g.mmax * 100) + '%'; b.className = to / g.mmax < 0.3 ? 'monster-hplow' : to / g.mmax < 0.6 ? 'monster-hpmid' : ''; }
          if (t) t.textContent = to + '/' + g.mmax;
        });
      } else {
        var b0 = document.getElementById('mon-hp'); if (b0) b0.className = g.mhp / g.mmax < 0.3 ? 'monster-hplow' : g.mhp / g.mmax < 0.6 ? 'monster-hpmid' : '';
      }
      monTimer(g, BOSS[g.lvl].secs, function () { IMPL.monster.answer(g, -1); });
    },
    answer: function (g, k) {
      if (g.pick != null || g.busy || g.done) return;
      var r = g.rounds[g.i], ok = k === r.a, killed = false;
      g.pick = k; clearInterval(g.tmr); g.dead = false;
      if (ok) {
        g.score++; g.streak++;
        var sup = g.streak % 3 === 0;
        g.dmg = sup ? DMG * 2 : DMG; g.mhp = Math.max(0, g.mhp - g.dmg); g.fx = sup ? 'super' : 'atk';
        killed = g.mhp <= 0; g.dead = killed;
        yes(sup ? 'SIÊU CHIÊU! x2 💥' : killed ? 'Hạ gục!' : ''); LN.sfx.whoosh(); LN.speak(r.w.en);
      } else {
        g.streak = 0; g.hearts--; g.fx = 'matk';
        no(k < 0 ? 'Hết giờ! Đáp án: ' + r.w.en : 'Đáp án: ' + r.w.en);
        later(g, 700, function () { LN.speak(r.w.en); });
      }
      LN.drawGame();
      if (killed) { g.kills++; later(g, 900, function () { LN.sfx.win(); }); }
      later(g, killed ? 2400 : ok ? 1400 : 2300, function () { IMPL.monster.next(g, killed); });
    },
    next: function (g, killed) {
      g.fx = null; g.dead = false;
      if (g.hearts <= 0) { done(g, g.score / g.total, 'Quái vật thắng mất rồi! Đúng ' + g.score + '/' + g.total + ' câu. Thử lại nhé!'); return; }
      if (killed && g.lvl === 2) { g.total = g.i + 1; done(g, g.score / g.total, 'Hạ gục cả 2 Boss! Đúng ' + g.score + '/' + g.total + ' câu! 🏆'); return; }
      if (g.i + 1 >= g.total) {
        done(g, g.score / g.total, killed ? 'Hạ gục Boss 1! Đúng ' + g.score + '/' + g.total + ' câu!' : g.kills ? 'Hạ Boss 1, Boss 2 còn ' + g.mhp + ' máu. Đúng ' + g.score + '/' + g.total + ' câu!' : 'Hết lượt! Quái vật còn ' + g.mhp + ' máu. Đúng ' + g.score + '/' + g.total + ' câu');
        return;
      }
      g.i++; g.pick = null; g.qStart = null;
      if (killed) {
        g.lvl = 2; g.mmax = g.mhp = g.hpShown = bossHp(g.total, 2); g.fx = 'boss2'; g.busy = true; LN.sfx.combo();
        LN.drawGame();
        later(g, 1700, function () { g.busy = false; g.fx = null; g.qStart = null; LN.drawGame(); });
        return;
      }
      LN.drawGame();
    },
    key: function (g, ev) { var n = parseInt(ev.key, 10); if (n >= 1 && n <= 4 && g.pick == null && !g.busy) { ev.preventDefault(); IMPL.monster.answer(g, n - 1); } },
    click: function (g, t) { var a = arg(t); if (a[0] === 'o') { if (g.pick == null && !g.busy) IMPL.monster.answer(g, +a[1]); return true; } }
  };

  /* =====================================================================
   * Đập chuột chũi (whack-a-mole)
   * ===================================================================== */
  function upDur(g) { return Math.max(1750, 3000 - g.i * 140); }
  function spawnGap(g) { return Math.max(520, 1050 - g.i * 55) + Math.random() * 300; }
  function maxUp(g) { return g.i < 3 ? 2 : 3; }

  IMPL.whack = {
    init: function (g) {
      g.queue = shuffle(g.words).slice(0, Math.min(10, g.words.length)); g.total = g.queue.length;
      g.i = 0; g.lives = 3; g.tHole = -1; g.tEsc = 0; g.sinceT = 1; g.lock = false; g.reveal = false;
      g.holes = []; for (var k = 0; k < 9; k++) g.holes.push({ up: false });
    },
    view: function (g) {
      var holes = '';
      for (var k = 0; k < 9; k++) {
        holes += '<button type="button" class="whack-hole" data-g="hit:' + k + '" id="wh-' + k + '" aria-label="Lỗ ' + (k + 1) + '">' +
          A('whack-hole-back', 0, 'whack-back') + '<span class="whack-mask"><span class="whack-mole" id="wm-' + k + '">' + A('whack-mole', 0, 'whack-mimg whack-mnorm') + A('whack-mole-hit', 0, 'whack-mimg whack-mhit') + A('confetti-2', 0, 'whack-gstar') + '<span class="whack-sign" id="ws-' + k + '"></span></span></span>' +
          A('whack-hole-front', 0, 'whack-front') + '<span class="whack-fx" id="wf-' + k + '"></span></button>';
      }
      return {
        body: '<div class="gwrap whack-wrap"><div id="whack-prompt">' + promptBox(g.queue[g.i]) + '</div><div class="whack-reveal" id="whack-reveal"></div>' +
          '<div class="whack-field" id="whack-field" role="application" aria-label="Sân đập chuột" style="background-image:url(' + AU('whack-field-bg') + ')">' +
          '<div class="whack-grid">' + holes + '</div><div class="whack-ham" id="whack-ham">' + A('whack-hammer', 0, 'whack-hamimg') + '</div></div>' +
          '<p class="ghelp">🔨 Đập chú chuột cầm từ tiếng Anh đúng với nghĩa ở trên. Chuột vàng 🌟 được điểm gấp đôi!</p></div>',
        frac: g.i / g.total,
        right: '<span class="ghud" id="ghud">' + hearts(g.lives) + ' <b>🔨 ' + g.score + '/' + g.total + '</b></span>'
      };
    },
    mounted: function (g) {
      var field = document.getElementById('whack-field'), ham = document.getElementById('whack-ham'), self = this;
      if (!field) return;
      g.field = field; g.tHole = -1; g.lock = false;
      for (var k = 0; k < 9; k++) g.holes[k] = { up: false };
      var moveHam = function (e) {
        var rc = field.getBoundingClientRect();
        var zf = rc.width ? field.offsetWidth / rc.width : 1; ham.style.transform = 'translate(' + ((e.clientX - rc.left) * zf - 26) + 'px,' + ((e.clientY - rc.top) * zf - 30) + 'px)';
        ham.classList.add('whack-on');
      };
      field.addEventListener('pointermove', function (e) { if (e.pointerType === 'mouse') moveHam(e); });
      field.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') ham.classList.remove('whack-on'); });
      field.addEventListener('pointerdown', function (e) { moveHam(e); var sv = ham.firstChild; sv.classList.remove('whack-swing'); void sv.getBoundingClientRect(); sv.classList.add('whack-swing'); });
      var myLoop = g.loopId = (g.loopId || 0) + 1;
      g.nextSpawn = performance.now() + 500;
      var loop = function (now) {
        if (!alive(g) || g.loopId !== myLoop || !document.body.contains(field)) return;
        if (!g.lock) {
          for (var k = 0; k < 9; k++) { var h = g.holes[k]; if (h.up && !h.hit && now > h.until) { self.hide(g, k, true); if (!alive(g) || g.lock) break; } }
          if (!g.lock && now >= g.nextSpawn) { self.spawn(g, now); g.nextSpawn = now + spawnGap(g); }
        }
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    },
    spawn: function (g, now) {
      var free = [], shown = [], k;
      for (k = 0; k < 9; k++) { if (g.holes[k].up) shown.push(g.holes[k].w.en); else free.push(k); }
      if (!free.length || 9 - free.length >= maxUp(g)) return;
      var w = g.queue[g.i], hole = free[Math.floor(Math.random() * free.length)], word, target = false, gold = false;
      if (g.tHole < 0 && (g.sinceT >= 2 || Math.random() < 0.45)) { word = w; target = true; gold = Math.random() < 0.22; g.sinceT = 0; g.tHole = hole; }
      else {
        var cand = others(g, w, 8).filter(function (x) { return shown.indexOf(x.en) < 0; });
        if (!cand.length) { if (g.tHole >= 0) return; word = w; target = true; g.tHole = hole; g.sinceT = 0; }
        else { word = cand[0]; g.sinceT++; }
      }
      g.holes[hole] = { up: true, w: word, target: target, gold: gold, until: now + upDur(g) * (gold ? 0.85 : 1) };
      var m = document.getElementById('wm-' + hole), s = document.getElementById('ws-' + hole), b = document.getElementById('wh-' + hole);
      if (!m) return;
      s.textContent = word.en; s.className = 'whack-sign' + (word.en.length > 12 ? ' whack-xl' : word.en.length > 7 ? ' whack-l' : '');
      m.className = 'whack-mole whack-up' + (gold ? ' whack-gold' : '');
      b.setAttribute('aria-label', word.en);
    },
    hide: function (g, k, escaped) {
      var h = g.holes[k], m = document.getElementById('wm-' + k), b = document.getElementById('wh-' + k);
      if (!h.up) return;
      var wasTarget = h.target && !h.hit;
      g.holes[k] = { up: false };
      if (m) m.className = m.className.replace(/\bwhack-up\b/, '').replace(/\s+/g, ' ');
      if (b) b.setAttribute('aria-label', 'Lỗ ' + (k + 1));
      if (wasTarget || g.tHole === k) g.tHole = -1;
      if (escaped && wasTarget) {
        g.tEsc++;
        if (g.tEsc >= 2) {
          g.tEsc = 0; g.lives--; no('Chuột “' + h.w.en + '” trốn mất rồi!'); this.showReveal(g); this.hud(g);
          if (g.lives <= 0) { g.lock = true; later(g, 700, function () { done(g, g.score / g.total, 'Đập trúng ' + g.score + '/' + g.total + ' chú chuột'); }); }
        } else { LN.toast('Chuột cầm từ đúng vừa trốn! Nhanh tay lên nhé ⏰'); }
      }
    },
    showReveal: function (g) { var r = document.getElementById('whack-reveal'); if (r) { r.innerHTML = '💡 Từ đúng là: <b>' + esc(g.queue[g.i].en) + '</b>'; r.classList.add('whack-on'); } },
    hud: function (g) {
      var h = document.getElementById('ghud'); if (h) h.innerHTML = hearts(g.lives) + ' <b>🔨 ' + g.score + '/' + g.total + '</b>';
      var p = document.getElementById('whack-prompt'); if (p && g.queue[g.i] && p.getAttribute('data-i') !== String(g.i)) { p.setAttribute('data-i', g.i); p.innerHTML = promptBox(g.queue[g.i]); }
      setTopBar(g.i / g.total);
    },
    fxStars: function (k, gold) {
      var f = document.getElementById('wf-' + k); if (!f) return;
      var html = '';
      for (var i = 0; i < 7; i++) { var a = i / 7 * Math.PI * 2, d = 46 + (i % 2) * 18; html += '<span style="--dx:' + Math.round(Math.cos(a) * d) + 'px;--dy:' + Math.round(Math.sin(a) * d - 20) + 'px">' + A(gold ? 'coin-burst' : 'confetti-2', 0, 'whack-fxs' + (i % 2 ? ' sm' : '')) + '</span>'; }
      f.innerHTML = html + '<b class="whack-bonk">BONK!</b>';
      setTimeout(function () { f.innerHTML = ''; }, 900);
    },
    next: function (g) {
      g.i++; g.tEsc = 0; g.tHole = -1; g.sinceT = 1;
      var r = document.getElementById('whack-reveal'); if (r) { r.innerHTML = ''; r.classList.remove('whack-on'); }
      if (g.i >= g.total) { done(g, g.score / g.total, 'Đập trúng ' + g.score + '/' + g.total + ' chú chuột! 🔨'); return; }
      this.hud(g);
      var p = document.getElementById('whack-prompt'); if (p) { p.classList.remove('whack-new'); void p.offsetWidth; p.classList.add('whack-new'); }
      g.lock = false; g.nextSpawn = performance.now() + 450;
    },
    click: function (g, t) {
      var a = arg(t); if (a[0] !== 'hit') return false;
      var k = +a[1], h = g.holes[k], self = this, m = document.getElementById('wm-' + k);
      if (g.lock || !h || !h.up || h.hit) return true;
      h.hit = true;
      if (m) m.classList.add('whack-hit');
      if (h.target) {
        g.lock = true; g.score++; g.tHole = -1; LN.sfx.pop();
        yes(h.gold ? 'Chuột vàng! x2 🌟' : ''); if (h.gold) LN.gameHit(true);
        LN.speak(h.w.en); this.fxStars(k, h.gold); this.hud(g);
        for (var j = 0; j < 9; j++) if (j !== k && g.holes[j].up) this.hide(g, j, false);
        later(g, 650, function () { self.hide(g, k, false); if (m) m.classList.remove('whack-hit'); });
        later(g, 1000, function () { self.next(g); });
      } else {
        g.lives--; if (m) m.classList.add('whack-bad');
        no('“' + h.w.en + '” = ' + h.w.vi); this.hud(g);
        later(g, 500, function () { self.hide(g, k, false); if (m) m.classList.remove('whack-hit', 'whack-bad'); });
        if (g.lives <= 0) { g.lock = true; later(g, 700, function () { done(g, g.score / g.total, 'Đập trúng ' + g.score + '/' + g.total + ' chú chuột'); }); }
      }
      return true;
    }
  };
})();
