/* ================= Khu giáo viên (bản gọn): Lớp học · Học phí · Phiếu báo · Cài đặt =================
   Phần tính toán ở lop_core.js. Mọi thay đổi lưu ngay, tự đồng bộ lên mạng, không xoá dữ liệu tháng cũ. */
(function () {
  'use strict';
  var LN = window.LN, store = LN.store, esc = LN.esc, ic = LN.ic, toast = LN.toast, K = LN.lopCore;
  var DOWS = K.DOWS, DOWS_S = K.DOWS_S;
  var BANK0 = { bank: 'Vietcombank', holder: 'NGUYEN THI QUYEN', qr: '00020101021138630010A000000727013300069704360119QRGD0101001239030020208QRIBFTTA53037045802VN6304E106', amt: true };

  /* ---------- tiện ích ---------- */
  function money(n) { return (Math.round(n) || 0).toLocaleString('vi-VN') + 'đ'; }
  function today() { return K.iso(new Date()); }
  function nowHm() { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
  function dmy(s) { var p = String(s).split('-'); return +p[2] + '/' + +p[1]; }
  function dmyy(s) { var p = String(s).split('-'); return +p[2] + '/' + +p[1] + '/' + p[0]; }
  function ymTxt(ym) { return 'Tháng ' + (+ym.slice(5)) + '/' + ym.slice(0, 4); }
  function mTxt(ym) { return 'tháng ' + (+ym.slice(5)); }
  function classes() { return store.get('ln_classes', {}) || {}; }
  function clsList(all) { var c = classes(); return Object.keys(c).map(function (k) { return c[k]; }).filter(function (x) { return all || !x.archived; }).sort(function (a, b) { return (a.order || 0) - (b.order || 0) || String(a.name).localeCompare(String(b.name), 'vi', { numeric: true }); }); }
  function saveCls(cl) { var c = classes(); c[cl.id] = cl; store.set('ln_classes', c); }
  function cdata(id) { var d = store.get('ln_cl_' + id, null) || {}; d.att = d.att || {}; d.off = d.off || {}; d.extra = d.extra || {}; d.closed = d.closed || {}; return d; }
  function saveCd(id, d) { store.set('ln_cl_' + id, d); }
  function pays() { return store.get('ln_pay', {}) || {}; }
  function payOf(sid) { return pays()[sid] || []; }
  function bank() { return Object.assign({}, BANK0, store.get('ln_bank', null) || {}); }
  function uname(n) { return String(n || '').trim().replace(/Đ/g, 'D').replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function shell(active, body) { LN.adminShell(active, body); }
  function curStudents(cl, ym) { return (cl.students || []).filter(function (st) { return (!st.left || st.left >= ym + '-01') && (!st.joined || st.joined <= K.monthDays(ym).pop()); }); }
  function schedTxt(cl) {
    var td = today();
    return (cl.slots || []).filter(function (s) { return !s.to || s.to >= td; }).sort(function (a, b) { return ((a.dow + 6) % 7) - ((b.dow + 6) % 7); })
      .map(function (s) { return DOWS_S[s.dow] + ' ' + K.timeTxt(s.start) + '–' + K.timeTxt(s.end) + (s.from && s.from > td ? ' (từ ' + dmy(s.from) + ')' : ''); }).join(' · ') || 'Chưa có lịch';
  }
  function ruleTxt(cl) { var b = cl.billing || {}, p = K.priceOf(cl, null, today()); return money(p) + '/buổi · ' + (b.mode === 'pack' ? 'đóng theo gói ' + (b.size || 5) + ' buổi' : 'tính theo số buổi đi học trong tháng'); }
  function stuOf(sid) { var r = null; clsList(true).some(function (cl) { return (cl.students || []).some(function (s) { if (s.id === sid) { r = { cl: cl, st: s }; return true; } return false; }); }); return r; }
  function report(cl, st, ym) { return K.monthReport(cl, cdata(cl.id), st, payOf(st.id), ym, today()); }
  function sessDone(s) { var td = today(); return s.date < td || (s.date === td && K.hm(s.start) <= nowHm()); }
  function refresh() { var y = window.scrollY, g = document.querySelector('.sh-wrap'), sx = g ? g.scrollLeft : 0; LN.adminRoute(location.hash.replace(/^#\/admin\/?/, '').split('/').filter(Boolean)); window.scrollTo(0, y); var g2 = document.querySelector('.sh-wrap'); if (g2 && sx) g2.scrollLeft = sx; }

  /* ---------- mã QR ---------- */
  function qrSvg(text, px) {
    try {
      var q = new window.QRCodeLib(-1, window.QRErrorCorrectLevel.M); q.addData(text); q.make();
      var n = q.getModuleCount(), m = 3, d = '';
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (q.isDark(r, c)) d += 'M' + (c + m) + ' ' + (r + m) + 'h1v1h-1z';
      return '<svg class="qr" width="' + px + '" height="' + px + '" viewBox="0 0 ' + (n + 2 * m) + ' ' + (n + 2 * m) + '" shape-rendering="crispEdges" role="img" aria-label="Mã QR chuyển khoản"><rect width="100%" height="100%" fill="#fff"/><path d="' + d + '" fill="#000"/></svg>';
    } catch (e) { return '<p class="small muted">Không tạo được mã QR</p>'; }
  }
  function payNote(st, ym) { return 'HP T' + (+ym.slice(5)) + ' ' + (st.user || uname(st.name)); }

  /* ================= Nhập dữ liệu từ file điểm danh (tự chạy 1 lần) ================= */
  function runSeed() {
    var S = window.LOP_SEED; if (!S) return null;
    var users = LN.users(), c = classes(), made = [], linked = [], clash = [];
    S.classes.forEach(function (x, i) {
      var cl = c[x.id];
      if (!cl) cl = c[x.id] = { id: x.id, name: x.name, grade: x.grade, color: x.color, price: x.price, billing: x.billing, slots: x.slots, order: i, created: Date.now(), students: [] };
      x.students.forEach(function (s) {
        var cur = cl.students.filter(function (y) { return y.id === s.id; })[0];
        if (!cur) { cur = { id: s.id, name: s.name, user: null, joined: s.joined }; cl.students.push(cur); }
        if (cur.user) return;
        var u = s.user, ex = users[u];
        if (ex && (ex.name || '').trim() === s.name.trim()) { cur.user = u; linked.push(u); return; }
        if (ex) { clash.push({ name: s.name, cls: x.name, user: u }); return; }
        users[u] = { name: s.name, grade: x.grade, pass: LN.hash(u + ':123456'), mail: '', created: Date.now(), last: 0, status: 'active', byAdmin: true, cls: x.id, joined: today() };
        cur.user = u; made.push(u);
      });
      var cd = cdata(x.id);
      Object.keys(x.att || {}).forEach(function (k) { cd.att[k] = Object.assign({}, x.att[k], cd.att[k] || {}); });
      Object.keys(x.off || {}).forEach(function (k) { if (cd.off[k] == null && !cd.att[k]) cd.off[k] = 'Lớp nghỉ'; });
      saveCd(x.id, cd);
    });
    store.set('ln_users', users); store.set('ln_classes', c);
    var rep = { at: Date.now(), made: made, linked: linked, clash: clash, renamed: S.renamed || [] };
    store.set('ln_seed_v', { v: S.v || 2, rep: rep }); return rep;
  }
  function ensureSeed() {
    var S = window.LOP_SEED, sv = store.get('ln_seed_v', null);
    if (!S || (sv && sv.v >= (S.v || 2))) return 'ok';
    if (LN.cloud && LN.cloud.on && !LN.cloud.pulled) { LN._waitPull = true; return 'wait'; }
    runSeed(); return 'ok';
  }

  /* ================= Bảng phụ (modal) ================= */
  function modal(html, cls) {
    closeModal(); var m = document.createElement('div'); m.className = 'lp-modal'; m.id = 'lp-modal';
    m.innerHTML = '<div class="lp-sheet ' + (cls || '') + '" role="dialog" aria-modal="true"><button class="lp-x" data-act="lp-close" aria-label="Đóng">✕</button>' + html + '</div>';
    m.addEventListener('click', function (e) { if (e.target === m) closeModal(); }); document.body.appendChild(m); document.body.classList.add('lp-noscroll');
    return m;
  }
  function closeModal() { var m = document.getElementById('lp-modal'); if (m) m.remove(); document.body.classList.remove('lp-noscroll'); }
  function field(id, label, input) { return '<div class="field"><label for="' + id + '">' + label + '</label>' + input + '</div>'; }

  /* ---- Điểm danh một buổi ---- */
  var SESS = null;
  function sessModal(cid, key) {
    var cl = classes()[cid]; if (!cl) return; var cd = cdata(cid), date = key.split('@')[0];
    var s = K.sessions(cl, cd, date, date).filter(function (x) { return x.key === key; })[0] || { key: key, date: date, start: key.split('@')[1], end: '', extra: true };
    var sts = (cl.students || []).filter(function (st) { return K.activeOn(st, date); }), row = cd.att[key] || {};
    var pres = sts.filter(function (st) { return row[st.id] === 1; }).length;
    SESS = { cid: cid, key: key };
    var h = '<div class="lp-mh" style="--c:' + esc(cl.color) + '"><span class="lp-dot"></span><div><h2>' + esc(cl.name) + '</h2><p>' + DOWS[K.dow(date)] + ', ' + dmyy(date) + ' · ' + K.timeTxt(s.start) + (s.end ? '–' + K.timeTxt(s.end) : '') + (s.extra ? ' · <b>buổi thêm</b>' : '') + '</p></div></div>';
    if (s.off) h += '<div class="note note-yel" style="margin:6px 0 12px">🚫 Buổi này <b>lớp nghỉ</b>' + (s.note && s.note !== 'Lớp nghỉ' ? ': ' + esc(s.note) : '') + ' – không tính học phí.</div><button class="btn btn-pink" data-act="lp-unoff">↩ Học lại buổi này</button>';
    else {
      h += '<div class="lp-mbar"><span><b>' + pres + '</b>/' + sts.length + ' có mặt</span><button class="btn btn-sm btn-mint" data-act="lp-allp">✅ Cả lớp có mặt</button></div>' +
        '<div class="lp-att">' + sts.map(function (st) {
          var v = row[st.id];
          return '<div class="lp-arow"><span class="lp-an">' + esc(st.name) + '</span><div class="lp-ab">' +
            [[1, '✅', 'Có mặt'], [0, '❌', 'Vắng'], [2, '🟡', 'Có phép']].map(function (o) { return '<button type="button" class="lp-b v' + o[0] + (v === o[0] ? ' on' : '') + '" data-act="lp-mark" data-s="' + esc(st.id) + '" data-v="' + o[0] + '" title="' + o[2] + '">' + o[1] + '<span>' + o[2] + '</span></button>'; }).join('') + '</div></div>';
        }).join('') + '</div><p class="tiny muted" style="margin-top:8px">Chỉ buổi ✅ có mặt được tính học phí.</p>';
    }
    h += '<details class="lp-more"><summary>Đổi buổi học…</summary><div class="lp-mf">' +
      (s.off ? '' : '<button class="btn btn-sm" data-act="lp-offform">🚫 Lớp nghỉ buổi này</button>') +
      '<button class="btn btn-sm" data-act="lp-moveform">🔁 Dời sang ngày khác</button>' +
      (s.extra ? '<button class="btn btn-sm btn-red" data-act="lp-delsess">🗑 Xoá buổi thêm này</button>' : '') + '</div><div id="lp-sub"></div></details>';
    modal(h);
  }

  /* ---- Thêm buổi học ---- */
  function addSessModal(cid) {
    var cl = classes()[cid], sl = (cl.slots || [])[0] || { start: '17:00', end: '18:30' };
    modal('<h2>＋ Thêm buổi học</h2><p class="muted">' + esc(cl.name) + ' – buổi học bù, học thêm… Buổi thêm được điểm danh và tính học phí như buổi thường.</p><form id="lp-addsess">' +
      '<div class="two">' + field('as-d', 'Ngày', '<input class="inp" type="date" id="as-d" name="d" value="' + today() + '" required>') + field('as-s', 'Bắt đầu', '<input class="inp" type="time" id="as-s" name="s" value="' + sl.start + '" required>') + field('as-e', 'Kết thúc', '<input class="inp" type="time" id="as-e" name="e" value="' + sl.end + '">') + '</div>' +
      field('as-n', 'Ghi chú (không bắt buộc)', '<input class="inp" id="as-n" name="n" placeholder="vd. Học bù buổi nghỉ lễ">') + '<button class="btn btn-lg btn-pink" type="submit">Thêm buổi</button></form>');
    document.getElementById('lp-addsess').addEventListener('submit', function (ev) {
      ev.preventDefault(); var f = ev.target, d = f.d.value, s = f.s.value; if (!d || !s) return;
      var cd = cdata(cid), k = d + '@' + s;
      if (K.sessions(cl, cd, d, d).some(function (x) { return x.key === k && !x.off; })) { toast('Đã có buổi học lúc này rồi.'); return; }
      delete cd.off[k]; cd.extra[k] = { end: f.e.value, note: f.n.value.trim() || 'Buổi thêm' }; saveCd(cid, cd);
      closeModal(); toast('Đã thêm buổi ' + dmyy(d)); LN.go('#/admin/lop/' + cid + '/' + K.ymOf(d));
      if (location.hash === '#/admin/lop/' + cid + '/' + K.ymOf(d)) refresh();
    });
  }

  /* ---- Thêm học sinh ---- */
  function addStuModal(cid) {
    var cl = classes()[cid];
    modal('<h2>＋ Thêm học sinh</h2><p class="muted">' + esc(cl.name) + '</p><form id="lp-addst">' + field('st-n', 'Họ tên', '<input class="inp" id="st-n" name="name" required autocomplete="off">') +
      '<div class="two">' + field('st-u', 'Tên đăng nhập', '<input class="inp" id="st-u" name="user" autocomplete="off" placeholder="tự tạo từ tên">') + field('st-j', 'Bắt đầu học từ', '<input class="inp" type="date" id="st-j" name="joined" value="' + today() + '">') + '</div>' +
      '<p class="tiny muted" id="st-hint">Mật khẩu: <b>123456</b></p><button class="btn btn-lg btn-pink" type="submit">Thêm vào lớp</button></form>');
    var f = document.getElementById('lp-addst'), touched = false, hint = document.getElementById('st-hint');
    function check() { var u = uname(f.user.value || f.name.value), ex = u && LN.users()[u]; hint.innerHTML = ex ? '⚠ <b>' + esc(u) + '</b> đã có (' + esc(ex.name) + ') – đề xuất <b>' + esc(u + (cl.grade < 100 ? cl.grade : '2')) + '</b>' : 'Tài khoản: <b>' + esc(u || '…') + '</b> · mật khẩu <b>123456</b>'; }
    f.user.addEventListener('input', function () { touched = true; check(); });
    f.name.addEventListener('input', function () { if (!touched) f.user.value = uname(f.name.value); check(); });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); var name = f.name.value.trim(), u = uname(f.user.value || name); if (!name) return;
      var all = LN.users();
      if (!/^[a-z0-9_]{3,20}$/.test(u)) { toast('Tên đăng nhập cần 3–20 chữ thường không dấu.'); return; }
      if (all[u]) { toast('“' + u + '” đã có người dùng. Thêm số lớp, vd. ' + u + (cl.grade < 100 ? cl.grade : '2')); return; }
      var c = classes()[cid], sid = cid + '-' + u;
      all[u] = { name: name, grade: c.grade, pass: LN.hash(u + ':123456'), mail: '', created: Date.now(), last: 0, status: 'active', byAdmin: true, cls: cid, joined: f.joined.value || today() };
      store.set('ln_users', all);
      c.students.push({ id: sid, name: name, user: u, joined: f.joined.value || today() }); saveCls(c);
      closeModal(); toast('Đã thêm ' + name + ' · ' + u + ' / 123456'); refresh();
    });
    setTimeout(function () { f.name.focus(); }, 50);
  }

  /* ---- Danh sách tài khoản ---- */
  function accModal(cid) {
    var list = cid ? [classes()[cid]] : clsList();
    var txt = '';
    var h = '<h2>🔑 Tài khoản học sinh</h2><p class="muted">Vào web → <b>Đăng nhập</b>. Mật khẩu chung: <b>123456</b> (các bé tự đổi được).</p>' + list.map(function (cl) {
      txt += cl.name + '\n';
      return '<h3 style="margin:14px 0 6px">' + esc(cl.name) + '</h3><table class="tbl acc-t"><tbody>' + cl.students.filter(function (s) { return !s.left; }).map(function (s) {
        txt += '- ' + s.name + ': ' + (s.user || '(chưa có)') + ' / 123456\n';
        return '<tr><td>' + esc(s.name) + '</td><td>' + (s.user ? '<code>' + esc(s.user) + '</code>' : '<span style="color:var(--red-dk)">chưa có</span>') + '</td><td><code>123456</code></td></tr>';
      }).join('') + '</tbody></table>';
    }).join('') + '<p style="margin-top:14px"><button class="btn btn-pink" data-act="lp-copytxt">📋 Sao chép danh sách</button></p>';
    var m = modal(h); m.querySelector('[data-act=lp-copytxt]').setAttribute('data-t', txt);
  }

  /* ---- Học sinh: thông tin, buổi học, học phí, đóng tiền ---- */
  var DRAWER = null;
  function stuModal(sid, ym) {
    var x = stuOf(sid); if (!x) return; var cl = x.cl, st = x.st;
    ym = ym || K.ymOf(today()); DRAWER = { sid: sid, ym: ym };
    var R = report(cl, st, ym), u = st.user && LN.users()[st.user], sess = R.sessions;
    function list(v) { return sess.filter(function (s) { return s.v === v; }).map(function (s) { return dmy(s.date); }).join(', ') || '—'; }
    var h = '<div class="lp-mh" style="--c:' + esc(cl.color) + '"><span class="lp-dot"></span><div><h2>' + esc(st.name) + '</h2><p>' + esc(cl.name) + (st.left ? ' · <b>đã nghỉ từ ' + dmyy(st.left) + '</b>' : '') + '</p></div></div>' +
      '<div class="dr-acc">' + (st.user ? '👤 Tài khoản <b>' + esc(st.user) + '</b> · mật khẩu mặc định 123456' + (u ? '' : ' <span style="color:var(--red-dk)">(không tìm thấy)</span>') + ' <button class="lnk" data-act="lp-resetpw">Đặt lại 123456</button>' : '⚠ Chưa có tài khoản <button class="lnk" data-act="lp-mkacc">Tạo tài khoản</button>') + '</div>' +
      '<div class="dr-mnav"><button class="btn btn-sm" data-act="lp-dym" data-m="' + K.ymAdd(ym, -1) + '">‹</button><b>' + ymTxt(ym) + '</b><button class="btn btn-sm" data-act="lp-dym" data-m="' + K.ymAdd(ym, 1) + '">›</button></div>' +
      '<div class="dr-att"><div class="p"><b>' + R.count.p + '</b> có mặt<small>' + list(1) + '</small></div><div class="a"><b>' + R.count.a + '</b> vắng<small>' + list(0) + '</small></div><div class="e"><b>' + R.count.e + '</b> có phép<small>' + list(2) + '</small></div></div>' +
      feeTable(cl, st, R) +
      '<div class="dr-acts"><button class="btn btn-mint" data-act="lp-payform">＋ Ghi nhận đóng tiền</button><a class="btn" href="#/admin/phieu/' + esc(cl.id) + '/' + ym + '/' + esc(sid) + '">📄 Phiếu báo ' + mTxt(ym) + '</a></div><div id="lp-sub"></div>';
    var P = payOf(sid).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    h += '<h3 class="dr-h">Lịch sử đóng tiền</h3>' + (P.length ? '<div class="dr-pays">' + P.map(function (p) { return '<div><span>' + dmyy(p.date) + '</span><b>' + money(p.amount) + '</b><span class="muted small">' + esc(p.method || '') + (p.note ? ' · ' + esc(p.note) : '') + '</span><button class="lnk" data-act="lp-delpay" data-id="' + esc(p.id) + '" aria-label="Xoá lần đóng này">✕</button></div>'; }).join('') + '</div>' : '<p class="muted small">Chưa có lần đóng tiền nào.</p>');
    var rows = R.L.rows.slice().reverse();
    if (rows.length > 1) h += '<h3 class="dr-h">Các kỳ học phí</h3><table class="tbl dr-hist"><thead><tr><th>Kỳ</th><th>Phải đóng</th><th>Đã đóng</th><th>Còn</th></tr></thead><tbody>' + rows.map(function (r) { return '<tr><td>' + esc(r.label) + '</td><td>' + money(r.amount) + '</td><td>' + money(r.paid) + '</td><td>' + (r.rem > 0 ? '<b class="neg">' + money(r.rem) + '</b>' : '✓') + '</td></tr>'; }).join('') + '</tbody></table>';
    h += '<details class="lp-more"><summary>Sửa thông tin học sinh…</summary><form id="lp-editst" class="lp-sub">' +
      '<div class="two">' + field('es-n', 'Họ tên', '<input class="inp" id="es-n" name="name" value="' + esc(st.name) + '">') + field('es-p', 'Học phí riêng/buổi (trống = giá lớp)', '<input class="inp" type="number" step="5000" id="es-p" name="price" value="' + (st.price || '') + '" placeholder="' + K.priceOf(cl, null, today()) + '">') + '</div>' +
      '<button class="btn btn-sm btn-pink" type="submit">Lưu</button> ' + (st.left ? '<button class="btn btn-sm" type="button" data-act="lp-back">↩ Học lại</button>' : '<button class="btn btn-sm" type="button" data-act="lp-leave">Cho nghỉ học từ hôm nay</button>') + '</form></details>';
    modal(h, 'wide');
    var fe = document.getElementById('lp-editst');
    fe.addEventListener('submit', function (ev) {
      ev.preventDefault(); var c = classes()[cl.id];
      c.students.forEach(function (s) { if (s.id === sid) { s.name = fe.name.value.trim() || s.name; if (+fe.price.value) s.price = +fe.price.value; else delete s.price; } });
      saveCls(c); toast('Đã lưu'); refresh(); stuModal(sid, ym);
    });
  }
  function feeTable(cl, st, R) {
    var pack = (cl.billing || {}).mode === 'pack', rows = '';
    R.cur.forEach(function (r) { rows += '<tr><td>' + (pack ? esc(r.label) + ' · ' + r.size + ' × ' + money(r.price) : 'Học phí ' + mTxt(R.ym) + ' · ' + r.n + ' buổi × ' + money(r.price)) + '</td><td>' + money(r.amount) + '</td></tr>'; });
    if (!R.cur.length) rows += '<tr><td>Học phí ' + mTxt(R.ym) + (pack ? ' · chưa đủ gói' : ' · 0 buổi') + '</td><td>0đ</td></tr>';
    if (R.feePaid) rows += '<tr><td>Đã đóng cho ' + (pack ? 'gói này' : mTxt(R.ym)) + '</td><td>−' + money(R.feePaid) + '</td></tr>';
    R.old.forEach(function (r) { rows += '<tr class="old"><td>Còn nợ ' + esc(r.label.toLowerCase()) + ' (cộng dồn)</td><td>+' + money(r.rem) + '</td></tr>'; });
    return '<table class="fee-t"><tbody>' + rows + '</tbody><tfoot><tr><td>Còn phải đóng' + (R.due && R.total > 0 ? '<small>Hạn ' + dmyy(R.due) + '</small>' : '') + '</td><td>' + (R.total > 0 ? money(R.total) : '<span class="ok">Đã đủ ✓</span>') + '</td></tr></tfoot></table>' +
      (R.credit ? '<p class="small" style="color:var(--mint-dk)">Đóng dư ' + money(R.credit) + ' – tự trừ vào tháng sau.</p>' : '') +
      (R.progress ? '<p class="small muted">📦 Gói đang học: ' + R.progress.done + '/' + R.progress.size + ' buổi</p>' : '');
  }
  function payForm(sid, amt) {
    var sub = document.getElementById('lp-sub'); if (!sub) return;
    sub.innerHTML = '<form id="lp-payf" class="lp-sub"><div class="two">' + field('pf-a', 'Số tiền thực nhận', '<input class="inp" type="number" step="1000" min="1000" id="pf-a" name="amount" value="' + (amt > 0 ? amt : '') + '" required>') + field('pf-d', 'Ngày nhận', '<input class="inp" type="date" id="pf-d" name="date" value="' + today() + '">') + '</div>' +
      '<div class="two">' + field('pf-m', 'Hình thức', '<select class="sel" id="pf-m" name="method"><option>Chuyển khoản</option><option>Tiền mặt</option></select>') + field('pf-n', 'Ghi chú', '<input class="inp" id="pf-n" name="note" placeholder="vd. hẹn đóng nốt tuần sau">') + '</div>' +
      '<p class="tiny muted">Đóng thiếu cứ ghi đúng số đã nhận – phần còn lại tự cộng vào tháng sau. Tiền trừ vào kỳ cũ nhất trước.</p><button class="btn btn-pink" type="submit">Lưu</button></form>';
    var f = document.getElementById('lp-payf'); f.amount.focus();
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); var a = +f.amount.value; if (!(a > 0)) return;
      var P = pays(); P[sid] = P[sid] || []; P[sid].push({ id: 'p' + Date.now().toString(36), date: f.date.value || today(), amount: a, method: f.method.value, note: f.note.value.trim(), at: Date.now() });
      store.set('ln_pay', P); toast('Đã ghi nhận ' + money(a)); refresh(); stuModal(sid, DRAWER && DRAWER.ym);
    });
  }

  /* ================= Trang chủ: Lớp học ================= */
  function viewHome() {
    if (ensureSeed() === 'wait') { shell('lop', '<div class="card"><p class="muted">Đang tải dữ liệu lớp học…</p></div>'); return; }
    var td = today(), ym = K.ymOf(td), cls = clsList(), sv = store.get('ln_seed_v', null), todays = [];
    var body = '<div class="ad-h"><div><h1>Lớp học</h1><p class="muted">' + DOWS[K.dow(td)] + ', ' + dmyy(td) + '</p></div><button class="btn btn-sm" data-act="lp-acc">🔑 Tài khoản học sinh</button></div>';
    if (sv && sv.rep && !sv.seen) {
      var rp = sv.rep;
      body += '<div class="card lp-rep"><h2>✅ Đã nhập dữ liệu từ file điểm danh</h2><p>Tạo mới <b>' + rp.made.length + '</b> tài khoản' + (rp.linked.length ? ', giữ nguyên <b>' + rp.linked.length + '</b> tài khoản đã có' : '') + '. Mật khẩu chung <b>123456</b>.</p>' +
        (rp.renamed.length ? '<p class="small">Bạn trùng tên được đặt theo lớp: ' + rp.renamed.map(function (r) { return esc(r[0]) + ' (' + esc(r[1]) + ') → <code>' + esc(r[2]) + '</code>'; }).join(' · ') + '</p>' : '') +
        (rp.clash.length ? '<p class="small" style="color:var(--red-dk)">⚠ Chưa tạo được (tên đã thuộc người khác): ' + rp.clash.map(function (r) { return esc(r.name) + ' (' + esc(r.cls) + ') – ' + esc(r.user); }).join(', ') + '</p>' : '') +
        '<p style="margin-top:10px"><button class="btn btn-sm btn-pink" data-act="lp-acc">Xem danh sách tài khoản</button> <button class="btn btn-sm" data-act="lp-seen">Đã xem</button></p></div>';
    }
    var rows = cls.map(function (cl) {
      var cd = cdata(cl.id), ms = K.monthSessions(cl, cd, ym), sts = curStudents(cl, ym), miss = 0, fee = 0, paid = 0, owe = 0;
      ms.forEach(function (s) {
        if (s.date === td) todays.push({ cl: cl, s: s, cd: cd });
        if (s.off || !sessDone(s)) return; var r = cd.att[s.key] || {};
        if (sts.some(function (st) { return K.activeOn(st, s.date) && r[st.id] == null; })) miss++;
      });
      sts.forEach(function (st) { var R = report(cl, st, ym); fee += R.fee; paid += R.feePaid; if (R.total > 0) owe++; });
      return '<a class="cl-row" href="#/admin/lop/' + esc(cl.id) + '" style="--c:' + esc(cl.color) + '"><span class="cl-bar"></span><div class="cl-main"><b>' + esc(cl.name) + '</b><span>' + esc(schedTxt(cl)) + '</span></div>' +
        '<div class="cl-side"><span>' + sts.filter(function (s) { return !s.left; }).length + ' HS</span>' + (miss ? '<span class="warn">⚠ ' + miss + ' buổi chưa điểm danh</span>' : '') + '<span class="small muted">Thu ' + mTxt(ym) + ': ' + money(paid) + ' / ' + money(fee) + '</span></div><span class="cl-go">›</span></a>';
    }).join('');
    body += '<h2 class="ad-sh">Buổi học hôm nay</h2>' + (todays.length ? '<div class="td-list">' + todays.sort(function (a, b) { return K.hm(a.s.start) - K.hm(b.s.start); }).map(function (it) {
      var sts = it.cl.students.filter(function (st) { return K.activeOn(st, it.s.date); }), r = it.cd.att[it.s.key] || {}, mk = sts.filter(function (st) { return r[st.id] != null; }).length, pr = sts.filter(function (st) { return r[st.id] === 1; }).length;
      return '<button type="button" class="td-b' + (it.s.off ? ' off' : '') + '" style="--c:' + esc(it.cl.color) + '" data-act="lp-sess" data-c="' + esc(it.cl.id) + '" data-k="' + esc(it.s.key) + '"><b>' + K.timeTxt(it.s.start) + '</b><span>' + esc(it.cl.name) + '</span><small>' + (it.s.off ? 'Lớp nghỉ' : mk >= sts.length && sts.length ? '✅ ' + pr + '/' + sts.length + ' có mặt' : 'Bấm để điểm danh') + '</small></button>';
    }).join('') + '</div>' : '<p class="muted">Hôm nay không có buổi học nào.</p>');
    body += '<h2 class="ad-sh">Các lớp</h2><div class="cl-list">' + (rows || '<p class="muted">Chưa có lớp nào.</p>') + '</div><p style="margin-top:14px"><button class="btn btn-sm" data-act="lp-newcls">＋ Thêm lớp mới</button></p>';
    var arch = clsList(true).filter(function (c) { return c.archived; });
    if (arch.length) body += '<details style="margin-top:12px"><summary class="muted small">Lớp đã lưu trữ (' + arch.length + ')</summary>' + arch.map(function (c) { return '<p><a href="#/admin/lop/' + esc(c.id) + '">' + esc(c.name) + '</a></p>'; }).join('') + '</details>';
    shell('lop', body);
  }

  /* ================= Bảng tính của một lớp ================= */
  function viewClass(cid, ym) {
    if (ensureSeed() === 'wait') { shell('lop', '<div class="card"><p class="muted">Đang tải dữ liệu lớp học…</p></div>'); return; }
    var cl = classes()[cid]; if (!cl) { LN.go('#/admin'); return; }
    if (ym === 'set') return viewClassSet(cl);
    ym = /^\d{4}-\d{2}$/.test(ym || '') ? ym : K.ymOf(today());
    var cd = cdata(cid), td = today(), ss = K.monthSessions(cl, cd, ym), sts = curStudents(cl, ym), pack = (cl.billing || {}).mode === 'pack';
    var head = '<a href="#/admin" class="backlink">← Các lớp</a><div class="sh-hero" style="--c:' + esc(cl.color) + '"><div><h1>' + esc(cl.name) + '</h1><p>🗓 ' + esc(schedTxt(cl)) + '</p><p>💰 ' + esc(ruleTxt(cl)) + '</p></div><a class="btn btn-sm" href="#/admin/lop/' + esc(cid) + '/set">⚙ Lịch & học phí</a></div>';
    var bar = '<div class="sh-bar"><div class="sh-mnav"><a class="btn btn-sm" href="#/admin/lop/' + esc(cid) + '/' + K.ymAdd(ym, -1) + '" aria-label="Tháng trước">‹</a><h2>' + ymTxt(ym) + '</h2><a class="btn btn-sm" href="#/admin/lop/' + esc(cid) + '/' + K.ymAdd(ym, 1) + '" aria-label="Tháng sau">›</a></div>' +
      '<div class="sh-tools"><button class="btn btn-sm" data-act="lp-addsess" data-c="' + esc(cid) + '">＋ Thêm buổi</button><button class="btn btn-sm" data-act="lp-addst" data-c="' + esc(cid) + '">＋ Học sinh</button><a class="btn btn-sm btn-pink" href="#/admin/phieu/' + esc(cid) + '/' + ym + '">📄 Phiếu báo ' + mTxt(ym) + '</a></div></div>';
    var T = { n: 0, fee: 0, old: 0, paid: 0, tot: 0 };
    var table = !sts.length ? '<p class="muted">Chưa có học sinh. Bấm “＋ Học sinh”.</p>' : '<div class="sh-wrap"><table class="sh"><thead><tr><th class="nm">Học sinh</th>' + ss.map(function (s) {
      return '<th class="d' + (s.off ? ' off' : '') + (s.date === td ? ' td' : '') + (s.extra ? ' ex' : '') + '"><button type="button" data-act="lp-sess" data-c="' + esc(cid) + '" data-k="' + esc(s.key) + '" title="Điểm danh cả buổi / đổi buổi">' + DOWS_S[K.dow(s.date)] + '<b>' + dmy(s.date) + '</b>' + (s.off ? '<i>nghỉ</i>' : s.extra ? '<i>thêm</i>' : '') + '</button></th>';
    }).join('') + '<th class="sm">Buổi</th><th class="sm">' + (pack ? 'Gói đến hạn' : 'Học phí') + '</th><th class="sm">Nợ trước</th><th class="sm">Đã đóng</th><th class="sm tot">Còn phải đóng</th></tr></thead><tbody>' +
      sts.map(function (st) {
        var R = report(cl, st, ym);
        var cells = ss.map(function (s) {
          if (!K.activeOn(st, s.date)) return '<td class="na"></td>';
          if (s.off) return '<td class="off"></td>';
          var v = K.mark(cd, s.key, st.id);
          return '<td><button type="button" class="lp-c v' + (v == null ? 'n' : v) + (v == null && sessDone(s) ? ' miss' : '') + '" data-act="lp-cell" data-c="' + esc(cid) + '" data-k="' + esc(s.key) + '" data-s="' + esc(st.id) + '" aria-label="' + esc(st.name) + ' ' + dmy(s.date) + '">' + (v === 1 ? '1' : v === 0 ? '0' : v === 2 ? 'P' : '') + '</button></td>';
        }).join('');
        T.n += R.count.p; T.fee += R.fee; T.old += R.oldRem; T.paid += R.feePaid; T.tot += R.total;
        return '<tr><th class="nm"><button type="button" class="nm-b" data-act="lp-stu" data-s="' + esc(st.id) + '" data-m="' + ym + '">' + esc(st.name) + (st.user ? '' : ' <span class="tag tag-yel">!</span>') + '</button></th>' + cells +
          '<td class="sm"><b>' + R.count.p + '</b></td><td class="sm">' + money(R.fee) + '</td><td class="sm">' + (R.oldRem ? '<span class="neg">' + money(R.oldRem) + '</span>' : '–') + '</td><td class="sm">' + (R.feePaid ? money(R.feePaid) : '–') + '</td><td class="sm tot">' + (R.total > 0 ? '<b class="neg">' + money(R.total) + '</b>' : '<span class="ok">✓</span>') + '</td></tr>';
      }).join('') + '</tbody><tfoot><tr><th class="nm">Tổng</th>' + ss.map(function () { return '<td></td>'; }).join('') + '<td class="sm"><b>' + T.n + '</b></td><td class="sm"><b>' + money(T.fee) + '</b></td><td class="sm">' + money(T.old) + '</td><td class="sm">' + money(T.paid) + '</td><td class="sm tot"><b>' + money(T.tot) + '</b></td></tr></tfoot></table></div>' +
      '<p class="sh-legend"><span class="lp-c v1">1</span> có mặt (tính tiền) <span class="lp-c v0">0</span> vắng <span class="lp-c v2">P</span> có phép <span class="lp-c vn miss"></span> chưa điểm danh · Bấm ô để đổi, bấm <b>ngày</b> để điểm danh cả buổi, bấm <b>tên</b> để xem chi tiết & thu tiền.</p>';
    if (!ss.length && sts.length) table = '<p class="muted">' + ymTxt(ym) + ' chưa có buổi học nào theo lịch.</p>' + table;
    shell('lop', head + '<div class="card sh-card">' + bar + table + '</div>');
  }

  /* ---- Cài đặt lớp: lịch cố định, học phí, học sinh ---- */
  function slotRow(s) {
    s = s || { dow: 1, start: '17:00', end: '18:30' };
    return '<div class="lp-slot"><select class="sel" name="dow" aria-label="Thứ">' + [1, 2, 3, 4, 5, 6, 0].map(function (d) { return '<option value="' + d + '"' + (+s.dow === d ? ' selected' : '') + '>' + DOWS[d] + '</option>'; }).join('') + '</select><input class="inp" type="time" name="start" value="' + esc(s.start) + '" aria-label="Bắt đầu"><span>→</span><input class="inp" type="time" name="end" value="' + esc(s.end) + '" aria-label="Kết thúc"><button type="button" class="btn btn-sm" data-act="lp-delslot" aria-label="Xoá">✕</button></div>';
  }
  function viewClassSet(cl) {
    var td = today(), b = cl.billing || {}, m1 = K.ymOf(td) + '-01', price = K.priceOf(cl, null, td);
    var body = '<a href="#/admin/lop/' + esc(cl.id) + '" class="backlink">← Bảng ' + esc(cl.name) + '</a><h1>' + esc(cl.name) + ' · Lịch & học phí</h1>' +
      '<div class="card"><h2>🗓 Lịch học cố định</h2><p class="small muted">Lịch các tháng sau tự điền theo lịch này. Đổi lịch chỉ áp dụng từ ngày cô chọn – các tháng trước giữ nguyên.</p>' +
      '<form id="lp-sched"><div id="lp-slots">' + (cl.slots || []).filter(function (s) { return !s.to || s.to >= td; }).map(slotRow).join('') + '</div><button type="button" class="btn btn-sm" data-act="lp-addslot">＋ Thêm buổi trong tuần</button>' +
      '<div class="two" style="margin-top:12px;align-items:end">' + field('sc-f', 'Áp dụng từ ngày', '<input class="inp" type="date" id="sc-f" name="from" value="' + td + '">') + '<div><button class="btn btn-pink" type="submit">Lưu lịch</button></div></div></form></div>' +
      '<div class="card"><h2>💰 Học phí</h2><form id="lp-fee"><div class="two">' + field('fe-p', 'Học phí mỗi buổi (đ)', '<input class="inp" type="number" step="5000" id="fe-p" name="price" value="' + price + '">') + field('fe-f', 'Giá mới áp dụng từ', '<input class="inp" type="date" id="fe-f" name="from" value="' + m1 + '">') + '</div>' +
      '<div class="two">' + field('fe-m', 'Cách thu', '<select class="sel" id="fe-m" name="mode"><option value="month"' + (b.mode !== 'pack' ? ' selected' : '') + '>Theo tháng: số buổi đi học × giá</option><option value="pack"' + (b.mode === 'pack' ? ' selected' : '') + '>Theo gói nhiều buổi</option></select>') +
      field('fe-d', 'Hạn đóng (theo tháng): ngày … tháng sau', '<input class="inp" type="number" min="1" max="28" id="fe-d" name="dueDay" value="' + (b.dueDay || 5) + '">') + '</div>' +
      '<div class="two pk"' + (b.mode === 'pack' ? '' : ' hidden') + '>' + field('fe-s', 'Số buổi mỗi gói', '<input class="inp" type="number" min="1" id="fe-s" name="size" value="' + (b.size || 5) + '">') + field('fe-w', 'Thu tiền gói', '<select class="sel" id="fe-w" name="when"><option value="after"' + (b.when !== 'before' ? ' selected' : '') + '>Sau khi học xong gói</option><option value="before"' + (b.when === 'before' ? ' selected' : '') + '>Ngay buổi đầu của gói</option></select>') + field('fe-g', 'Hạn: số ngày sau đó', '<input class="inp" type="number" min="0" id="fe-g" name="grace" value="' + (b.grace || 0) + '">') + '</div>' +
      '<button class="btn btn-pink" type="submit">Lưu học phí</button></form>' +
      ((cl.prices || []).length ? '<p class="tiny muted" style="margin-top:8px">Lịch sử giá: ' + money(cl.price) + ' ban đầu' + cl.prices.map(function (p) { return ' → ' + money(p.price) + ' từ ' + dmyy(p.from); }).join('') + '</p>' : '') + '</div>' +
      '<div class="card"><h2>👧 Học sinh</h2>' + (cl.students || []).map(function (st) { return '<div class="lp-srow' + (st.left ? ' left' : '') + '"><button class="nm-b" data-act="lp-stu" data-s="' + esc(st.id) + '">' + esc(st.name) + '</button><span class="small muted">' + (st.user ? esc(st.user) : 'chưa có tài khoản') + (st.price ? ' · giá riêng ' + money(st.price) : '') + (st.left ? ' · đã nghỉ ' + dmyy(st.left) : '') + '</span></div>'; }).join('') +
      '<p style="margin-top:10px"><button class="btn btn-sm" data-act="lp-addst" data-c="' + esc(cl.id) + '">＋ Thêm học sinh</button></p></div>' +
      '<div class="card"><h2>Khác</h2><form id="lp-info"><div class="two">' + field('in-n', 'Tên lớp', '<input class="inp" id="in-n" name="name" value="' + esc(cl.name) + '">') + field('in-c', 'Màu', '<input class="inp" type="color" id="in-c" name="color" value="' + esc(cl.color || '#FF5C9A') + '">') + field('in-g', 'Bài học trên app', '<select class="sel" id="in-g" name="grade">' + LN.gradeOpts(cl.grade) + '</select>') + '</div>' +
      '<button class="btn btn-pink" type="submit">Lưu</button> <button class="btn" type="button" data-act="lp-archive" data-c="' + esc(cl.id) + '">' + (cl.archived ? 'Bỏ lưu trữ' : 'Lưu trữ lớp (ẩn đi)') + '</button></form></div>';
    shell('lop', body);
    var f1 = document.getElementById('lp-sched');
    f1.addEventListener('submit', function (ev) {
      ev.preventDefault(); var from = f1.from.value || today();
      var ns = [].slice.call(f1.querySelectorAll('.lp-slot')).map(function (r) { return { dow: +r.querySelector('[name=dow]').value, start: r.querySelector('[name=start]').value, end: r.querySelector('[name=end]').value, from: from, to: null }; }).filter(function (s) { return s.start; });
      var c = classes()[cl.id], prev = K.addDays(from, -1);
      c.slots = (c.slots || []).filter(function (s) { return !(s.from && s.from >= from); }).map(function (s) { if (!s.to || s.to >= from) s.to = prev; return s; }).filter(function (s) { return !s.from || s.from <= s.to; }).concat(ns);
      saveCls(c); toast('Đã lưu lịch, áp dụng từ ' + dmyy(from)); viewClassSet(c);
    });
    var f2 = document.getElementById('lp-fee');
    f2.mode.addEventListener('change', function () { f2.querySelector('.pk').hidden = f2.mode.value !== 'pack'; });
    f2.addEventListener('submit', function (ev) {
      ev.preventDefault(); var c = classes()[cl.id], np = +f2.price.value || 0, from = f2.from.value || m1;
      if (np !== K.priceOf(c, null, from)) { c.prices = (c.prices || []).filter(function (p) { return p.from < from; }); c.prices.push({ from: from, price: np }); }
      c.billing = { mode: f2.mode.value, size: +f2.size.value || 5, dueDay: +f2.dueDay.value || 5, grace: +f2.grace.value || 0, when: f2.when.value };
      saveCls(c); toast('Đã lưu học phí'); viewClassSet(c);
    });
    var f3 = document.getElementById('lp-info');
    f3.addEventListener('submit', function (ev) { ev.preventDefault(); var c = classes()[cl.id]; c.name = f3.name.value.trim() || c.name; c.color = f3.color.value; c.grade = +f3.grade.value; saveCls(c); toast('Đã lưu'); viewClassSet(c); });
  }

  /* ================= Học phí tất cả các lớp ================= */
  var ONLY_DEBT = false;
  function viewHocPhi(ym) {
    if (ensureSeed() === 'wait') { shell('hocphi', '<div class="card"><p class="muted">Đang tải…</p></div>'); return; }
    ym = /^\d{4}-\d{2}$/.test(ym || '') ? ym : K.ymOf(today());
    var S = { fee: 0, paid: 0, tot: 0, n: 0 };
    var sec = clsList().map(function (cl) {
      var rows = curStudents(cl, ym).map(function (st) { var R = report(cl, st, ym); S.fee += R.fee; S.paid += R.feePaid; S.tot += R.total; if (R.total > 0) S.n++; return { st: st, R: R }; })
        .filter(function (x) { return !ONLY_DEBT || x.R.total > 0; });
      if (!rows.length) return '';
      return '<div class="card hp-c" style="--c:' + esc(cl.color) + '"><div class="hp-h"><h2><span class="lp-dot"></span>' + esc(cl.name) + '</h2><a class="btn btn-sm" href="#/admin/phieu/' + esc(cl.id) + '/' + ym + '">📄 Phiếu cả lớp</a></div><div class="tblw"><table class="tbl hp-t"><thead><tr><th>Học sinh</th><th>Buổi</th><th>Học phí ' + mTxt(ym) + '</th><th>Nợ trước</th><th>Đã đóng</th><th>Còn phải đóng</th><th></th></tr></thead><tbody>' +
        rows.map(function (x) {
          var R = x.R, od = R.total > 0 && R.due && today() > R.due;
          return '<tr><td><button class="nm-b" data-act="lp-stu" data-s="' + esc(x.st.id) + '" data-m="' + ym + '">' + esc(x.st.name) + '</button></td><td>' + R.count.p + '</td><td>' + money(R.fee) + '</td><td>' + (R.oldRem ? '<span class="neg">' + money(R.oldRem) + '</span>' : '–') + '</td><td>' + (R.feePaid ? money(R.feePaid) : '–') + '</td>' +
            '<td>' + (R.total > 0 ? '<b class="neg">' + money(R.total) + '</b>' + (od ? ' <span class="tag tag-red">quá hạn</span>' : '') : '<span class="ok">Đủ ✓</span>') + '</td>' +
            '<td class="hp-a"><button class="btn btn-sm btn-mint" data-act="lp-pay" data-s="' + esc(x.st.id) + '" data-m="' + ym + '">＋ Thu</button><a class="btn btn-sm" href="#/admin/phieu/' + esc(cl.id) + '/' + ym + '/' + esc(x.st.id) + '" title="Phiếu báo">📄</a></td></tr>';
        }).join('') + '</tbody></table></div></div>';
    }).join('');
    var body = '<div class="ad-h"><div><h1>Học phí</h1><p class="muted">Học phí tháng = số buổi có mặt × giá. Tháng trước còn thiếu thì tự cộng dồn sang.</p></div>' +
      '<div class="sh-mnav"><a class="btn btn-sm" href="#/admin/hocphi/' + K.ymAdd(ym, -1) + '" aria-label="Tháng trước">‹</a><h2>' + ymTxt(ym) + '</h2><a class="btn btn-sm" href="#/admin/hocphi/' + K.ymAdd(ym, 1) + '" aria-label="Tháng sau">›</a></div></div>' +
      '<div class="hp-stats"><div><span>Học phí ' + mTxt(ym) + '</span><b>' + money(S.fee) + '</b></div><div><span>Đã thu</span><b class="ok">' + money(S.paid) + '</b></div><div><span>Còn phải thu (gồm nợ cũ)</span><b class="neg">' + money(S.tot) + '</b><small>' + S.n + ' học sinh</small></div></div>' +
      '<div class="hp-f"><label class="chk" style="margin:0"><input type="checkbox" data-act="lp-onlydebt"' + (ONLY_DEBT ? ' checked' : '') + '><span>Chỉ hiện bạn còn phải đóng</span></label><button class="btn btn-sm" data-act="lp-csv" data-m="' + ym + '">⬇ Xuất Excel</button></div>' +
      (sec || '<p class="muted">Không có học sinh nào.</p>');
    shell('hocphi', body);
  }
  function exportCsv(ym) {
    var rows = [['Lớp', 'Học sinh', 'Tài khoản', 'Số buổi có mặt', 'Vắng', 'Có phép', 'Học phí tháng', 'Nợ trước', 'Đã đóng', 'Còn phải đóng', 'Hạn']];
    clsList().forEach(function (cl) { curStudents(cl, ym).forEach(function (st) { var R = report(cl, st, ym); rows.push([cl.name, st.name, st.user || '', R.count.p, R.count.a, R.count.e, R.fee, R.oldRem, R.feePaid, R.total, R.due ? dmyy(R.due) : '']); }); });
    var csv = '﻿' + rows.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'hoc-phi-' + ym + '.csv'; document.body.appendChild(a); a.click(); a.remove();
  }

  /* ================= Phiếu báo học phí gửi phụ huynh ================= */
  function phieuHtml(cl, st, ym) {
    var R = report(cl, st, ym), B = bank(), pack = (cl.billing || {}).mode === 'pack', note = payNote(st, ym);
    var qr = B.qr && K.qrValid(B.qr) ? (B.amt ? K.vietqr(B.qr, R.total, note) : B.qr) : '';
    var chips = R.sessions.filter(function (s) { return s.v != null || s.date <= today(); }).map(function (s) { var t = s.off ? ['off', '–'] : s.v === 1 ? ['p', '✓'] : s.v === 0 ? ['a', '✗'] : s.v === 2 ? ['e', 'P'] : ['n', '·']; return '<span class="rp-s ' + t[0] + '"><i>' + t[1] + '</i>' + DOWS_S[K.dow(s.date)] + ' ' + dmy(s.date) + '</span>'; }).join('');
    var lines = '';
    R.cur.forEach(function (r) { lines += '<tr><td>' + (pack ? esc(r.label) + ': ' + r.size + ' buổi × ' + money(r.price) : 'Học phí ' + mTxt(ym) + ': ' + r.n + ' buổi × ' + money(r.price)) + '</td><td>' + money(r.amount) + '</td></tr>'; });
    if (!R.cur.length) lines += '<tr><td>Học phí ' + mTxt(ym) + (pack ? ' (chưa đủ gói)' : ': 0 buổi') + '</td><td>0đ</td></tr>';
    if (R.feePaid) lines += '<tr><td>Đã đóng</td><td>−' + money(R.feePaid) + '</td></tr>';
    R.old.forEach(function (r) { lines += '<tr class="old"><td>Còn thiếu ' + esc(r.label.toLowerCase()) + ' (cộng dồn)</td><td>+' + money(r.rem) + '</td></tr>'; });
    return '<article class="rp" id="rp-' + esc(st.id) + '" style="--c:' + esc(cl.color) + '">' +
      '<header class="rp-h">' + LN.logo(44) + '<div><b>AURORA ENGLISH</b><span>Phiếu báo học tập & học phí</span></div><em>' + ymTxt(ym) + '</em></header>' +
      '<div class="rp-who"><div><span>Học sinh</span><b>' + esc(st.name) + '</b></div><div><span>Lớp</span><b>' + esc(cl.name) + '</b></div></div>' +
      '<h3>Điểm danh</h3><p class="rp-cnt">Có mặt <b>' + R.count.p + '</b> · Vắng <b>' + R.count.a + '</b> · Có phép <b>' + R.count.e + '</b></p><div class="rp-ss">' + (chips || '<span class="muted small">Chưa có buổi học</span>') + '</div>' +
      (R.progress ? '<p class="small">Gói đang học: ' + R.progress.done + '/' + R.progress.size + ' buổi</p>' : '') +
      '<h3>Học phí</h3><table class="rp-t"><tbody>' + lines + '</tbody><tfoot><tr><td>TỔNG CẦN ĐÓNG' + (R.total > 0 && R.due ? '<small>Hạn đóng: ' + dmyy(R.due) + '</small>' : '') + '</td><td>' + (R.total > 0 ? money(R.total) : 'Đã đủ ✓') + '</td></tr></tfoot></table>' +
      (R.credit ? '<p class="small">Phụ huynh đã đóng dư ' + money(R.credit) + ', sẽ trừ vào tháng sau.</p>' : '') +
      (R.total > 0 && qr ? '<div class="rp-qr">' + qrSvg(qr, 150) + '<div><b>' + esc(B.bank) + '</b><span>' + esc(B.holder) + '</span>' + (B.amt ? '<span>Số tiền: <b>' + money(R.total) + '</b></span><span>Nội dung: <b>' + esc(K.asciiNote(note)) + '</b></span><small>Quét mã bằng app ngân hàng – số tiền và nội dung đã điền sẵn.</small>' : '<span>Nội dung CK: <b>' + esc(K.asciiNote(note)) + '</b></span>') + '</div></div>' : '') +
      '<div class="rp-note" contenteditable="true" data-ph="Nhận xét của cô (bấm để viết)…"></div>' +
      '<footer class="rp-f">Cảm ơn phụ huynh đã đồng hành cùng con! 💛</footer>' +
      '<div class="rp-acts"><button class="btn btn-sm btn-pink" data-act="lp-img" data-s="' + esc(st.id) + '" data-m="' + ym + '">⬇ Tải ảnh / Gửi Zalo</button><button class="btn btn-sm" data-act="lp-msg" data-s="' + esc(st.id) + '" data-m="' + ym + '">📋 Sao chép tin nhắn</button><button class="btn btn-sm btn-mint" data-act="lp-pay" data-s="' + esc(st.id) + '" data-m="' + ym + '">＋ Thu tiền</button></div></article>';
  }
  function viewPhieu(cid, ym, sid) {
    if (ensureSeed() === 'wait') { shell('hocphi', '<div class="card"><p class="muted">Đang tải…</p></div>'); return; }
    var cl = classes()[cid]; if (!cl) { LN.go('#/admin/hocphi'); return; }
    ym = /^\d{4}-\d{2}$/.test(ym || '') ? ym : K.ymOf(today());
    var sts = sid ? cl.students.filter(function (s) { return s.id === sid; }) : curStudents(cl, ym);
    var base = '#/admin/phieu/' + cid + '/';
    var body = '<div class="rp-bar no-print"><a href="#/admin/lop/' + esc(cid) + '/' + ym + '" class="backlink">← Bảng ' + esc(cl.name) + '</a><div class="sh-mnav"><a class="btn btn-sm" href="' + base + K.ymAdd(ym, -1) + (sid ? '/' + sid : '') + '">‹</a><h2>Phiếu báo ' + mTxt(ym) + '</h2><a class="btn btn-sm" href="' + base + K.ymAdd(ym, 1) + (sid ? '/' + sid : '') + '">›</a></div>' +
      '<div class="sh-tools">' + (sid ? '<a class="btn btn-sm" href="' + base + ym + '">Cả lớp</a>' : '') + '<button class="btn btn-sm btn-pink" data-act="lp-print">🖨 In / Lưu PDF</button></div></div>' +
      (bank().qr && K.qrValid(bank().qr) ? '' : '<div class="note note-yel no-print">Chưa có mã QR chuyển khoản hợp lệ – vào <a href="#/admin/caidat">Cài đặt</a>.</div>') +
      '<div class="rp-list">' + sts.map(function (st) { return phieuHtml(cl, st, ym); }).join('') + '</div>';
    shell('hocphi', body);
  }
  function msgText(sid, ym) {
    var x = stuOf(sid), cl = x.cl, st = x.st, R = report(cl, st, ym), pack = (cl.billing || {}).mode === 'pack', B = bank();
    var t = 'Aurora English gửi phụ huynh bé ' + st.name + ' (' + cl.name + ') – ' + ymTxt(ym).toLowerCase() + ':\n';
    t += '• Đi học ' + R.count.p + ' buổi' + (R.count.a ? ', vắng ' + R.count.a : '') + (R.count.e ? ', có phép ' + R.count.e : '') + '.\n';
    R.cur.forEach(function (r) { t += '• ' + (pack ? r.label + ': ' + r.size + ' buổi × ' + money(r.price) : 'Học phí ' + mTxt(ym) + ': ' + r.n + ' buổi × ' + money(r.price)) + ' = ' + money(r.amount) + '\n'; });
    if (R.feePaid) t += '• Đã đóng: ' + money(R.feePaid) + '\n';
    R.old.forEach(function (r) { t += '• Còn thiếu ' + r.label.toLowerCase() + ': ' + money(r.rem) + ' (cộng dồn)\n'; });
    t += R.total > 0 ? '👉 Tổng cần đóng: ' + money(R.total) + (R.due ? ' – hạn ' + dmyy(R.due) : '') + '.\nChuyển khoản ' + B.bank + ' – ' + B.holder + ', nội dung: ' + K.asciiNote(payNote(st, ym)) + ' (quét mã QR trong phiếu).\n' : '👉 Học phí đã đóng đủ.\n';
    return t + 'Cảm ơn phụ huynh đã đồng hành cùng con! 💛';
  }
  function loadH2C() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'; s.onload = function () { ok(window.html2canvas); }; s.onerror = no; document.head.appendChild(s); });
  }
  function saveImg(sid, ym) {
    var el = document.getElementById('rp-' + sid), x = stuOf(sid); if (!el || !x) return;
    toast('Đang tạo ảnh…'); el.classList.add('snap');
    loadH2C().then(function (h2c) { return h2c(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true }); }).then(function (cv) {
      el.classList.remove('snap');
      var name = 'phieu-' + (x.st.user || uname(x.st.name)) + '-' + ym + '.png';
      cv.toBlob(function (blob) {
        var file = typeof File !== 'undefined' ? new File([blob], name, { type: 'image/png' }) : null;
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: name }).catch(function () {}); return; }
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); toast('Đã tải ảnh ' + name);
      }, 'image/png');
    }, function () { el.classList.remove('snap'); toast('Chưa tạo được ảnh (cần mạng). Cô chụp màn hình phiếu hoặc bấm In / Lưu PDF.'); });
  }
  function copy(text) {
    function fb() { var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); toast('Đã sao chép'); }
    try { navigator.clipboard.writeText(text).then(function () { toast('Đã sao chép – dán vào Zalo nhé'); }, fb); } catch (e) { fb(); }
  }

  /* ================= Cài đặt ================= */
  function viewSettings() {
    var B = bank(), ok = K.qrValid(B.qr);
    var body = '<h1>Cài đặt</h1>' +
      '<div class="card"><h2>🏦 Chuyển khoản học phí</h2><p class="small muted">Dùng cho mã QR trên phiếu báo gửi phụ huynh.</p><form id="bk-f"><div class="two">' + field('bk-b', 'Ngân hàng', '<input class="inp" id="bk-b" name="bank" value="' + esc(B.bank) + '">') + field('bk-h', 'Chủ tài khoản', '<input class="inp" id="bk-h" name="holder" value="' + esc(B.holder) + '">') + '</div>' +
      field('bk-q', 'Mã QR gốc (chuỗi VietQR đọc từ ảnh QR của ngân hàng)', '<textarea class="inp" id="bk-q" name="qr" rows="3" style="font-family:monospace;font-size:12px">' + esc(B.qr) + '</textarea>') +
      '<label class="chk"><input type="checkbox" name="amt"' + (B.amt ? ' checked' : '') + '><span>Điền sẵn số tiền và nội dung vào mã QR (phụ huynh quét là đủ thông tin)</span></label><button class="btn btn-pink" type="submit">Lưu</button></form>' +
      '<div class="bk-prev">' + (ok ? qrSvg(B.amt ? K.vietqr(B.qr, 10000, 'HP thu') : B.qr, 140) + '<p class="small">Mã thử' + (B.amt ? ' (10.000đ, nội dung “HP thu”)' : '') + '. Cô quét bằng app ngân hàng một lần để kiểm tra đúng tên <b>' + esc(B.holder) + '</b>.</p>' : '<p class="small" style="color:var(--red-dk)">Mã QR gốc chưa hợp lệ.</p>') + '</div></div>' +
      '<div class="card st-links">' + [['#/admin/account', 'key', 'Mật khẩu & tài khoản giáo viên'], ['#/admin/data', 'db', 'Sao lưu / khôi phục dữ liệu'], ['#/admin/ai', 'bot', 'Trợ lý AI Chíp'], ['#/admin/grammar', 'book', 'Ngữ pháp tổng hợp'], ['#/admin/students', 'users', 'Tất cả tài khoản học sinh']].map(function (l) { return '<a href="' + l[0] + '">' + ic(l[1], 20) + '<span>' + l[2] + '</span><b>›</b></a>'; }).join('') + '</div>';
    shell('caidat', body);
    var f = document.getElementById('bk-f');
    f.addEventListener('submit', function (ev) {
      ev.preventDefault(); var q = f.qr.value.replace(/\s+/g, '');
      if (q && !K.qrValid(q)) { toast('Mã QR gốc không đúng (sai mã kiểm tra). Kiểm tra lại.'); return; }
      store.set('ln_bank', { bank: f.bank.value.trim(), holder: f.holder.value.trim(), qr: q, amt: f.amt.checked }); toast('Đã lưu'); viewSettings();
    });
  }

  /* ================= Xử lý bấm nút ================= */
  var prev = LN.adminClick;
  LN.adminClick = function (a, t, ev) {
    if (!a || a.indexOf('lp-') !== 0) return prev(a, t, ev);
    var cid = t.getAttribute('data-c'), key = t.getAttribute('data-k'), sid = t.getAttribute('data-s'), ym = t.getAttribute('data-m');
    if (a === 'lp-close') return closeModal();
    if (a === 'lp-sess') return sessModal(cid, key);
    if (a === 'lp-stu') return stuModal(sid, ym);
    if (a === 'lp-acc') return accModal(null);
    if (a === 'lp-seen') { var sv = store.get('ln_seed_v', {}); sv.seen = true; store.set('ln_seed_v', sv); return refresh(); }
    if (a === 'lp-copytxt') return copy(t.getAttribute('data-t'));
    if (a === 'lp-addsess') return addSessModal(cid);
    if (a === 'lp-addst') return addStuModal(cid);
    if (a === 'lp-cell') {
      var cd = cdata(cid), r = cd.att[key] = cd.att[key] || {}, v = r[sid], nv = v == null ? 1 : v === 1 ? 0 : v === 0 ? 2 : null;
      if (nv == null) delete r[sid]; else r[sid] = nv; saveCd(cid, cd);
      t.className = 'lp-c v' + (nv == null ? 'n' : nv); t.textContent = nv === 1 ? '1' : nv === 0 ? '0' : nv === 2 ? 'P' : '';
      clearTimeout(LN._lpT); LN._lpT = setTimeout(refresh, 900); return;
    }
    if (SESS && /^lp-(mark|allp|unoff|offform|offok|moveform|moveok|delsess)$/.test(a)) {
      var c2 = SESS.cid, k2 = SESS.key, d2 = cdata(c2), sub = document.getElementById('lp-sub');
      if (a === 'lp-offform') { sub.innerHTML = '<div class="lp-sub">' + field('of-r', 'Lý do (không bắt buộc)', '<input class="inp" id="of-r" placeholder="vd. Nghỉ lễ, cô bận">') + '<button class="btn btn-sm btn-pink" data-act="lp-offok">Xác nhận lớp nghỉ</button></div>'; return; }
      if (a === 'lp-moveform') { sub.innerHTML = '<div class="lp-sub"><div class="two">' + field('mv-d', 'Ngày mới', '<input class="inp" type="date" id="mv-d" value="' + k2.split('@')[0] + '">') + field('mv-t', 'Giờ bắt đầu', '<input class="inp" type="time" id="mv-t" value="' + k2.split('@')[1] + '">') + '</div><button class="btn btn-sm btn-pink" data-act="lp-moveok">Dời buổi</button></div>'; return; }
      if (a === 'lp-mark') { d2.att[k2] = d2.att[k2] || {}; d2.att[k2][sid] = +t.getAttribute('data-v'); }
      if (a === 'lp-allp') { var cl2 = classes()[c2], dt = k2.split('@')[0]; d2.att[k2] = d2.att[k2] || {}; cl2.students.forEach(function (st) { if (K.activeOn(st, dt) && d2.att[k2][st.id] == null) d2.att[k2][st.id] = 1; }); }
      if (a === 'lp-offok') d2.off[k2] = (document.getElementById('of-r').value || '').trim() || 'Lớp nghỉ';
      if (a === 'lp-unoff') delete d2.off[k2];
      if (a === 'lp-delsess') { if (!confirm('Xoá buổi thêm này (kèm điểm danh của buổi)?')) return; delete d2.extra[k2]; delete d2.att[k2]; delete d2.off[k2]; saveCd(c2, d2); closeModal(); toast('Đã xoá buổi'); refresh(); return; }
      if (a === 'lp-moveok') {
        var nd = document.getElementById('mv-d').value, nt = document.getElementById('mv-t').value; if (!nd || !nt) return;
        var nk = nd + '@' + nt; if (nk === k2) { closeModal(); return; }
        var cl3 = classes()[c2], s0 = K.sessions(cl3, d2, k2.split('@')[0], k2.split('@')[0]).filter(function (x) { return x.key === k2; })[0];
        var dur = s0 && s0.end ? K.hm(s0.end) - K.hm(s0.start) : 90, em = K.hm(nt) + dur, endT = ('0' + Math.floor(em / 60)).slice(-2) + ':' + ('0' + em % 60).slice(-2);
        if (d2.extra[k2]) delete d2.extra[k2]; else d2.off[k2] = 'Dời sang ' + dmyy(nd);
        d2.extra[nk] = { end: endT, note: 'Dời từ ' + dmyy(k2.split('@')[0]) }; if (d2.att[k2]) { d2.att[nk] = d2.att[k2]; delete d2.att[k2]; }
        saveCd(c2, d2); closeModal(); toast('Đã dời sang ' + dmyy(nd)); refresh(); return;
      }
      saveCd(c2, d2); refresh(); sessModal(c2, k2); return;
    }
    if (DRAWER && /^lp-(dym|payform|delpay|resetpw|mkacc|leave|back)$/.test(a)) {
      var D = DRAWER, x = stuOf(D.sid); if (!x) return;
      if (a === 'lp-dym') return stuModal(D.sid, ym);
      if (a === 'lp-payform') return payForm(D.sid, report(x.cl, x.st, D.ym).total);
      if (a === 'lp-delpay') { if (!confirm('Xoá lần đóng tiền này?')) return; var P = pays(); P[D.sid] = (P[D.sid] || []).filter(function (p) { return p.id !== t.getAttribute('data-id'); }); store.set('ln_pay', P); refresh(); return stuModal(D.sid, D.ym); }
      if (a === 'lp-resetpw') { var all = LN.users(); if (!all[x.st.user]) return; all[x.st.user].pass = LN.hash(x.st.user + ':123456'); store.set('ln_users', all); toast('Mật khẩu của ' + x.st.user + ' là 123456'); return; }
      if (a === 'lp-mkacc') {
        var base = uname(x.st.name), u = base, all2 = LN.users(); if (all2[u]) u = base + (x.cl.grade < 100 ? x.cl.grade : '2'); var i = 2; while (all2[u]) u = base + (i++);
        u = prompt('Tên đăng nhập cho ' + x.st.name + ':', u); if (!u) return; u = uname(u);
        if (!/^[a-z0-9_]{3,20}$/.test(u) || all2[u]) { toast('Tên không hợp lệ hoặc đã có.'); return; }
        all2[u] = { name: x.st.name, grade: x.cl.grade, pass: LN.hash(u + ':123456'), mail: '', created: Date.now(), last: 0, status: 'active', byAdmin: true, cls: x.cl.id, joined: today() };
        store.set('ln_users', all2); var c4 = classes()[x.cl.id]; c4.students.forEach(function (s) { if (s.id === D.sid) s.user = u; }); saveCls(c4); toast('Đã tạo ' + u + ' / 123456'); refresh(); return stuModal(D.sid, D.ym);
      }
      if (a === 'lp-leave' || a === 'lp-back') {
        if (a === 'lp-leave' && !confirm('Cho ' + x.st.name + ' nghỉ học từ hôm nay? Lịch sử học và học phí vẫn được giữ.')) return;
        var c5 = classes()[x.cl.id]; c5.students.forEach(function (s) { if (s.id === D.sid) { if (a === 'lp-leave') s.left = today(); else delete s.left; } }); saveCls(c5); refresh(); return stuModal(D.sid, D.ym);
      }
    }
    if (a === 'lp-pay') { stuModal(sid, ym); var x2 = stuOf(sid); return payForm(sid, report(x2.cl, x2.st, ym || K.ymOf(today())).total); }
    if (a === 'lp-onlydebt') { ONLY_DEBT = t.checked; return refresh(); }
    if (a === 'lp-csv') return exportCsv(ym);
    if (a === 'lp-print') return window.print();
    if (a === 'lp-img') return saveImg(sid, ym);
    if (a === 'lp-msg') return copy(msgText(sid, ym));
    if (a === 'lp-addslot') return document.getElementById('lp-slots').insertAdjacentHTML('beforeend', slotRow());
    if (a === 'lp-delslot') return t.closest('.lp-slot').remove();
    if (a === 'lp-archive') { var c6 = classes()[cid]; c6.archived = !c6.archived; saveCls(c6); toast(c6.archived ? 'Đã lưu trữ lớp' : 'Đã bỏ lưu trữ'); return LN.go('#/admin'); }
    if (a === 'lp-newcls') {
      var nm = prompt('Tên lớp mới (vd. Lớp 6):'); if (!nm) return; var id = 'c' + Date.now().toString(36);
      saveCls({ id: id, name: nm.trim(), grade: 4, color: '#FFB27A', price: 60000, billing: { mode: 'month', size: 5, dueDay: 5, grace: 3, when: 'after' }, slots: [], students: [], order: clsList(true).length, created: Date.now() });
      return LN.go('#/admin/lop/' + id + '/set');
    }
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  window.addEventListener('hashchange', function () { closeModal(); });

  LN.lop = { viewHome: viewHome, viewClass: viewClass, viewHocPhi: viewHocPhi, viewPhieu: viewPhieu, viewSettings: viewSettings, runSeed: runSeed, report: report, stuOf: stuOf, msgText: msgText,
    viewLich: viewHome, viewLop: viewHome, viewStudent: function (sid) { viewHome(); if (sid) stuModal(sid); } };
})();
