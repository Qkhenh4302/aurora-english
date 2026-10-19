/* ================= Lưu dữ liệu chung trên mạng (Vercel + Upstash Redis) =================
   Khi trang chạy trên Vercel và đã bật cơ sở dữ liệu: tài khoản, tiến độ, điểm danh, học phí… được lưu trên mạng,
   đăng nhập ở máy nào cũng được. Trình duyệt vẫn giữ một bản sao để học khi mất mạng; có mạng lại thì tự gửi lên.
   Mở file trực tiếp (không có máy chủ) thì app chạy như cũ, chỉ lưu trên máy. */
(function () {
  var LN = window.LN, store = LN.store;
  var C = LN.cloud = { on: false, checked: false, boardList: null, state: 'idle' };
  var SHARED = /^ln_(users|admin|teachers|class|att|fees|imports|grammar|grammar_del|grammar_v|classes|pay|charge|bank|exedit|seed_done|seed_v|note_[a-z0-9_]{1,40}|cl_[a-z0-9_-]{1,40})$/, PROG = /^ln_prog_([a-z0-9_]{1,40})$/;
  var raw = { set: store.set, del: store.del }, QUIET = 0;
  function quiet(fn) { QUIET++; try { fn(); } finally { QUIET--; } }
  function same(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
  /* Gộp tiến độ học của 2 bản (2 máy / máy và mạng): không bao giờ làm mất kết quả đã làm */
  function mergeProg(a, b) {
    if (!a) return b; if (!b) return a;
    function isO(x) { return x && typeof x === 'object' && !Array.isArray(x); }
    function deep(x, y) {
      if (x === undefined) return y; if (y === undefined) return x;
      if (typeof x === 'number' && typeof y === 'number') return Math.max(x, y);
      if (typeof x === 'boolean' || typeof y === 'boolean') return !!(x || y);
      if (Array.isArray(x) && Array.isArray(y)) { var seen = {}, out = []; x.concat(y).forEach(function (v) { var k = JSON.stringify(v); if (!seen[k]) { seen[k] = 1; out.push(v); } }); return out; }
      if (isO(x) && isO(y)) { var o = {}; Object.keys(x).concat(Object.keys(y)).forEach(function (k) { if (!(k in o)) o[k] = deep(x[k], y[k]); }); return o; }
      return y;
    }
    var m = deep(a, b);
    var lg = {}; m.log = (a.log || []).concat(b.log || []).filter(function (l) { var k = (l && l.t) + '|' + (l && (l.id || l.title)); if (lg[k]) return false; lg[k] = 1; return true; }).sort(function (x, y) { return (x.t || 0) - (y.t || 0); }).slice(-400);
    m.updated = Math.max(+a.updated || 0, +b.updated || 0);
    return m;
  }
  C.mergeProg = mergeProg;

  /* Gộp 3 chiều giống máy chủ (base = bản lấy về lần trước) */
  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }
  function kid(x) { return x.id != null ? 'i:' + x.id : 'u:' + x.user; }
  function idArr(a) { return Array.isArray(a) && a.every(function (x) { return isObj(x) && (x.id != null || x.user != null); }); }
  function merge3(b, l, r) {
    if (same(l, b)) return r;
    if (same(r, b) || same(l, r)) return l;
    if (isObj(l) && isObj(r)) { var bb = isObj(b) ? b : {}, out = {}; Object.keys(r).concat(Object.keys(l).filter(function (k) { return !(k in r); })).forEach(function (k) { var v = merge3(bb[k], l[k], r[k]); if (v !== undefined) out[k] = v; }); return out; }
    if (idArr(l) && idArr(r) && (l.length || r.length) && (b == null || idArr(b))) {
      var m = function (a) { var o = {}; (a || []).forEach(function (x) { o[kid(x)] = x; }); return o; }, B = m(b), L = m(l), R = m(r), out2 = [];
      r.map(kid).concat(l.map(kid).filter(function (id) { return !(id in R); })).forEach(function (id) { var v = merge3(B[id], L[id], R[id]); if (v !== undefined) out2.push(v); });
      return out2;
    }
    return l;
  }
  function merge2(l, r) {
    if (isObj(l) && isObj(r)) { var out = Object.assign({}, r); Object.keys(l).forEach(function (k) { out[k] = k in r ? merge2(l[k], r[k]) : l[k]; }); return out; }
    return r === undefined ? l : r;
  }
  C.merge3 = merge3;
  // bản gốc từng khoá = bản đã khớp với máy chủ lần gần nhất (để biết máy này đã sửa gì)
  function bases() { return store.get('ln_cloud_base', {}) || {}; }
  function setBases(o) { raw.set.call(store, 'ln_cloud_base', o); }
  function hasAdm() { return !!store.get('ln_admin_session', null); }
  // máy vừa lên bản mới (chưa có bản gốc): bỏ hàng đợi cũ của bản trước, lấy dữ liệu trên mạng làm chuẩn
  if (store.get('ln_cloud_base', null) == null) { var q0 = store.get('ln_cloud_q', null); if (q0 && q0.keys) { q0.keys = {}; raw.set.call(store, 'ln_cloud_q', q0); } setBases({}); }
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
    if (QUIET || (C.checked && !C.on)) return;
    var u = store.get('ln_session', null);
    // máy có phiên giáo viên: xếp hàng gửi (kể cả khi phiên hết hạn – đăng nhập lại sẽ gửi tiếp, không bỏ)
    if (hasAdm() && (SHARED.test(k) || (PROG.test(k) && k !== 'ln_prog_' + u))) { var q = Q(); q.keys[k] = 1; setQ(q); badge('wait'); schedule(); return; }
    if (stuTok() && u && u !== '__gv' && k === 'ln_prog_' + u) { var q2 = Q(); q2.prog = true; setQ(q2); badge('wait'); schedule(3000); }
  }
  store.set = function (k, v) { raw.set.call(store, k, v); onChange(k); };
  store.del = function (k) { raw.del.call(store, k); onChange(k); };
  var flushing = false;
  function flush() {
    if (!C.on || flushing) return;
    var q = Q(), jobs = [], at = admTok(), st = stuTok(), u = store.get('ln_session', null);
    var keys = Object.keys(q.keys).slice(0, 150);
    if (keys.length && at) {
      var B = bases(), sent = {};
      var items = keys.map(function (k) { var v = store.get(k, null), it = { k: k, v: v }; sent[k] = JSON.stringify(v); if (k in B) it.b = B[k]; return it; });
      jobs.push(api('aput', { token: at, items: items }).then(function (j) {
        var fin = j.final || {}, q3 = Q(), B2 = bases(), changed = false;
        quiet(function () {
          keys.forEach(function (k) {
            var now = store.get(k, null), stillSame = JSON.stringify(now) === sent[k];
            if (k in fin) {
              if (fin[k] == null) { delete B2[k]; } else {
                B2[k] = fin[k];
                if (stillSame) { if (!same(now, fin[k])) { raw.set.call(store, k, fin[k]); changed = true; } }
                else { raw.set.call(store, k, merge3(JSON.parse(sent[k]), now, fin[k])); changed = true; }   // sửa thêm trong lúc đang gửi: gộp, gửi tiếp
              }
            }
            if (stillSame) delete q3.keys[k];
          });
        });
        setBases(B2); setQ(q3);
        if (changed && LN._lpRefresh) LN._lpRefresh();
      }, function (e) { if (e.status === 401) raw.del.call(store, 'ln_admin_session'); throw e; }));
    }
    if (q.prog && st && u) {
      var p = store.get('ln_prog_' + u, null) || {};
      jobs.push(api('prog', { token: st, updated: p.updated || Date.now(), data: p, sum: LN.progSummary ? LN.progSummary(p) : {} }).then(function (j) {
        var q4 = Q(); q4.prog = false; setQ(q4);
        if (j.prog && j.prog.data) quiet(function () { var cur = store.get('ln_prog_' + u, null), mg = mergeProg(cur, j.prog.data); if (!same(cur, mg)) raw.set.call(store, 'ln_prog_' + u, mg); });
      }, function (e) { if (e.status === 401) { raw.del.call(store, 'ln_cloud_tok'); var q5 = Q(); q5.prog = false; setQ(q5); } throw e; }));
    }
    if (!jobs.length) { badge(keys.length ? 'login' : 'ok'); return; }
    flushing = true; badge('wait');
    Promise.all(jobs).then(function () { flushing = false; var q6 = Q(); if (Object.keys(q6.keys).length || q6.prog) schedule(300); else badge('ok'); },
      function () { flushing = false; badge('err'); schedule(20000); });
  }
  C.flush = flush;
  C.pending = function () { var q = Q(); return Object.keys(q.keys).length > 0 || q.prog; };
  window.addEventListener('online', function () { schedule(300); });
  function refreshAdmin() {
    if (!C.on || !admTok() || location.hash.indexOf('#/admin') !== 0 || Date.now() - (C.lastPull || 0) < 5000) return;
    C.lastPull = 0;
    C.pullAdmin().then(function (ch) { if (ch && !document.getElementById('lp-modal') && LN._lpRefresh) LN._lpRefresh(); });
  }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshAdmin(); });
  window.addEventListener('focus', refreshAdmin);
  setInterval(function () { if (!document.hidden) refreshAdmin(); }, 60000);
  document.addEventListener('visibilitychange', function () { if (document.hidden) flush(); });

  /* ---- Biểu tượng trạng thái nhỏ ở góc màn hình ---- */
  function badge(s) {
    C.state = s; var el = document.getElementById('cloudst');
    if (!el) { if (!document.body) return; el = document.createElement('div'); el.id = 'cloudst'; document.body.appendChild(el); }
    el.className = 'cloudst ' + s;
    el.textContent = s === 'login' ? '⚠ Hết phiên – đăng nhập lại Khu giáo viên để lưu lên mạng' : s === 'wait' ? '⏳ Đang lưu lên mạng…' : s === 'err' ? '⚠ Chưa lưu lên mạng – sẽ tự thử lại' : '☁️ Đã lưu lên mạng';
    clearTimeout(badge.t); if (s === 'ok') badge.t = setTimeout(function () { el.className = 'cloudst hide'; }, 2200);
  }

  /* ---- Áp dữ liệu từ máy chủ vào máy ---- */
  function newer(a, b) { return ((a && a.updated) || 0) > ((b && b.updated) || 0); }
  function applyDump(d, firstLogin) {
    var changed = false, q = Q(), push = [], B = bases(), sk = d.keys || {};
    quiet(function () {
      Object.keys(sk).forEach(function (k) {
        if (q.keys[k]) return;               // máy này đang có thay đổi chưa gửi: giữ, lúc gửi máy chủ sẽ gộp
        var v = sk[k]; if (v == null) return;
        var lv = store.get(k, null);
        B[k] = sk[k];   // máy chưa có bản gốc: lấy đúng bản trên mạng (không làm sống lại dữ liệu cũ đã xoá)
        if (!same(lv, v)) { raw.set.call(store, k, v); changed = true; }
      });
      // khoá đã bị xoá trên mạng (máy này từng đồng bộ) → xoá ở máy này
      var gone = Object.keys(B).filter(function (k) { return !(k in sk) && SHARED.test(k) && !q.keys[k]; });
      if (!Object.keys(sk).length || gone.length > Math.max(3, Object.keys(B).length / 2)) gone = [];   // máy chủ trống hoặc mất nhiều dữ liệu: không xoá ở máy này
      gone.forEach(function (k) { if (true) { delete B[k]; if (store.get(k, null) != null) { raw.del.call(store, k); changed = true; } } });
      if (firstLogin) store.keys().forEach(function (k) { if (SHARED.test(k) && !(k in sk) && !(k in B) && store.get(k, null) != null) push.push(k); });
      if (!Object.keys(sk).length) store.keys().forEach(function (k) { if (SHARED.test(k) && store.get(k, null) != null && push.indexOf(k) < 0) { delete B[k]; push.push(k); } });   // máy chủ trống: đưa dữ liệu của máy này lên lại
      var local = {}; store.keys().forEach(function (k) { var m = k.match(PROG); if (m && m[1] !== '__gv') local[m[1]] = 1; });
      Object.keys(d.progs || {}).forEach(function (u) {
        var sv = d.progs[u], lv = store.get('ln_prog_' + u, null);
        if (q.keys['ln_prog_' + u]) return;
        var mg = mergeProg(lv, sv.data);
        if (!same(mg, lv)) { raw.set.call(store, 'ln_prog_' + u, mg); changed = true; }
        if (lv && !same(mg, sv.data)) push.push('ln_prog_' + u);   // máy cô còn giữ kết quả mạng bị thiếu: gộp & gửi lên
        delete local[u];
      });
    });
    setBases(B);
    if (push.length) { var q2 = Q(); push.forEach(function (k) { q2.keys[k] = 1; }); setQ(q2); schedule(200); }
    return changed;
  }
  C.applyDump = applyDump;
  function applyStudent(u, user, prog, hash) {
    quiet(function () {
      var all = store.get('ln_users', {}) || {}, old = all[u] || {};
      all[u] = Object.assign({}, old, user, { pass: hash || old.pass || '' }); raw.set.call(store, 'ln_users', all);
      var lv = store.get('ln_prog_' + u, null), sv = prog && prog.data, mg = mergeProg(lv, sv);
      if (mg && !same(mg, lv)) raw.set.call(store, 'ln_prog_' + u, mg);
      if (mg && !same(mg, sv)) { var q = Q(); q.prog = true; setQ(q); schedule(1000); }   // máy này có kết quả mạng chưa có: gửi lên
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
      applyDump(j.data || {}, true); C.lastPull = Date.now(); C.pulled = true;
      raw.set.call(store, 'ln_admin_session', { user: user, t: Date.now(), role: j.role, tok: j.token }); C.pullFailed = false; schedule(300); return j;
    });
  };
  C.pullAdmin = function () {
    var t = admTok(); if (!C.on || !t || Date.now() - (C.lastPull || 0) < 15000) return Promise.resolve(false);
    C.lastPull = Date.now();
    return api('adump', { token: t }).then(function (j) { C.pulled = true; C.pullFailed = false; return applyDump(j.data || {}, false); }, function (e) { C.pullFailed = true; C.lastPull = 0; if (e.status === 401) raw.del.call(store, 'ln_admin_session'); return false; });
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
          ['ln_imports', 'ln_grammar', 'ln_grammar_del', 'ln_grammar_v', 'ln_exedit'].forEach(function (k) { if (pub[k] != null && !admTok()) raw.set.call(store, k, pub[k]); });
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
      C.pullAdmin().then(function (ch) { if ((ch || LN._waitPull) && location.hash.indexOf('#/admin') === 0) { LN._waitPull = false; r0(parts); } });
    };
    LN.adminRoute._cloud = true;
  }
})();
;
(window.LN_V=window.LN_V||{})["cloud.js"]="5282ec6a";
