/* ================= Lưu dữ liệu chung trên mạng (Vercel + Upstash Redis) =================
   Khi trang chạy trên Vercel và đã bật cơ sở dữ liệu: tài khoản, tiến độ, điểm danh, học phí… được lưu trên mạng,
   đăng nhập ở máy nào cũng được. Trình duyệt vẫn giữ một bản sao để học khi mất mạng; có mạng lại thì tự gửi lên.
   Mở file trực tiếp (không có máy chủ) thì app chạy như cũ, chỉ lưu trên máy. */
(function () {
  var LN = window.LN, store = LN.store;
  var C = LN.cloud = { on: false, checked: false, boardList: null, state: 'idle' };
  var SHARED = /^ln_(users|admin|teachers|class|att|fees|imports|grammar|grammar_del|grammar_v|classes|pay|seed_done|note_[a-z0-9_]{1,40}|cl_[a-z0-9_-]{1,40})$/, PROG = /^ln_prog_([a-z0-9_]{1,40})$/;
  var raw = { set: store.set, del: store.del }, QUIET = 0;
  function quiet(fn) { QUIET++; try { fn(); } finally { QUIET--; } }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  function stuTok() { return store.get('ln_cloud_tok', null); }
  function admTok() { var s = store.get('ln_admin_session', null); return s && s.tok && Date.now() - s.t < 12 * 3600000 ? s.tok : null; }
  function api(op, body) {
    return fetch('api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ op: op }, body || {})) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { j._status = r.status; if (!r.ok) { var e = new Error(j.error || ('HTTP ' + r.status)); e.status = r.status; e.body = j; throw e; } return j; }); });
  }
  C.api = api;
  C.check = function () {
    if (location.protocol === 'file:') { C.checked = true; return Promise.resolve(false); }
    return fetch('api/data', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : {}; }).then(function (j) { C.on = !!j.ok; C.checked = true; return C.on; }, function () { C.checked = true; return false; });
  };

  /* ---- Hàng đợi gửi lên mạng (lưu trong máy, không mất khi tắt trình duyệt) ---- */
  function Q() { return Object.assign({ keys: {}, prog: false }, store.get('ln_cloud_q', {})); }
  function setQ(q) { raw.set.call(store, 'ln_cloud_q', q); }
  var timer = null;
  function schedule(ms) { clearTimeout(timer); timer = setTimeout(flush, ms == null ? 1500 : ms); }
  function onChange(k) {
    if (QUIET || !C.on) return;
    if (admTok() && (SHARED.test(k) || PROG.test(k))) { var q = Q(); q.keys[k] = 1; setQ(q); badge('wait'); schedule(); return; }
    var u = store.get('ln_session', null);
    if (stuTok() && u && k === 'ln_prog_' + u) { var q2 = Q(); q2.prog = true; setQ(q2); badge('wait'); schedule(3000); }
  }
  store.set = function (k, v) { raw.set.call(store, k, v); onChange(k); };
  store.del = function (k) { raw.del.call(store, k); onChange(k); };
  var flushing = false;
  function flush() {
    if (!C.on || flushing) return;
    var q = Q(), jobs = [], at = admTok(), st = stuTok(), u = store.get('ln_session', null);
    var keys = Object.keys(q.keys);
    if (keys.length && at) jobs.push(api('aput', { token: at, items: keys.map(function (k) { return { k: k, v: store.get(k, null) }; }) }).then(function () { var q3 = Q(); keys.forEach(function (k) { delete q3.keys[k]; }); setQ(q3); }));
    else if (keys.length && !at) { q.keys = {}; setQ(q); }
    if (q.prog && st && u) {
      var p = store.get('ln_prog_' + u, null) || {};
      jobs.push(api('prog', { token: st, updated: p.updated || Date.now(), data: p, sum: LN.progSummary ? LN.progSummary(p) : {} }).then(function (j) {
        var q4 = Q(); q4.prog = false; setQ(q4);
        if (j.stale && j.prog && j.prog.data) quiet(function () { raw.set.call(store, 'ln_prog_' + u, j.prog.data); });
      }, function (e) { if (e.status === 401) { raw.del.call(store, 'ln_cloud_tok'); var q5 = Q(); q5.prog = false; setQ(q5); } throw e; }));
    }
    if (!jobs.length) { badge('ok'); return; }
    flushing = true; badge('wait');
    Promise.all(jobs).then(function () { flushing = false; badge('ok'); var q6 = Q(); if (Object.keys(q6.keys).length || q6.prog) schedule(500); },
      function () { flushing = false; badge('err'); schedule(30000); });
  }
  C.flush = flush;
  window.addEventListener('online', function () { schedule(300); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });

  /* ---- Biểu tượng trạng thái nhỏ ở góc màn hình ---- */
  function badge(s) {
    C.state = s; var el = document.getElementById('cloudst');
    if (!el) { if (!document.body) return; el = document.createElement('div'); el.id = 'cloudst'; document.body.appendChild(el); }
    el.className = 'cloudst ' + s;
    el.textContent = s === 'wait' ? '⏳ Đang lưu lên mạng…' : s === 'err' ? '⚠ Chưa lưu lên mạng – sẽ tự thử lại' : '☁️ Đã lưu lên mạng';
    clearTimeout(badge.t); if (s === 'ok') badge.t = setTimeout(function () { el.className = 'cloudst hide'; }, 2200);
  }

  /* ---- Áp dữ liệu từ máy chủ vào máy ---- */
  function newer(a, b) { return ((a && a.updated) || 0) > ((b && b.updated) || 0); }
  function applyDump(d, firstLogin) {
    var changed = false, q = Q(), push = [];
    quiet(function () {
      Object.keys(d.keys || {}).forEach(function (k) {
        if (q.keys[k]) return; var v = d.keys[k];
        if (v == null) return;
        var lv = store.get(k, null);
        // lần đầu đăng nhập trên máy này: gộp thêm những mục chỉ có trên máy (vd. học sinh tạo trước khi bật lưu trên mạng)
        if (firstLogin && k !== 'ln_admin' && lv && typeof lv === 'object' && !Array.isArray(lv) && typeof v === 'object' && !Array.isArray(v)) {
          var mg = Object.assign({}, lv, v); if (!same(mg, v)) { v = mg; push.push(k); }
        }
        if (!same(lv, v)) { raw.set.call(store, k, v); changed = true; }
      });
      if (firstLogin) store.keys().forEach(function (k) { if (SHARED.test(k) && !(k in (d.keys || {})) && store.get(k, null) != null) push.push(k); });
      var local = {}; store.keys().forEach(function (k) { var m = k.match(PROG); if (m) local[m[1]] = 1; });
      Object.keys(d.progs || {}).forEach(function (u) {
        var sv = d.progs[u], lv = store.get('ln_prog_' + u, null);
        if (q.keys['ln_prog_' + u]) return;
        if (lv && newer(lv, sv.data) && firstLogin) push.push('ln_prog_' + u);
        else if (!same(lv, sv.data)) { raw.set.call(store, 'ln_prog_' + u, sv.data); changed = true; }
        delete local[u];
      });
      if (firstLogin) Object.keys(local).forEach(function (u) { push.push('ln_prog_' + u); });
    });
    if (push.length) { var q2 = Q(); push.forEach(function (k) { q2.keys[k] = 1; }); setQ(q2); schedule(200); }
    return changed;
  }
  C.applyDump = applyDump;
  function applyStudent(u, user, prog, hash) {
    quiet(function () {
      var all = store.get('ln_users', {}) || {}, old = all[u] || {};
      all[u] = Object.assign({}, old, user, { pass: hash || old.pass || '' }); raw.set.call(store, 'ln_users', all);
      var lv = store.get('ln_prog_' + u, null);
      if (prog && prog.data && (!lv || newer(prog.data, lv) || !lv.updated)) raw.set.call(store, 'ln_prog_' + u, prog.data);
      else if (lv && (!prog || newer(lv, prog.data))) { var q = Q(); q.prog = true; setQ(q); schedule(1000); }
    });
  }

  /* ---- Học sinh ---- */
  C.login = function (u, hash, hash2) {
    return api('login', { user: u, hash: hash, hash2: hash2 }).then(function (j) {
      raw.set.call(store, 'ln_cloud_tok', j.token); applyStudent(u, j.user, j.prog, hash); C.loadBoard(); return j;
    });
  };
  C.register = function (u, rec) {
    return api('register', { user: u, rec: rec }).then(function (j) { raw.set.call(store, 'ln_cloud_tok', j.token); applyStudent(u, j.user, null, rec.pass); return j; });
  };
  C.profile = function (name, mail) { var t = stuTok(); if (C.on && t) api('profile', { token: t, name: name, mail: mail }).catch(function () {}); };
  C.loadBoard = function () {
    var t = stuTok(); if (!C.on || !t) return Promise.resolve();
    return api('board', { token: t }).then(function (j) { C.boardList = j.list || []; }, function () {});
  };
  C.logout = function () { raw.del.call(store, 'ln_cloud_tok'); C.boardList = null; };

  /* ---- Giáo viên ---- */
  C.alogin = function (user, hash) {
    return api('alogin', { user: user, hash: hash }).then(function (j) {
      applyDump(j.data || {}, true); C.lastPull = Date.now();
      raw.set.call(store, 'ln_admin_session', { user: user, t: Date.now(), role: j.role, tok: j.token }); return j;
    });
  };
  C.pullAdmin = function () {
    var t = admTok(); if (!C.on || !t || Date.now() - (C.lastPull || 0) < 15000) return Promise.resolve(false);
    C.lastPull = Date.now();
    return api('adump', { token: t }).then(function (j) { return applyDump(j.data || {}, false); }, function (e) { if (e.status === 401) raw.del.call(store, 'ln_admin_session'); return false; });
  };

  /* ---- Khởi động: kiểm tra máy chủ, lấy dữ liệu mới nhất rồi mới hiện trang ---- */
  var boot0 = LN.boot;
  LN.boot = function () {
    var done = false, go = function () { if (!done) { done = true; boot0(); } };
    setTimeout(go, 4000); // mạng chậm: vẫn mở app bằng dữ liệu trên máy
    C.check().then(function (on) {
      if (!on) return go();
      wrapAdmin();
      var jobs = [api('public').then(function (pub) {
        quiet(function () {
          ['ln_imports', 'ln_grammar', 'ln_grammar_del', 'ln_grammar_v'].forEach(function (k) { if (pub[k] != null && !admTok()) raw.set.call(store, k, pub[k]); });
          if (pub.ln_class && !admTok()) raw.set.call(store, 'ln_class', Object.assign({}, store.get('ln_class', {}) || {}, pub.ln_class));
        });
      }, function () {})];
      var t = stuTok(), u = store.get('ln_session', null);
      if (t && u) jobs.push(api('me', { token: t }).then(function (j) { applyStudent(u, j.user, j.prog, null); C.loadBoard(); },
        function (e) { if (e.status === 401 && e.body && e.body.error === 'gone') { raw.del.call(store, 'ln_session'); C.logout(); } else if (e.status === 401) raw.del.call(store, 'ln_cloud_tok'); }));
      else if (u && !t) { raw.del.call(store, 'ln_session'); } // phiên cũ chỉ lưu trên máy: đăng nhập lại để đồng bộ
      Promise.all(jobs).then(function () { if (done) LN.route(); else go(); flush(); });
    });
  };
  function wrapAdmin() {
    if (!LN.adminRoute || LN.adminRoute._cloud) return;
    var r0 = LN.adminRoute;
    LN.adminRoute = function (parts) {
      var s = store.get('ln_admin_session', null);
      if (s && !s.tok) raw.del.call(store, 'ln_admin_session'); // phiên cũ chưa có mã mạng → đăng nhập lại
      r0(parts);
      C.pullAdmin().then(function (ch) { if (ch && location.hash.indexOf('#/admin') === 0) r0(parts); });
    };
    LN.adminRoute._cloud = true;
  }
})();
