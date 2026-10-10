/* ================= Khu giáo viên: Lịch & điểm danh · Lớp học · Học phí =================
   Dùng phần tính toán trong lop_core.js. Mọi thay đổi lưu ngay và tự đồng bộ lên mạng. */
(function () {
  'use strict';
  var LN = window.LN, store = LN.store, esc = LN.esc, ic = LN.ic, toast = LN.toast, K = LN.lopCore;
  var DOWS = K.DOWS, DOWS_S = K.DOWS_S;
  function money(n) { return (Math.round(n) || 0).toLocaleString('vi-VN') + 'đ'; }
  function today() { return K.iso(new Date()); }
  function dmy(s) { var p = String(s).split('-'); return +p[2] + '/' + +p[1]; }
  function dmyy(s) { var p = String(s).split('-'); return +p[2] + '/' + +p[1] + '/' + p[0]; }
  function ymTxt(ym) { return 'Tháng ' + (+ym.slice(5)) + '/' + ym.slice(0, 4); }
  function classes() { return store.get('ln_classes', {}) || {}; }
  function clsList(all) { var c = classes(); return Object.keys(c).map(function (k) { return c[k]; }).filter(function (x) { return all || !x.archived; }).sort(function (a, b) { return (a.order || 0) - (b.order || 0) || String(a.name).localeCompare(String(b.name), 'vi', { numeric: true }); }); }
  function saveCls(cl) { var c = classes(); c[cl.id] = cl; store.set('ln_classes', c); }
  function cdata(id) { var d = store.get('ln_cl_' + id, null) || {}; d.att = d.att || {}; d.off = d.off || {}; d.extra = d.extra || {}; d.closed = d.closed || {}; return d; }
  function saveCd(id, d) { store.set('ln_cl_' + id, d); }
  function pays() { return store.get('ln_pay', {}) || {}; }
  function payOf(sid) { return pays()[sid] || []; }
  function txtColor(hex) { var h = String(hex || '#ccc').replace('#', ''); if (h.length < 6) return '#3B2A3A'; var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16); return (r * 299 + g * 587 + b * 114) / 1000 < 140 ? '#fff' : '#3B2A3A'; }
  function schedTxt(cl, at) {
    at = at || today();
    var act = (cl.slots || []).filter(function (s) { return (!s.from || s.from <= at || true) && (!s.to || s.to >= at); });
    return act.sort(function (a, b) { return ((a.dow + 6) % 7) - ((b.dow + 6) % 7); }).map(function (s) { return DOWS_S[s.dow] + ' ' + K.timeTxt(s.start) + '–' + K.timeTxt(s.end); }).join(' · ') || 'Chưa có lịch';
  }
  function billTxt(cl) { var b = cl.billing || {}; return money(cl.price) + '/buổi · ' + (b.mode === 'pack' ? 'đóng theo gói ' + (b.size || 5) + ' buổi' : 'đóng theo tháng'); }
  function stuOf(sid) { var r = null; clsList(true).some(function (cl) { return (cl.students || []).some(function (s) { if (s.id === sid) { r = { cl: cl, st: s }; return true; } return false; }); }); return r; }
  function ledgerOf(cl, st, untilYm) { return K.ledger(K.periods(cl, cdata(cl.id), st, today(), untilYm), payOf(st.id), today()); }
  var STL = { paid: ['Đã đóng đủ', 'tag-mint'], partial: ['Đóng thiếu', 'tag-yel'], overdue: ['Quá hạn', 'tag-red'], due: ['Chờ đóng', 'tag'] };
  function stTag(s) { var x = STL[s] || STL.due; return '<span class="tag ' + x[1] + '">' + x[0] + '</span>'; }
  function uname(n) { return String(n || '').trim().replace(/Đ/g, 'D').replace(/đ/g, 'd').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function shell(active, body) { LN.adminShell(active, body); }

  /* ================= Nhập dữ liệu từ file "Check điểm danh" ================= */
  function seedPending() { return window.LOP_SEED && !store.get('ln_seed_done', null); }
  function runSeed() {
    var S = window.LOP_SEED, users = LN.users(), made = [], skipped = [], dup = [], linked = [];
    var dupes = S.dupes || {}, c = classes(), pay = pays();
    S.classes.forEach(function (x, i) {
      var cl = { id: x.id, name: x.name, grade: x.grade, color: x.color, price: x.price, billing: x.billing, slots: x.slots, order: i, created: Date.now(),
        students: x.students.map(function (s) { return { id: s.id, name: s.name, user: null, joined: s.joined }; }) };
      cl.students.forEach(function (s, j) {
        var u = x.students[j].user;
        if (dupes[u]) { dup.push({ name: s.name, cls: x.name, user: u }); return; }
        if (users[u]) {
          if ((users[u].name || '').trim() === s.name.trim() && +users[u].grade === +x.grade) { s.user = u; linked.push(u); }
          else skipped.push({ name: s.name, cls: x.name, user: u, other: users[u].name });
          return;
        }
        users[u] = { name: s.name, grade: x.grade, pass: LN.hash(u + ':123456'), mail: '', created: Date.now(), last: 0, status: 'active', byAdmin: true, cls: x.id, joined: today() };
        s.user = u; made.push(u);
      });
      if (!c[x.id]) c[x.id] = cl; else { // lớp đã có: chỉ bổ sung học sinh chưa có
        cl.students.forEach(function (s) { if (!c[x.id].students.some(function (y) { return y.id === s.id; })) c[x.id].students.push(s); });
      }
      var cd = cdata(x.id);
      Object.keys(x.att || {}).forEach(function (k) { cd.att[k] = Object.assign({}, x.att[k], cd.att[k] || {}); });
      Object.keys(x.off || {}).forEach(function (k) { if (cd.off[k] == null) cd.off[k] = x.off[k]; });
      saveCd(x.id, cd);
    });
    store.set('ln_users', users); store.set('ln_classes', c);
    var rep = { at: Date.now(), made: made, linked: linked, skipped: skipped, dup: dup };
    store.set('ln_seed_done', rep); return rep;
  }
  function seedReport(rep) {
    return '<div class="card lp-rep"><h2>✅ Đã nhập dữ liệu từ file điểm danh</h2><p>Tạo <b>' + rep.made.length + '</b> tài khoản học sinh (mật khẩu <b>123456</b>)' + (rep.linked.length ? ', nối <b>' + rep.linked.length + '</b> tài khoản đã có' : '') + '.</p>' +
      (rep.dup.length ? '<div class="note note-yel" style="margin-top:10px"><b>⚠ Trùng tên đăng nhập – chưa tạo tài khoản, cô xử lý giúp:</b><ul>' + rep.dup.map(function (d) { return '<li><b>' + esc(d.name) + '</b> (' + esc(d.cls) + ') → <code>' + esc(d.user) + '</code></li>'; }).join('') + '</ul><p class="small">Các bé này vẫn có trong lớp, điểm danh và học phí bình thường. Bấm vào tên bé → <b>Tạo tài khoản</b> với tên đăng nhập khác (vd. thêm số lớp).</p></div>' : '') +
      (rep.skipped.length ? '<div class="note note-yel" style="margin-top:10px"><b>⚠ Tên đăng nhập đã thuộc về người khác:</b><ul>' + rep.skipped.map(function (d) { return '<li>' + esc(d.name) + ' (' + esc(d.cls) + '): <code>' + esc(d.user) + '</code> đang là của “' + esc(d.other) + '”</li>'; }).join('') + '</ul></div>' : '') +
      '<details style="margin-top:10px"><summary class="small">Danh sách tài khoản đã tạo</summary><p class="small" style="line-height:1.9">' + rep.made.map(function (u) { return '<code>' + esc(u) + '</code>'; }).join(' ') + '</p></details></div>';
  }

  /* ================= Bảng phụ: điểm danh một buổi ================= */
  function modal(html) {
    closeModal(); var m = document.createElement('div'); m.className = 'lp-modal'; m.id = 'lp-modal';
    m.innerHTML = '<div class="lp-sheet" role="dialog" aria-modal="true"><button class="lp-x" data-act="lp-close" aria-label="Đóng">✕</button>' + html + '</div>';
    m.addEventListener('click', function (e) { if (e.target === m) closeModal(); }); document.body.appendChild(m); document.body.classList.add('lp-noscroll');
  }
  function closeModal() { var m = document.getElementById('lp-modal'); if (m) m.remove(); document.body.classList.remove('lp-noscroll'); }
  var SESS = null;
  function sessModal(cid, key) {
    var cl = classes()[cid]; if (!cl) return; var cd = cdata(cid), date = key.split('@')[0];
    var s = K.sessions(cl, cd, date, date).filter(function (x) { return x.key === key; })[0] || { key: key, date: date, start: key.split('@')[1], end: '' };
    var sts = (cl.students || []).filter(function (st) { return K.activeOn(st, date); }), row = cd.att[key] || {}, closed = cd.closed[K.ymOf(date)];
    var pres = sts.filter(function (st) { return row[st.id] === 1; }).length;
    SESS = { cid: cid, key: key };
    var h = '<div class="lp-mh" style="--c:' + esc(cl.color) + '"><span class="lp-dot"></span><div><h2>' + esc(cl.name) + '</h2><p>' + DOWS[K.dow(date)] + ', ' + dmyy(date) + ' · ' + K.timeTxt(s.start) + (s.end ? '–' + K.timeTxt(s.end) : '') + (s.extra ? ' · <b>buổi học thêm</b>' : '') + '</p></div></div>';
    if (closed) h += '<div class="note note-yel">🔒 ' + ymTxt(K.ymOf(date)) + ' đã chốt học phí. Mở chốt ở trang lớp nếu cần sửa.</div>';
    if (s.off) h += '<div class="note note-yel" style="margin:10px 0">🚫 Buổi này <b>lớp nghỉ</b>' + (s.note ? ': ' + esc(s.note) : '') + ' – không tính học phí.</div><button class="btn" data-act="lp-unoff">Học lại buổi này</button>';
    else {
      h += '<div class="lp-mbar"><span><b>' + pres + '</b>/' + sts.length + ' có mặt</span><button class="btn btn-sm btn-mint" data-act="lp-allp"' + (closed ? ' disabled' : '') + '>✅ Tất cả có mặt</button></div>' +
        '<div class="lp-att">' + sts.map(function (st) {
          var v = row[st.id];
          return '<div class="lp-arow"><a href="#/admin/hs/' + esc(st.id) + '" class="lp-an">' + esc(st.name) + '</a><div class="lp-ab">' +
            [[1, '✅', 'Có mặt'], [0, '❌', 'Vắng'], [2, '🟡', 'Có phép']].map(function (o) { return '<button type="button" class="lp-b v' + o[0] + (v === o[0] ? ' on' : '') + '" data-act="lp-mark" data-s="' + esc(st.id) + '" data-v="' + o[0] + '"' + (closed ? ' disabled' : '') + ' title="' + o[2] + '">' + o[1] + '<span>' + o[2] + '</span></button>'; }).join('') + '</div></div>';
        }).join('') + '</div><p class="tiny muted">Chỉ buổi <b>✅ có mặt</b> được tính học phí (giống file Excel: 1 = tính, 0 = không tính).</p>' +
        '<div class="lp-mf"><button class="btn btn-sm" data-act="lp-off">🚫 Lớp nghỉ buổi này</button><button class="btn btn-sm" data-act="lp-move">🔁 Dời sang ngày khác</button></div>';
    }
    modal(h);
  }
  function refresh() { var h = location.hash; LN.adminRoute(h.replace(/^#\/admin\/?/, '').split('/').filter(Boolean)); }

  /* ================= Trang: Lịch & điểm danh ================= */
  function weekStart(d) { var x = K.parse(d), w = (x.getDay() + 6) % 7; x.setDate(x.getDate() - w); return K.iso(x); }
  function viewLich(ws) {
    if (seedPending()) return viewLop();
    ws = /^\d{4}-\d{2}-\d{2}$/.test(ws || '') ? weekStart(ws) : weekStart(today());
    var days = []; for (var i = 0; i < 7; i++) days.push(K.addDays(ws, i));
    var cls = clsList(), td = today(), byDay = {}, todays = [], unmarked = 0;
    cls.forEach(function (cl) {
      var cd = cdata(cl.id);
      K.sessions(cl, cd, days[0], days[6]).forEach(function (s) {
        var sts = (cl.students || []).filter(function (st) { return K.activeOn(st, s.date); }), r = cd.att[s.key] || {}, marked = sts.filter(function (st) { return r[st.id] != null; }).length, pres = sts.filter(function (st) { return r[st.id] === 1; }).length;
        var it = { cl: cl, s: s, n: sts.length, marked: marked, pres: pres };
        (byDay[s.date] = byDay[s.date] || []).push(it); if (s.date === td) todays.push(it);
        if (s.date < td && !s.off && marked < sts.length) unmarked++;
      });
    });
    function block(it, big) {
      var cl = it.cl, s = it.s, st = s.off ? '<em>Nghỉ</em>' : it.marked >= it.n && it.n ? '✅ ' + it.pres + '/' + it.n : s.date <= td ? '<em class="warn">Chưa điểm danh</em>' : it.n + ' học sinh';
      return '<button type="button" class="lp-blk' + (s.off ? ' off' : '') + (big ? ' big' : '') + '" style="--c:' + esc(cl.color) + ';--t:' + txtColor(cl.color) + '" data-act="lp-sess" data-c="' + esc(cl.id) + '" data-k="' + esc(s.key) + '"><b>' + esc(cl.name) + '</b><span>' + K.timeTxt(s.start) + (s.end ? '–' + K.timeTxt(s.end) : '') + '</span><small>' + st + '</small></button>';
    }
    var head = '<div class="chead"><div><h1>Lịch & điểm danh</h1><p class="muted">Bấm vào một buổi để điểm danh. Lịch các tuần sau tự điền theo lịch cố định của từng lớp.</p></div>' +
      '<div class="lp-wnav"><a class="btn btn-sm" href="#/admin/lich/' + K.addDays(ws, -7) + '">‹</a><a class="btn btn-sm' + (ws === weekStart(td) ? ' btn-pink' : '') + '" href="#/admin/lich">Tuần này</a><a class="btn btn-sm" href="#/admin/lich/' + K.addDays(ws, 7) + '">›</a></div></div>';
    var tday = '<div class="card lp-today"><h2>Hôm nay · ' + DOWS[K.dow(td)] + ' ' + dmyy(td) + '</h2>' + (todays.length ? '<div class="lp-tl">' + todays.sort(function (a, b) { return K.hm(a.s.start) - K.hm(b.s.start); }).map(function (it) { return block(it, true); }).join('') + '</div>' : '<p class="muted">Hôm nay không có lớp nào.</p>') +
      (unmarked && ws === weekStart(td) ? '<p class="small" style="margin-top:8px;color:var(--red-dk)">⚠ Có ' + unmarked + ' buổi đã qua trong tuần chưa điểm danh xong.</p>' : '') + '</div>';
    var grid = '<div class="card"><div class="chead"><h2>Tuần ' + dmy(days[0]) + ' – ' + dmyy(days[6]) + '</h2><input type="date" class="inp" id="lp-wpick" value="' + ws + '" style="width:auto" aria-label="Chọn tuần"></div><div class="lp-weekw"><div class="lp-week">' + days.map(function (d) {
      var list = (byDay[d] || []).sort(function (a, b) { return K.hm(a.s.start) - K.hm(b.s.start); });
      return '<div class="lp-day' + (d === td ? ' td' : '') + '"><div class="lp-dh"><b>' + DOWS[K.dow(d)] + '</b><span>' + dmy(d) + '</span></div>' + (list.length ? list.map(function (it) { return block(it); }).join('') : '<p class="lp-none">—</p>') + '</div>';
    }).join('') + '</div></div></div>';
    shell('lich', head + tday + grid + (cls.length ? '' : '<div class="note note-yel">Chưa có lớp nào. Vào <a href="#/admin/lop">Lớp học</a> để thêm lớp.</div>'));
    var wp = document.getElementById('lp-wpick'); if (wp) wp.addEventListener('change', function () { if (wp.value) LN.go('#/admin/lich/' + wp.value); });
  }

  /* ================= Trang: Lớp học ================= */
  function viewLop() {
    var cls = clsList(), td = today(), ym = K.ymOf(td), rep = store.get('ln_seed_done', null);
    var body = '<div class="chead"><div><h1>Lớp học</h1><p class="muted">Lịch cố định, học sinh, học phí của từng lớp. Bấm vào lớp để xem bảng điểm danh theo tháng.</p></div><button class="btn btn-pink" data-act="lp-newcls">' + ic('plus', 18) + 'Thêm lớp</button></div>';
    if (seedPending()) {
      var S = window.LOP_SEED, n = S.classes.reduce(function (s, c) { return s + c.students.length; }, 0);
      body += '<div class="card lp-seed"><h2>📥 Nhập dữ liệu từ file “Check điểm danh”</h2><p>Sẵn sàng nhập <b>' + S.classes.length + ' lớp</b>, <b>' + n + ' học sinh</b> kèm lịch cố định, học phí và các buổi đã điểm danh. Mỗi học sinh được tạo tài khoản (tên viết liền không dấu, mật khẩu <b>123456</b>).</p>' +
        (Object.keys(S.dupes || {}).length ? '<p class="small">⚠ ' + Object.keys(S.dupes).length + ' tên đăng nhập bị trùng sẽ <b>chưa tạo tài khoản</b> để cô xử lý: ' + Object.keys(S.dupes).map(function (u) { return '<code>' + u + '</code> (' + S.dupes[u].map(function (x) { return esc(x[0]) + ' – ' + esc(x[1]); }).join(', ') + ')'; }).join('; ') + '.</p>' : '') +
        '<button class="btn btn-lg btn-pink" data-act="lp-seed">Nhập ngay</button></div>';
    }
    if (rep && rep.at && Date.now() - rep.at < 7 * 86400000 && !seedPending()) body += seedReport(rep);
    body += '<div class="lp-cards">' + cls.map(function (cl) {
      var tot = { b: 0, p: 0 }; (cl.students || []).forEach(function (st) { var L = ledgerOf(cl, st); L.rows.forEach(function (r) { if (r.id === ym || (r.kind === 'pack' && K.ymOf(r.due) === ym)) { tot.b += r.amount; tot.p += r.paid; } }); });
      return '<a class="lp-card" href="#/admin/lop/' + esc(cl.id) + '" style="--c:' + esc(cl.color) + '"><div class="lp-ch"><b>' + esc(cl.name) + '</b><span class="tag">' + (cl.students || []).filter(function (s) { return !s.left; }).length + ' học sinh</span></div>' +
        '<p class="lp-cs">🗓 ' + esc(schedTxt(cl)) + '</p><p class="lp-cs">💰 ' + esc(billTxt(cl)) + '</p>' +
        '<div class="lp-cm"><span>' + ymTxt(ym) + '</span><span>Đã thu <b>' + money(tot.p) + '</b> / ' + money(tot.b) + '</span></div></a>';
    }).join('') + '</div>';
    var arch = clsList(true).filter(function (c) { return c.archived; });
    if (arch.length) body += '<details style="margin-top:16px"><summary class="muted">Lớp đã lưu trữ (' + arch.length + ')</summary>' + arch.map(function (c) { return '<p><a href="#/admin/lop/' + esc(c.id) + '">' + esc(c.name) + '</a></p>'; }).join('') + '</details>';
    shell('lop', body);
  }

  /* ---- Chi tiết lớp: bảng điểm danh tháng, học sinh, cài đặt ---- */
  var CTAB = {};
  function viewClass(cid, ym, tab) {
    var cl = classes()[cid]; if (!cl) { LN.go('#/admin/lop'); return; }
    ym = /^\d{4}-\d{2}$/.test(ym || '') ? ym : K.ymOf(today()); tab = tab || CTAB[cid] || 'grid'; CTAB[cid] = tab;
    var cd = cdata(cid), td = today(), ss = K.monthSessions(cl, cd, ym), closed = cd.closed[ym], sts = (cl.students || []).filter(function (st) { return !st.left || st.left >= ym + '-01'; });
    var head = '<a href="#/admin/lop" class="backlink">← Tất cả lớp</a><div class="lp-hero" style="--c:' + esc(cl.color) + ';--t:' + txtColor(cl.color) + '"><div><h1>' + esc(cl.name) + '</h1><p>🗓 ' + esc(schedTxt(cl)) + '</p><p>💰 ' + esc(billTxt(cl)) + (cl.billing && cl.billing.mode !== 'pack' ? ' · hạn đóng ngày ' + (cl.billing.dueDay || 5) + ' tháng sau' : ' · hạn ' + ((cl.billing || {}).grace || 0) + ' ngày sau buổi cuối của gói') + '</p></div></div>' +
      '<nav class="seg lp-tabs">' + [['grid', 'Điểm danh & học phí'], ['hs', 'Học sinh (' + sts.length + ')'], ['set', 'Lịch & cài đặt']].map(function (t) { return '<button type="button" class="' + (tab === t[0] ? 'on' : '') + '" data-act="lp-ctab" data-c="' + esc(cid) + '" data-t="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</nav>';
    var body = '';
    if (tab === 'grid') {
      var tot = { n: 0, amt: 0, paid: 0, rem: 0 };
      body = '<div class="card"><div class="chead"><div class="lp-mnav"><a class="btn btn-sm" href="#/admin/lop/' + esc(cid) + '/' + K.ymAdd(ym, -1) + '">‹</a><h2>' + ymTxt(ym) + '</h2><a class="btn btn-sm" href="#/admin/lop/' + esc(cid) + '/' + K.ymAdd(ym, 1) + '">›</a></div>' +
        '<div class="lp-acts">' + (closed ? '<span class="tag tag-mint">🔒 Đã chốt ' + dmyy(K.iso(new Date(closed.at))) + '</span><button class="btn btn-sm" data-act="lp-unclose" data-c="' + esc(cid) + '" data-m="' + ym + '">Mở chốt</button>' : '<button class="btn btn-sm btn-yel" data-act="lp-close-month" data-c="' + esc(cid) + '" data-m="' + ym + '" title="Lưu cố định số buổi & tiền của tháng để báo cáo">🔒 Chốt học phí tháng</button>') +
        '<button class="btn btn-sm" data-act="lp-extra" data-c="' + esc(cid) + '">＋ Buổi học bù</button></div></div>' +
        (ss.length ? '<div class="tblw lp-gridw"><table class="tbl lp-grid"><thead><tr><th class="lp-sn">Học sinh</th>' + ss.map(function (s) { return '<th class="center' + (s.off ? ' off' : '') + (s.date === td ? ' td' : '') + '"><button type="button" class="lp-hb" data-act="lp-sess" data-c="' + esc(cid) + '" data-k="' + esc(s.key) + '">' + DOWS_S[K.dow(s.date)] + '<br><b>' + dmy(s.date) + '</b>' + (s.extra ? '<br><i>bù</i>' : '') + (s.off ? '<br><i>nghỉ</i>' : '') + '</button></th>'; }).join('') +
          '<th>Buổi</th><th>Học phí</th><th>Đã đóng</th><th>Còn</th></tr></thead><tbody>' + sts.map(function (st) {
            var n = 0, L = ledgerOf(cl, st, ym), r = L.rows.filter(function (x) { return x.id === ym; })[0];
            var cells = ss.map(function (s) {
              if (!K.activeOn(st, s.date)) return '<td class="center na">·</td>';
              if (s.off) return '<td class="center off">–</td>';
              var v = K.mark(cd, s.key, st.id); if (v === 1) n++;
              return '<td class="center"><button type="button" class="lp-c v' + (v == null ? 'n' : v) + '" data-act="lp-cell" data-c="' + esc(cid) + '" data-k="' + esc(s.key) + '" data-s="' + esc(st.id) + '"' + (closed ? ' disabled' : '') + ' aria-label="' + esc(st.name) + ' ' + dmy(s.date) + '">' + (v === 1 ? '1' : v === 0 ? '0' : v === 2 ? 'P' : '') + '</button></td>';
            }).join('');
            var amt = cl.billing && cl.billing.mode === 'pack' ? n * K.priceOf(cl, st) : (r ? r.amount : 0), paid = r ? r.paid : 0, rem = r ? r.rem : 0;
            if (cl.billing && cl.billing.mode === 'pack') { paid = null; rem = L.debt; }
            tot.n += n; tot.amt += amt; tot.paid += paid || 0; tot.rem += rem;
            return '<tr><th class="lp-sn"><a href="#/admin/hs/' + esc(st.id) + '">' + esc(st.name) + '</a>' + (st.user ? '' : ' <span class="tag tag-yel" title="Chưa có tài khoản">!</span>') + '</th>' + cells + '<td class="center"><b>' + n + '</b></td><td>' + money(amt) + '</td><td>' + (paid == null ? '<span class="tiny muted">theo gói</span>' : money(paid)) + '</td><td>' + (rem > 0 ? '<b style="color:var(--red-dk)">' + money(rem) + '</b>' : '<span style="color:var(--mint-dk)">✓</span>') + '</td></tr>';
          }).join('') + '</tbody><tfoot><tr><th class="lp-sn">Tổng</th><td colspan="' + ss.length + '"></td><td class="center"><b>' + tot.n + '</b></td><td><b>' + money(tot.amt) + '</b></td><td><b>' + money(tot.paid) + '</b></td><td><b>' + money(tot.rem) + '</b></td></tr></tfoot></table></div>' +
          '<p class="tiny muted" style="margin-top:8px">Bấm ô để đổi: trống → <b>1</b> có mặt → <b>0</b> vắng → <b>P</b> vắng có phép → trống. Bấm tiêu đề ngày để điểm danh cả buổi, cho lớp nghỉ hoặc dời buổi. ' + (cl.billing && cl.billing.mode === 'pack' ? 'Lớp đóng theo gói: cột “Còn” là tổng nợ các gói đã học xong.' : '') + '</p>'
          : '<p class="muted">Tháng này không có buổi học nào theo lịch.</p>') + '</div>';
    } else if (tab === 'hs') {
      body = '<div class="card"><div class="chead"><h2>Học sinh</h2></div>' + (cl.students || []).map(function (st) {
        var L = ledgerOf(cl, st);
        return '<div class="lp-srow' + (st.left ? ' left' : '') + '"><a href="#/admin/hs/' + esc(st.id) + '"><b>' + esc(st.name) + '</b></a><span class="small muted">' + (st.user ? '👤 ' + esc(st.user) : '<span style="color:var(--red-dk)">chưa có tài khoản</span>') + (st.price ? ' · giá riêng ' + money(st.price) : '') + (st.left ? ' · nghỉ từ ' + dmyy(st.left) : '') + '</span><span>' + (L.debt ? '<b style="color:var(--red-dk)">nợ ' + money(L.debt) + '</b>' : '<span style="color:var(--mint-dk)">✓ không nợ</span>') + '</span></div>';
      }).join('') +
        '<form id="lp-addst" class="lp-addst"><h3>Thêm học sinh vào lớp</h3><div class="two"><div class="field"><label for="lp-sname">Họ tên</label><input class="inp" id="lp-sname" name="name" required></div><div class="field"><label for="lp-suser">Tên đăng nhập</label><input class="inp" id="lp-suser" name="user" placeholder="tự tạo từ tên"></div></div>' +
        '<div class="two"><div class="field"><label for="lp-sjoin">Bắt đầu học từ</label><input class="inp" type="date" id="lp-sjoin" name="joined" value="' + td + '"></div><div class="field"><label for="lp-sprice">Học phí riêng (để trống = giá lớp)</label><input class="inp" type="number" id="lp-sprice" name="price" step="5000" placeholder="' + cl.price + '"></div></div>' +
        '<label class="chk"><input type="checkbox" name="acc" checked><span>Tạo tài khoản học app (mật khẩu 123456)</span></label><button class="btn btn-pink" type="submit">Thêm học sinh</button></form></div>';
    } else {
      var b = cl.billing || {};
      body = '<div class="card"><h2>Lịch học cố định</h2><p class="small muted">Đổi lịch chỉ áp dụng từ ngày cô chọn – các buổi và học phí trước ngày đó giữ nguyên.</p>' +
        '<form id="lp-sched"><div id="lp-slots">' + (cl.slots || []).filter(function (s) { return !s.to || s.to >= td; }).map(slotRow).join('') + '</div><button type="button" class="btn btn-sm" data-act="lp-addslot">＋ Thêm buổi trong tuần</button>' +
        '<div class="two" style="margin-top:12px;align-items:end"><div class="field"><label for="lp-from">Áp dụng từ ngày</label><input class="inp" type="date" id="lp-from" name="from" value="' + td + '"></div><div><button class="btn btn-pink" type="submit">Lưu lịch mới</button></div></div></form>' +
        ((cl.slots || []).some(function (s) { return s.to && s.to < td; }) ? '<details class="small" style="margin-top:8px"><summary>Lịch cũ</summary>' + cl.slots.filter(function (s) { return s.to && s.to < td; }).map(function (s) { return '<p>' + DOWS[s.dow] + ' ' + K.timeTxt(s.start) + '–' + K.timeTxt(s.end) + ' · từ ' + (s.from ? dmyy(s.from) : 'đầu') + ' đến ' + dmyy(s.to) + '</p>'; }).join('') + '</details>' : '') + '</div>' +
        '<div class="card" style="margin-top:16px"><h2>Thông tin & học phí</h2><form id="lp-info"><div class="two"><div class="field"><label for="lp-name">Tên lớp</label><input class="inp" id="lp-name" name="name" value="' + esc(cl.name) + '"></div><div class="field"><label for="lp-color">Màu trên lịch</label><input class="inp" type="color" id="lp-color" name="color" value="' + esc(cl.color || '#FF5C9A') + '"></div></div>' +
        '<div class="two"><div class="field"><label for="lp-grade">Lớp/khoá học trên app</label><select class="sel" id="lp-grade" name="grade">' + LN.gradeOpts(cl.grade) + '</select></div><div class="field"><label for="lp-price">Học phí mỗi buổi (đ)</label><input class="inp" type="number" step="5000" id="lp-price" name="price" value="' + (cl.price || 0) + '"></div></div>' +
        '<div class="two"><div class="field"><label for="lp-mode">Cách thu</label><select class="sel" id="lp-mode" name="mode"><option value="month"' + (b.mode !== 'pack' ? ' selected' : '') + '>Theo tháng (số buổi đi học × giá)</option><option value="pack"' + (b.mode === 'pack' ? ' selected' : '') + '>Theo gói N buổi</option></select></div>' +
        '<div class="field"><label for="lp-size">Số buổi mỗi gói</label><input class="inp" type="number" min="1" id="lp-size" name="size" value="' + (b.size || 5) + '"></div></div>' +
        '<div class="two"><div class="field"><label for="lp-due">Hạn đóng (theo tháng): ngày … tháng sau</label><input class="inp" type="number" min="1" max="28" id="lp-due" name="dueDay" value="' + (b.dueDay || 5) + '"></div><div class="field"><label for="lp-grace">Hạn đóng (theo gói): số ngày sau buổi cuối</label><input class="inp" type="number" min="0" id="lp-grace" name="grace" value="' + (b.grace || 0) + '"></div></div>' +
        '<button class="btn btn-pink" type="submit">Lưu</button> <button class="btn" type="button" data-act="lp-archive" data-c="' + esc(cid) + '">' + (cl.archived ? 'Bỏ lưu trữ' : 'Lưu trữ lớp (ẩn khỏi lịch)') + '</button></form>' +
        '<p class="tiny muted" style="margin-top:8px">Đổi giá chỉ ảnh hưởng các tháng chưa chốt. Chốt học phí từng tháng để giữ nguyên số liệu đã báo cáo.</p></div>';
    }
    shell('lop', head + body);
    bindClass(cl, ym);
  }
  function slotRow(s) {
    s = s || { dow: 1, start: '17:00', end: '18:30' };
    return '<div class="lp-slot"><select class="sel" name="dow">' + [1, 2, 3, 4, 5, 6, 0].map(function (d) { return '<option value="' + d + '"' + (+s.dow === d ? ' selected' : '') + '>' + DOWS[d] + '</option>'; }).join('') + '</select><input class="inp" type="time" name="start" value="' + esc(s.start) + '"><span>→</span><input class="inp" type="time" name="end" value="' + esc(s.end) + '"><button type="button" class="btn btn-sm" data-act="lp-delslot" aria-label="Xoá">✕</button></div>';
  }
  function bindClass(cl, ym) {
    var f1 = document.getElementById('lp-sched');
    if (f1) f1.addEventListener('submit', function (ev) {
      ev.preventDefault(); var from = document.getElementById('lp-from').value || today(), rows = [].slice.call(f1.querySelectorAll('.lp-slot'));
      var ns = rows.map(function (r) { return { dow: +r.querySelector('[name=dow]').value, start: r.querySelector('[name=start]').value, end: r.querySelector('[name=end]').value, from: from, to: null }; }).filter(function (s) { return s.start; });
      var c = classes()[cl.id], prevDay = K.addDays(from, -1);
      c.slots = (c.slots || []).filter(function (s) { return !(s.from && s.from >= from); }).map(function (s) { if (!s.to || s.to >= from) s.to = prevDay; return s; }).filter(function (s) { return !s.from || s.from <= s.to; }).concat(ns);
      saveCls(c); toast('Đã lưu lịch mới, áp dụng từ ' + dmyy(from)); viewClass(cl.id, ym, 'set');
    });
    var f2 = document.getElementById('lp-info');
    if (f2) f2.addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(f2), c = classes()[cl.id];
      c.name = String(d.get('name') || c.name).trim(); c.color = d.get('color'); c.grade = +d.get('grade'); c.price = +d.get('price') || 0;
      c.billing = { mode: d.get('mode'), size: +d.get('size') || 5, dueDay: +d.get('dueDay') || 5, grace: +d.get('grace') || 0, when: (c.billing || {}).when || 'after' };
      saveCls(c); toast('Đã lưu'); viewClass(cl.id, ym, 'set');
    });
    var f3 = document.getElementById('lp-addst');
    if (f3) {
      var nm = f3.querySelector('[name=name]'), us = f3.querySelector('[name=user]'), touched = false;
      us.addEventListener('input', function () { touched = true; });
      nm.addEventListener('input', function () { if (!touched) us.value = uname(nm.value); });
      f3.addEventListener('submit', function (ev) {
        ev.preventDefault(); var d = new FormData(f3), name = String(d.get('name') || '').trim(), u = uname(d.get('user') || name);
        if (!name) return; var c = classes()[cl.id], sid = cl.id + '-' + (u || 'hs') + '-' + Date.now().toString(36).slice(-4);
        var st = { id: sid, name: name, user: null, joined: d.get('joined') || today() }; if (+d.get('price')) st.price = +d.get('price');
        if (d.get('acc')) {
          var all = LN.users();
          if (!/^[a-z0-9_]{3,20}$/.test(u)) { toast('Tên đăng nhập cần 3–20 chữ thường không dấu/số.'); return; }
          if (all[u]) { toast('Tên đăng nhập “' + u + '” đã có. Đổi tên khác (vd. ' + u + '2).'); return; }
          all[u] = { name: name, grade: c.grade, pass: LN.hash(u + ':123456'), mail: '', created: Date.now(), last: 0, status: 'active', byAdmin: true, cls: c.id, joined: st.joined };
          store.set('ln_users', all); st.user = u;
        }
        c.students.push(st); saveCls(c); toast('Đã thêm ' + name + (st.user ? ' · tài khoản ' + st.user + ' / 123456' : '')); viewClass(cl.id, ym, 'hs');
      });
    }
  }

  /* ================= Trang: Học phí ================= */
  var HPF = 'all';
  function viewHocPhi(ym) {
    if (seedPending()) return viewLop();
    ym = /^\d{4}-\d{2}$/.test(ym || '') ? ym : K.ymOf(today());
    var cls = clsList(), td = today(), S = { b: 0, p: 0, r: 0, od: 0, odn: 0, debt: 0 };
    var sections = cls.map(function (cl) {
      var rows = (cl.students || []).filter(function (st) { return !st.left || st.left >= ym + '-01'; }).map(function (st) {
        var L = ledgerOf(cl, st, ym), cur = L.rows.filter(function (r) { return r.id === ym || (r.kind === 'pack' && K.ymOf(r.due) === ym); });
        var b = cur.reduce(function (s, r) { return s + r.amount; }, 0), p = cur.reduce(function (s, r) { return s + r.paid; }, 0), rem = cur.reduce(function (s, r) { return s + r.rem; }, 0);
        var n = cur.reduce(function (s, r) { return s + r.n; }, 0), status = cur.length ? (cur.some(function (r) { return r.status === 'overdue'; }) ? 'overdue' : cur.every(function (r) { return r.status === 'paid'; }) ? 'paid' : cur.some(function (r) { return r.paid > 0; }) ? 'partial' : 'due') : null;
        var old = L.rows.filter(function (r) { return r.due < (cur[0] ? cur[0].due : ym + '-99') && cur.indexOf(r) < 0 && r.rem > 0; }).reduce(function (s, r) { return s + r.rem; }, 0);
        S.b += b; S.p += p; S.r += rem; if (status === 'overdue') { S.od += rem; S.odn++; } S.debt += L.debt;
        return { st: st, L: L, cur: cur, b: b, p: p, rem: rem, n: n, status: status, old: old };
      }).filter(function (x) { return HPF === 'all' || (HPF === 'debt' ? x.L.debt > 0 : x.status === 'overdue'); });
      if (!rows.length) return '';
      var pk = cl.billing && cl.billing.mode === 'pack';
      return '<div class="card lp-hp" style="--c:' + esc(cl.color) + '"><div class="chead"><h2><span class="lp-dot"></span>' + esc(cl.name) + '</h2><span class="small muted">' + esc(billTxt(cl)) + '</span></div><div class="tblw"><table class="tbl"><thead><tr><th>Học sinh</th><th>' + (pk ? 'Gói đến hạn' : 'Số buổi') + '</th><th>Phải đóng</th><th>Đã đóng</th><th>Còn thiếu</th><th>Hạn</th><th>Trạng thái</th><th></th></tr></thead><tbody>' +
        rows.map(function (x) {
          var prog = pk && x.L.rows.length >= 0 ? K.periods(cl, cdata(cl.id), x.st, td).progress : null;
          return '<tr><td><a href="#/admin/hs/' + esc(x.st.id) + '"><b>' + esc(x.st.name) + '</b></a>' + (x.old ? '<br><span class="tiny" style="color:var(--red-dk)">+ nợ kỳ trước ' + money(x.old) + '</span>' : '') + (x.L.credit ? '<br><span class="tiny" style="color:var(--mint-dk)">dư ' + money(x.L.credit) + '</span>' : '') + '</td>' +
            '<td>' + (pk ? (x.cur.length ? x.cur.map(function (r) { return r.label; }).join(', ') : '—') + (prog ? '<br><span class="tiny muted">đang học ' + prog.done + '/' + prog.size + ' buổi gói kế</span>' : '') : x.n) + '</td><td>' + money(x.b) + '</td><td>' + money(x.p) + '</td><td>' + (x.rem > 0 ? '<b style="color:var(--red-dk)">' + money(x.rem) + '</b>' : x.b ? '<span style="color:var(--mint-dk)">0</span>' : '—') + '</td>' +
            '<td>' + (x.cur[0] ? dmyy(x.cur[0].due) : '—') + '</td><td>' + (x.status ? stTag(x.status) : '<span class="tiny muted">chưa phát sinh</span>') + '</td>' +
            '<td class="lp-tact"><button class="btn btn-sm btn-mint" data-act="lp-pay" data-s="' + esc(x.st.id) + '" data-amt="' + (x.rem + x.old) + '">＋ Thu</button><button class="btn btn-sm" data-act="lp-msg" data-s="' + esc(x.st.id) + '" data-m="' + ym + '" title="Soạn tin nhắn gửi phụ huynh">💬</button></td></tr>';
        }).join('') + '</tbody></table></div></div>';
    }).join('');
    var body = '<div class="chead"><div><h1>Học phí</h1><p class="muted">Tự tính theo quy định từng lớp từ bảng điểm danh. Tháng cũ vẫn giữ nguyên để báo cáo.</p></div>' +
      '<div class="lp-mnav"><a class="btn btn-sm" href="#/admin/hocphi/' + K.ymAdd(ym, -1) + '">‹</a><input type="month" class="inp" id="lp-mpick" value="' + ym + '" style="width:auto" aria-label="Chọn tháng"><a class="btn btn-sm" href="#/admin/hocphi/' + K.ymAdd(ym, 1) + '">›</a></div></div>' +
      '<div class="row" style="margin-bottom:14px"><div class="stat"><p class="k">Phải thu ' + ymTxt(ym).toLowerCase() + '</p><p class="v">' + money(S.b) + '</p></div><div class="stat"><p class="k">Đã thu</p><p class="v" style="color:var(--mint-dk)">' + money(S.p) + '</p></div><div class="stat"><p class="k">Còn thiếu</p><p class="v" style="color:var(--red-dk)">' + money(S.r) + '</p></div><div class="stat"><p class="k">Quá hạn</p><p class="v" style="color:var(--red-dk)">' + S.odn + ' HS · ' + money(S.od) + '</p></div></div>' +
      '<div class="seg" style="margin-bottom:12px">' + [['all', 'Tất cả'], ['debt', 'Còn nợ'], ['over', 'Quá hạn']].map(function (f) { return '<button type="button" class="' + (HPF === f[0] ? 'on' : '') + '" data-act="lp-hpf" data-f="' + f[0] + '">' + f[1] + '</button>'; }).join('') + '<button type="button" data-act="lp-csv" data-m="' + ym + '">⬇ Xuất Excel</button></div>' +
      (sections || '<p class="muted">Không có học sinh nào phù hợp.</p>');
    shell('hocphi', body);
    var mp = document.getElementById('lp-mpick'); if (mp) mp.addEventListener('change', function () { if (mp.value) LN.go('#/admin/hocphi/' + mp.value); });
  }

  /* ================= Hồ sơ học sinh: các buổi đã học, học phí, lịch sử đóng tiền ================= */
  function viewStudent(sid) {
    var x = stuOf(sid); if (!x) { LN.go('#/admin/lop'); return; }
    var cl = x.cl, st = x.st, cd = cdata(cl.id), td = today(), L = ledgerOf(cl, st), u = st.user && LN.users()[st.user];
    var months = {}, from = K.firstMonth(cl) + '-01';
    K.sessions(cl, cd, from, td).forEach(function (s) { if (!K.activeOn(st, s.date)) return; (months[K.ymOf(s.date)] = months[K.ymOf(s.date)] || []).push(s); });
    var body = '<a href="#/admin/lop/' + esc(cl.id) + '" class="backlink">← ' + esc(cl.name) + '</a><div class="lp-hero" style="--c:' + esc(cl.color) + ';--t:' + txtColor(cl.color) + '"><div><h1>' + esc(st.name) + '</h1><p>' + esc(cl.name) + ' · ' + esc(billTxt(cl)) + (st.price ? ' · giá riêng ' + money(st.price) : '') + '</p><p>' + (st.user ? '👤 Tài khoản <b>' + esc(st.user) + '</b>' + (u ? '' : ' (không tìm thấy)') : '⚠ Chưa có tài khoản học app') + '</p></div>' +
      '<div class="lp-hsum"><p>Tổng phải đóng <b>' + money(L.billed) + '</b></p><p>Đã đóng <b>' + money(L.paid) + '</b></p><p>' + (L.debt ? 'Còn nợ <b class="neg">' + money(L.debt) + '</b>' : L.credit ? 'Dư <b>' + money(L.credit) + '</b>' : '<b>✓ Không nợ</b>') + '</p></div></div>';
    if (!st.user) body += '<div class="card"><h2>Tạo tài khoản học app</h2><form id="lp-mkacc" class="two" style="align-items:end"><div class="field"><label for="lp-acc">Tên đăng nhập</label><input class="inp" id="lp-acc" name="user" value="' + esc(uname(st.name)) + '"></div><div><button class="btn btn-pink" type="submit">Tạo (mật khẩu 123456)</button></div></form><p class="tiny muted">Tên “' + esc(uname(st.name)) + '” có thể đang trùng với bạn khác – thêm số lớp hoặc chữ cái, vd. ' + esc(uname(st.name)) + (cl.grade < 100 ? cl.grade : 'up') + '.</p></div>';
    body += '<div class="card"><div class="chead"><h2>Học phí từng kỳ</h2><button class="btn btn-sm btn-mint" data-act="lp-pay" data-s="' + esc(sid) + '" data-amt="' + L.debt + '">＋ Ghi nhận đóng tiền</button></div>' +
      (L.rows.length ? '<div class="tblw"><table class="tbl"><thead><tr><th>Kỳ</th><th>Buổi</th><th>Phải đóng</th><th>Đã đóng</th><th>Còn</th><th>Hạn</th><th>Trạng thái</th></tr></thead><tbody>' + L.rows.slice().reverse().map(function (r) {
        return '<tr><td><b>' + esc(r.label) + '</b>' + (r.closed ? ' 🔒' : '') + '<br><span class="tiny muted">' + r.dates.map(dmy).join(', ') + '</span></td><td>' + r.n + '</td><td>' + money(r.amount) + '</td><td>' + money(r.paid) + '</td><td>' + (r.rem > 0 ? '<b style="color:var(--red-dk)">' + money(r.rem) + '</b>' : '0') + '</td><td>' + dmyy(r.due) + '</td><td>' + stTag(r.status) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="muted">Chưa phát sinh học phí.</p>') +
      (cl.billing && cl.billing.mode === 'pack' ? '<p class="small" style="margin-top:8px">📦 Gói đang học: <b>' + K.periods(cl, cd, st, td).progress.done + '/' + (cl.billing.size || 5) + '</b> buổi</p>' : '') + '</div>';
    body += '<div class="card"><h2>Lịch sử đóng tiền</h2>' + (L.pays.length ? '<div class="tblw"><table class="tbl"><thead><tr><th>Ngày</th><th>Số tiền</th><th>Hình thức</th><th>Ghi chú</th><th></th></tr></thead><tbody>' + L.pays.slice().reverse().map(function (p) {
      return '<tr><td>' + dmyy(p.date) + '</td><td><b>' + money(p.amount) + '</b></td><td>' + esc(p.method || '') + '</td><td>' + esc(p.note || '') + '</td><td><button class="btn btn-sm" data-act="lp-delpay" data-s="' + esc(sid) + '" data-id="' + esc(p.id) + '" aria-label="Xoá">✕</button></td></tr>';
    }).join('') + '</tbody></table></div>' : '<p class="muted">Chưa có lần đóng tiền nào.</p>') + '</div>';
    body += '<div class="card"><h2>Các buổi học</h2>' + Object.keys(months).sort().reverse().map(function (m) {
      var ss = months[m], pres = ss.filter(function (s) { return !s.off && K.mark(cd, s.key, st.id) === 1; }).length;
      return '<details class="lp-mon"' + (m === K.ymOf(td) ? ' open' : '') + '><summary><b>' + ymTxt(m) + '</b> · đi học <b>' + pres + '</b>/' + ss.filter(function (s) { return !s.off; }).length + ' buổi</summary><div class="lp-dl">' + ss.map(function (s) {
        var v = K.mark(cd, s.key, st.id), t = s.off ? ['–', 'Lớp nghỉ', 'off'] : v === 1 ? ['✅', 'Có mặt', 'p'] : v === 0 ? ['❌', 'Vắng', 'a'] : v === 2 ? ['🟡', 'Có phép', 'e'] : s.date > td ? ['·', 'Sắp tới', 'f'] : ['?', 'Chưa điểm danh', 'n'];
        return '<span class="lp-d ' + t[2] + '" title="' + t[1] + '">' + t[0] + ' ' + DOWS_S[K.dow(s.date)] + ' ' + dmy(s.date) + '</span>';
      }).join('') + '</div></details>';
    }).join('') + '</div>';
    if (!st.left) body += '<p style="margin-top:12px"><button class="btn btn-sm" data-act="lp-leave" data-s="' + esc(sid) + '">Cho bé nghỉ học từ hôm nay</button></p>';
    shell('lop', body);
    var fa = document.getElementById('lp-mkacc');
    if (fa) fa.addEventListener('submit', function (ev) {
      ev.preventDefault(); var v = uname(fa.user.value), all = LN.users();
      if (!/^[a-z0-9_]{3,20}$/.test(v)) { toast('Tên đăng nhập cần 3–20 chữ thường không dấu/số.'); return; }
      if (all[v]) { toast('“' + v + '” đã có người dùng. Chọn tên khác.'); return; }
      all[v] = { name: st.name, grade: cl.grade, pass: LN.hash(v + ':123456'), mail: '', created: Date.now(), last: 0, status: 'active', byAdmin: true, cls: cl.id, joined: today() };
      store.set('ln_users', all); var c = classes()[cl.id]; c.students.forEach(function (s) { if (s.id === sid) s.user = v; }); saveCls(c);
      toast('Đã tạo tài khoản ' + v + ' / 123456'); viewStudent(sid);
    });
  }

  /* ---- Thu tiền ---- */
  function payModal(sid, amt) {
    var x = stuOf(sid); if (!x) return;
    modal('<h2>Ghi nhận đóng tiền</h2><p class="muted">' + esc(x.st.name) + ' · ' + esc(x.cl.name) + '</p><form id="lp-payf"><div class="two"><div class="field"><label for="lp-pamt">Số tiền thực nhận (đ)</label><input class="inp" type="number" step="1000" id="lp-pamt" name="amount" value="' + (Math.max(0, +amt) || '') + '" required></div><div class="field"><label for="lp-pdate">Ngày nhận</label><input class="inp" type="date" id="lp-pdate" name="date" value="' + today() + '"></div></div>' +
      '<div class="two"><div class="field"><label for="lp-pm">Hình thức</label><select class="sel" id="lp-pm" name="method"><option>Tiền mặt</option><option>Chuyển khoản</option></select></div><div class="field"><label for="lp-pn">Ghi chú</label><input class="inp" id="lp-pn" name="note" placeholder="vd. đóng thiếu, hẹn tuần sau"></div></div>' +
      '<p class="tiny muted">Đóng thiếu cứ nhập số tiền thực nhận – phần còn lại tự ghi là còn nợ. Tiền trừ vào kỳ cũ nhất trước.</p><button class="btn btn-lg btn-pink" type="submit">Lưu</button></form>');
    document.getElementById('lp-payf').addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(ev.target), a = +d.get('amount'); if (!(a > 0)) { toast('Nhập số tiền.'); return; }
      var P = pays(); P[sid] = P[sid] || []; P[sid].push({ id: 'p' + Date.now().toString(36), date: d.get('date') || today(), amount: a, method: d.get('method'), note: String(d.get('note') || '').trim(), at: Date.now() });
      store.set('ln_pay', P); closeModal(); toast('Đã ghi nhận ' + money(a)); refresh();
    });
  }
  function msgText(sid, ym) {
    var x = stuOf(sid), cl = x.cl, st = x.st, L = ledgerOf(cl, st, ym), cur = L.rows.filter(function (r) { return r.id === ym || (r.kind === 'pack' && K.ymOf(r.due) === ym); });
    var t = 'Aurora English xin gửi phụ huynh bé ' + st.name + ' (' + cl.name + '):\n';
    cur.forEach(function (r) { t += '• ' + r.label + ': ' + r.n + ' buổi (' + r.dates.map(dmy).join(', ') + ') × ' + money(K.priceOf(cl, st)) + ' = ' + money(r.amount) + (r.paid ? ', đã đóng ' + money(r.paid) : '') + '\n'; });
    var older = L.rows.filter(function (r) { return cur.indexOf(r) < 0 && r.rem > 0; });
    older.forEach(function (r) { t += '• Còn nợ ' + r.label + ': ' + money(r.rem) + '\n'; });
    t += 'Tổng cần đóng: ' + money(L.debt) + (cur[0] ? ' – hạn ' + dmyy(cur[0].due) : '') + '.\nCảm ơn phụ huynh đã đồng hành cùng con! 💛';
    return t;
  }

  /* ---- Xuất Excel (CSV) ---- */
  function exportCsv(ym) {
    var rows = [['Lớp', 'Học sinh', 'Tài khoản', 'Kỳ', 'Số buổi', 'Ngày học', 'Đơn giá', 'Phải đóng', 'Đã đóng', 'Còn thiếu', 'Hạn', 'Trạng thái']];
    clsList().forEach(function (cl) { (cl.students || []).forEach(function (st) { ledgerOf(cl, st, ym).rows.filter(function (r) { return r.id === ym || (r.kind === 'pack' && K.ymOf(r.due) === ym); }).forEach(function (r) {
      rows.push([cl.name, st.name, st.user || '', r.label, r.n, r.dates.map(dmy).join(' '), K.priceOf(cl, st), r.amount, r.paid, r.rem, dmyy(r.due), (STL[r.status] || STL.due)[0]]);
    }); }); });
    var csv = '﻿' + rows.map(function (r) { return r.map(function (v) { v = String(v == null ? '' : v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'hoc-phi-' + ym + '.csv'; document.body.appendChild(a); a.click(); a.remove();
  }

  /* ================= Xử lý bấm nút ================= */
  var prev = LN.adminClick;
  LN.adminClick = function (a, t, ev) {
    if (!a || a.indexOf('lp-') !== 0) return prev(a, t, ev);
    var cid = t.getAttribute('data-c'), key = t.getAttribute('data-k'), sid = t.getAttribute('data-s');
    if (a === 'lp-close') return closeModal();
    if (a === 'lp-seed') { var rep = runSeed(); toast('Đã nhập ' + rep.made.length + ' tài khoản'); viewLop(); return; }
    if (a === 'lp-sess') { sessModal(cid, key); return; }
    if (a === 'lp-ctab') { CTAB[cid] = t.getAttribute('data-t'); var p = location.hash.split('/'); viewClass(cid, p[4], CTAB[cid]); return; }
    if (a === 'lp-cell') {
      var cd = cdata(cid), r = cd.att[key] = cd.att[key] || {}, v = r[sid], nv = v == null ? 1 : v === 1 ? 0 : v === 0 ? 2 : null;
      if (nv == null) delete r[sid]; else r[sid] = nv; saveCd(cid, cd);
      t.className = 'lp-c v' + (nv == null ? 'n' : nv); t.textContent = nv === 1 ? '1' : nv === 0 ? '0' : nv === 2 ? 'P' : '';
      clearTimeout(LN._lpT); LN._lpT = setTimeout(function () { var y = window.scrollY, sx = (document.querySelector('.lp-gridw') || {}).scrollLeft; refresh(); window.scrollTo(0, y); var g = document.querySelector('.lp-gridw'); if (g && sx) g.scrollLeft = sx; }, 900); return;
    }
    if (SESS && (a === 'lp-mark' || a === 'lp-allp' || a === 'lp-off' || a === 'lp-unoff' || a === 'lp-move')) {
      var c2 = SESS.cid, k2 = SESS.key, d2 = cdata(c2);
      if (a === 'lp-mark') { d2.att[k2] = d2.att[k2] || {}; d2.att[k2][sid] = +t.getAttribute('data-v'); }
      if (a === 'lp-allp') { var cl2 = classes()[c2], dt = k2.split('@')[0]; d2.att[k2] = d2.att[k2] || {}; cl2.students.forEach(function (st) { if (K.activeOn(st, dt) && d2.att[k2][st.id] == null) d2.att[k2][st.id] = 1; }); }
      if (a === 'lp-off') { var why = prompt('Lý do lớp nghỉ (vd. nghỉ lễ, cô bận):', 'Lớp nghỉ'); if (why == null) return; d2.off[k2] = why || 'Lớp nghỉ'; }
      if (a === 'lp-unoff') delete d2.off[k2];
      if (a === 'lp-move') {
        var nd = prompt('Dời sang ngày nào? (dạng ' + today() + ')', k2.split('@')[0]); if (!nd || !/^\d{4}-\d{2}-\d{2}$/.test(nd)) return;
        var nt = prompt('Giờ bắt đầu (vd. 17:00)', k2.split('@')[1]); if (!nt || !/^\d{1,2}:\d{2}$/.test(nt)) return; if (nt.length === 4) nt = '0' + nt;
        var cl3 = classes()[c2], sl = (cl3.slots || []).filter(function (s) { return s.start === k2.split('@')[1]; })[0];
        var dur = sl ? K.hm(sl.end) - K.hm(sl.start) : 90, em = K.hm(nt) + dur, endT = String(Math.floor(em / 60)).padStart(2, '0') + ':' + String(em % 60).padStart(2, '0');
        d2.off[k2] = 'Dời sang ' + dmyy(nd) + ' ' + nt; d2.extra[nd + '@' + nt] = { end: endT, note: 'Học bù buổi ' + dmyy(k2.split('@')[0]) };
        saveCd(c2, d2); closeModal(); toast('Đã dời buổi'); refresh(); return;
      }
      saveCd(c2, d2); sessModal(c2, k2); var y2 = window.scrollY; refresh(); window.scrollTo(0, y2); sessModal(c2, k2); return;
    }
    if (a === 'lp-extra') {
      var dd = prompt('Ngày học bù / học thêm (dạng ' + today() + '):', today()); if (!dd || !/^\d{4}-\d{2}-\d{2}$/.test(dd)) return;
      var tt = prompt('Giờ bắt đầu – kết thúc (vd. 17:00-18:30):', '17:00-18:30'); if (!tt) return; var m = tt.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/); if (!m) { toast('Giờ chưa đúng dạng 17:00-18:30'); return; }
      var d3 = cdata(cid), st0 = m[1].length === 4 ? '0' + m[1] : m[1]; d3.extra[dd + '@' + st0] = { end: m[2].length === 4 ? '0' + m[2] : m[2], note: 'Buổi học thêm' }; saveCd(cid, d3); toast('Đã thêm buổi ' + dmyy(dd)); refresh(); return;
    }
    if (a === 'lp-close-month') {
      var m2 = t.getAttribute('data-m'), cl4 = classes()[cid], d4 = cdata(cid), snap = {};
      if (!confirm('Chốt học phí ' + ymTxt(m2) + ' của ' + cl4.name + '? Số buổi & số tiền tháng này sẽ được giữ cố định để báo cáo.')) return;
      cl4.students.forEach(function (st) { var r = K.periods(cl4, d4, st, today(), m2).filter(function (x) { return x.id === m2; })[0]; snap[st.id] = { n: r ? r.n : 0, amount: r ? r.amount : 0 }; });
      d4.closed[m2] = { at: Date.now(), snap: snap }; saveCd(cid, d4); toast('Đã chốt ' + ymTxt(m2)); refresh(); return;
    }
    if (a === 'lp-unclose') { if (!confirm('Mở chốt để sửa điểm danh tháng này?')) return; var d5 = cdata(cid); delete d5.closed[t.getAttribute('data-m')]; saveCd(cid, d5); refresh(); return; }
    if (a === 'lp-addslot') { document.getElementById('lp-slots').insertAdjacentHTML('beforeend', slotRow()); return; }
    if (a === 'lp-delslot') { t.closest('.lp-slot').remove(); return; }
    if (a === 'lp-archive') { var c6 = classes()[cid]; c6.archived = !c6.archived; saveCls(c6); toast(c6.archived ? 'Đã lưu trữ lớp' : 'Đã bỏ lưu trữ'); LN.go('#/admin/lop'); return; }
    if (a === 'lp-newcls') {
      var nm = prompt('Tên lớp mới (vd. Lớp 6):'); if (!nm) return; var id = 'c' + Date.now().toString(36);
      saveCls({ id: id, name: nm.trim(), grade: 4, color: '#FFB27A', price: 60000, billing: { mode: 'month', size: 5, dueDay: 5, grace: 0, when: 'after' }, slots: [], students: [], order: clsList(true).length, created: Date.now() });
      CTAB[id] = 'set'; LN.go('#/admin/lop/' + id); return;
    }
    if (a === 'lp-pay') { payModal(sid, t.getAttribute('data-amt')); return; }
    if (a === 'lp-delpay') { if (!confirm('Xoá lần đóng tiền này?')) return; var P = pays(); P[sid] = (P[sid] || []).filter(function (p) { return p.id !== t.getAttribute('data-id'); }); store.set('ln_pay', P); refresh(); return; }
    if (a === 'lp-msg') {
      var tx = msgText(sid, t.getAttribute('data-m'));
      modal('<h2>Tin nhắn gửi phụ huynh</h2><textarea class="inp" id="lp-msgt" rows="9" style="width:100%">' + esc(tx) + '</textarea><p style="margin-top:10px"><button class="btn btn-pink" data-act="lp-copy">📋 Sao chép để dán vào Zalo</button></p>'); return;
    }
    if (a === 'lp-copy') { var ta = document.getElementById('lp-msgt'); ta.select(); try { navigator.clipboard.writeText(ta.value).then(function () { toast('Đã sao chép'); }, function () { document.execCommand('copy'); toast('Đã sao chép'); }); } catch (e) { document.execCommand('copy'); toast('Đã sao chép'); } return; }
    if (a === 'lp-hpf') { HPF = t.getAttribute('data-f'); refresh(); return; }
    if (a === 'lp-csv') { exportCsv(t.getAttribute('data-m')); return; }
    if (a === 'lp-leave') { if (!confirm('Cho bé nghỉ học từ hôm nay? Lịch sử học và học phí vẫn được giữ.')) return; var y = stuOf(sid), c7 = classes()[y.cl.id]; c7.students.forEach(function (s) { if (s.id === sid) s.left = today(); }); saveCls(c7); refresh(); return; }
  };
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  window.addEventListener('hashchange', closeModal);

  LN.lop = { viewLich: viewLich, viewLop: viewLop, viewClass: viewClass, viewHocPhi: viewHocPhi, viewStudent: viewStudent, runSeed: runSeed, ledgerOf: ledgerOf, stuOf: stuOf };
})();
