(function () {
  'use strict';
  var LN = window.LN, store = LN.store, esc = LN.esc, ic = LN.ic, pct = LN.pct, toast = LN.toast, chick = LN.chick, UNITS = LN.UNITS, EX = LN.EX;

  /* Tài khoản giáo viên cố định: không ai tự tạo được. Mật khẩu mặc định phải đổi ở lần đăng nhập đầu. */
  /* Admin chính: chỉ lưu mã băm của mật khẩu, không lưu mật khẩu gốc trong code */
  var DEF_USER = 'quyenntnna', DEF_HASH = '2f121mm50j6';
  function adm() {
    var a = store.get('ln_admin', null);
    if (a && a.v === 3 && a.user === DEF_USER) return a;
    return { v: 3, user: DEF_USER, name: (a && a.name && a.name !== 'Giáo viên') ? a.name : 'Quyên', pass: DEF_HASH, must: false };
  }
  function teachers() { return store.get('ln_teachers', []) || []; }
  /* Tài khoản đang đăng nhập: chủ (quản trị chính) hoặc giáo viên do chủ tạo */
  function cur() {
    var s = store.get('ln_admin_session', null); if (!s || typeof s !== 'object') return null;
    var a = adm(); if (s.user === a.user) return Object.assign({ role: 'owner' }, a);
    var t = teachers().filter(function (x) { return x.user === s.user; })[0];
    return t ? Object.assign({ role: 'teacher' }, t) : null;
  }
  function saveAcc(acc) {
    var c = Object.assign({}, acc); delete c.role;
    if (acc.role === 'owner') { c.v = 3; store.set('ln_admin', c); }
    else { var l = teachers().map(function (x) { return x.user === c.user ? c : x; }); store.set('ln_teachers', l); }
  }
  function authed() {
    var s = store.get('ln_admin_session', null);
    return !!(s && typeof s === 'object' && cur() && Date.now() - s.t < 12 * 3600000);
  }
  function fmtD(t) { if (!t) return '—'; var d = new Date(t); return d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear(); }
  function ago(t) {
    if (!t) return 'chưa học'; var m = Math.round((Date.now() - t) / 60000);
    if (m < 2) return 'vừa xong'; if (m < 60) return m + ' phút trước'; var h = Math.round(m / 60); if (h < 24) return h + ' giờ trước'; var d = Math.round(h / 24); return d + ' ngày trước';
  }
  function accCol(a) { return a == null ? 'var(--ink3)' : a >= 85 ? 'var(--mint-dk)' : a >= 70 ? 'var(--yel-dk)' : 'var(--red-dk)'; }
  function barCls(a) { return a >= 85 ? 'mint' : a >= 70 ? 'yel' : ''; }

  /* ================= Số liệu một học sinh ================= */
  function summary(un, days) {
    var u = LN.users()[un] || {}, p = LN.progOf(un), since = days ? Date.now() - days * 86400000 : 0;
    var US = (LN.UNITSETS && (LN.UNITSETS[+u.grade] || LN.UNITSETS[4])) || UNITS;
    var units = US.map(function (x) { return { u: x, s: LN.unitStat(x, p) }; });
    var unitsDone = units.filter(function (x) { return x.s.pct === 100; }).length;
    var overall = Math.round(units.reduce(function (a, x) { return a + x.s.pct; }, 0) / units.length);
    var right = 0, total = 0, games = 0;
    p.log.forEach(function (l) { if (l.t < since) return; if (l.game) { games++; return; } right += l.right; total += l.total; });
    var topics = Object.keys(p.topics).map(function (t) { var r = p.topics[t]; return { id: t, name: LN.topicName(t), r: r[0], n: r[1], acc: pct(r[0], r[1]) }; }).filter(function (x) { return x.n > 0; }).sort(function (a, b) { return b.acc - a.acc; });
    var ms = LN.openMistakes(p), mby = {};
    ms.forEach(function (m) { var t = EX[m.exId].ex.topic; mby[t] = (mby[t] || 0) + 1; });
    var answered = 0, activeDays = 0, dk = [];
    if (days) { for (var di = 0; di < days; di++) { var dd = new Date(); dd.setDate(dd.getDate() - di); dk.push(LN.dayKey(dd)); } } else dk = Object.keys(p.days);
    dk.forEach(function (k) { if (p.days[k]) { answered += p.days[k]; activeDays++; } });
    var cur = units.filter(function (x) { return x.s.pct < 100; })[0];
    return {
      un: un, u: u, p: p, units: units, unitsDone: unitsDone, overall: overall, acc: total ? pct(right, total) : null, right: right, total: total, games: games,
      topics: topics, strong: (function () { var s1 = topics.filter(function (x) { return x.n >= 5 && x.acc >= 80; }); return (s1.length ? s1 : topics.filter(function (x) { return x.n >= 5 && x.acc >= 70; })).slice(0, 3); })(), weak: topics.filter(function (x) { return x.n >= 5 && x.acc < 70; }).sort(function (a, b) { return a.acc - b.acc; }),
      mistakes: ms, mby: mby, answered: answered, activeDays: activeDays, streak: LN.streak(p), stars: p.stars, cur: cur ? cur.u : null, last: u.last
    };
  }
  function autoComment(s) {
    var first = (s.u.name || '').trim().split(/\s+/).pop();
    var t = first + ' đã hoàn thành ' + s.unitsDone + '/' + s.units.length + ' Unit (tiến độ chung ' + s.overall + '%)';
    t += s.acc != null ? ', làm đúng ' + s.acc + '% số câu luyện tập. ' : '. ';
    if (s.strong.length) t += 'Con làm tốt phần ' + s.strong.slice(0, 2).map(function (x) { return x.name; }).join(' và ') + '. ';
    if (s.weak.length) t += 'Cần ôn thêm phần ' + s.weak.slice(0, 2).map(function (x) { return x.name; }).join(' và ') + '. ';
    t += s.activeDays >= 4 ? 'Tuần qua con học đều đặn, rất đáng khen!' : 'Bố mẹ nhắc con học mỗi ngày khoảng 15 phút để giữ nhịp nhé.';
    return t;
  }

  /* ================= Khung ================= */
  function shell(active, body) {
    var a = adm();
    function nl(id, href, icon, label) { return '<a href="' + href + '" class="' + (active === id ? 'on' : '') + '">' + ic(icon, 19) + label + '</a>'; }
    LN.render('<div class="adm"><aside class="aside"><a class="brand" href="#/admin">' + LN.logo(36) + '<span class="bname">Aurora <b>English</b></span></a>' +
      '<span class="lb">Quản trị</span>' + nl('home', '#/admin', 'chart', 'Tổng quan lớp') + nl('roster', '#/admin/students', 'users', 'Sĩ số lớp') + nl('att', '#/admin/attendance', 'cal', 'Điểm danh') + nl('fees', '#/admin/fees', 'money', 'Học phí') + nl('grammar', '#/admin/grammar', 'book', 'Ngữ pháp tổng hợp') + nl('ai', '#/admin/ai', 'bot', 'Trợ lý AI Chíp') + nl('data', '#/admin/data', 'db', 'Dữ liệu & sao lưu') + nl('account', '#/admin/account', 'key', 'Tài khoản & giáo viên') +
      '<span class="lb">Khác</span><a href="#/">' + ic('eye', 19) + 'Mở trang học sinh</a><a href="#" data-act="a-logout">' + ic('out', 19) + 'Đăng xuất' + (cur() ? ' (' + esc(cur().user) + ')' : '') + '</a></aside>' +
      '<main class="amain">' + body + '</main></div>');
  }

  /* ================= Tạo admin / đăng nhập ================= */
  function viewLogin(err) {
    var lock = store.get('ln_admin_fail', { n: 0, until: 0 }), locked = lock.until > Date.now();
    LN.render('<main class="auth"><div style="flex:0 1 260px;text-align:center;padding-top:20px">' + chick(160) + '<div class="bubble" style="margin-top:14px;text-align:left">Trang này chỉ dành cho giáo viên. Học sinh không đăng nhập ở đây.</div></div><div class="auth-card"><h1 style="font-size:30px;margin-bottom:6px">🔒 Đăng nhập giáo viên</h1><p class="muted small" style="margin-bottom:16px">Không có chức năng tự tạo tài khoản giáo viên.</p>' +
      (err ? '<div class="ferr" role="alert">' + esc(err) + '</div>' : '') +
      '<form id="f-alog" novalidate><div class="field"><label for="al-user">Tên đăng nhập</label><input class="inp" id="al-user" name="user" autocomplete="username" autocapitalize="none" spellcheck="false"></div>' + LN.passField('al-pass', 'pass', 'Mật khẩu', 'current-password') +
      '<button class="btn btn-lg btn-pink btn-block" type="submit"' + (locked ? ' disabled' : '') + '>Đăng nhập</button></form><p class="small muted" style="margin-top:14px;text-align:center"><a href="#/">← Về trang học sinh</a></p></div></main>');
    document.getElementById('f-alog').addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(ev.target), user = String(d.get('user') || '').trim().toLowerCase(), pw = String(d.get('pass') || '');
      var a = adm().user === user ? adm() : teachers().filter(function (x) { return x.user === user; })[0] || { user: '', pass: '' };
      var lk = store.get('ln_admin_fail', { n: 0, until: 0 });
      if (lk.until > Date.now()) return viewLogin('Đăng nhập sai nhiều lần. Thử lại sau ' + Math.ceil((lk.until - Date.now()) / 1000) + ' giây.');
      if (a.user !== user || a.pass !== LN.hash('admin:' + user + ':' + pw)) {
        lk.n = (lk.n || 0) + 1; if (lk.n >= 5) { lk.until = Date.now() + 60000 * Math.min(10, lk.n - 4); }
        store.set('ln_admin_fail', lk); return viewLogin(lk.until > Date.now() ? 'Sai 5 lần liên tiếp. Tạm khoá ' + Math.min(10, lk.n - 4) + ' phút.' : 'Sai tên đăng nhập hoặc mật khẩu.');
      }
      store.del('ln_admin_fail'); store.set('ln_admin_session', { user: user, t: Date.now(), role: adm().user === user ? 'owner' : 'teacher' });
      if (a.must) { viewForceChange(); return; } LN.route();
    });
  }
  function viewForceChange(err) {
    LN.render('<main class="auth"><div style="flex:0 1 260px;text-align:center;padding-top:20px">' + chick(160, 'wow') + '</div><div class="auth-card"><h1 style="font-size:28px;margin-bottom:6px">Đặt mật khẩu riêng</h1><p class="muted small" style="margin-bottom:16px">Đây là lần đầu đăng nhập bằng mật khẩu mặc định. Hãy đặt mật khẩu mới chỉ mình bạn biết.</p>' +
      (err ? '<div class="ferr" role="alert">' + esc(err) + '</div>' : '') +
      '<form id="f-fc" novalidate><div class="field"><label for="fc-name">Tên hiển thị trên phiếu báo cáo</label><input class="inp" id="fc-name" name="name" placeholder="Cô Quyên" value="' + esc(cur().name === 'Giáo viên' ? '' : cur().name) + '"></div>' +
      LN.passField('fc-new', 'new', 'Mật khẩu mới (ít nhất 8 ký tự)', 'new-password') + LN.passField('fc-new2', 'new2', 'Nhập lại mật khẩu mới', 'new-password') +
      '<button class="btn btn-lg btn-pink btn-block" type="submit">Lưu và vào trang giáo viên</button></form></div></main>');
    document.getElementById('f-fc').addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(ev.target), nw = String(d.get('new') || '');
      if (nw.length < 8) return viewForceChange('Mật khẩu mới cần ít nhất 8 ký tự.');
      if (nw !== d.get('new2')) return viewForceChange('Hai lần nhập chưa khớp.');
      var a = cur(); if (a.pass === LN.hash('admin:' + a.user + ':' + nw)) return viewForceChange('Hãy chọn mật khẩu khác mật khẩu được cấp.');
      a.pass = LN.hash('admin:' + a.user + ':' + nw); a.must = false; a.name = String(d.get('name') || '').trim() || a.name;
      saveAcc(a); toast('Đã lưu mật khẩu mới'); LN.go('#/admin');
    });
  }

  /* ================= Tổng quan lớp ================= */
  var SORT = { k: 'name', d: 1 };
  function students() { var all = LN.users(); return Object.keys(all).map(function (un) { return summary(un, 7); }); }
  function viewOverview() {
    var list = students();
    var keyf = { name: function (s) { return (s.u.name || '').split(/\s+/).pop().toLowerCase(); }, prog: function (s) { return s.overall; }, acc: function (s) { return s.acc == null ? -1 : s.acc; }, mis: function (s) { return s.mistakes.length; }, last: function (s) { return s.last || 0; }, days: function (s) { return s.activeDays; } };
    list.sort(function (a, b) { var x = keyf[SORT.k](a), y = keyf[SORT.k](b); return (x > y ? 1 : x < y ? -1 : 0) * SORT.d; });
    var act = list.filter(function (s) { return s.last && Date.now() - s.last < 7 * 86400000; }).length;
    var accs = list.filter(function (s) { return s.acc != null; });
    var avgAcc = accs.length ? Math.round(accs.reduce(function (a, s) { return a + s.acc; }, 0) / accs.length) : null;
    var agg = {}; list.forEach(function (s) { s.topics.forEach(function (t) { agg[t.id] = agg[t.id] || [0, 0, t.name]; agg[t.id][0] += t.r; agg[t.id][1] += t.n; }); });
    var cls = Object.keys(agg).map(function (k) { return { name: agg[k][2], acc: pct(agg[k][0], agg[k][1]), n: agg[k][1] }; }).filter(function (x) { return x.n >= 5; }).sort(function (a, b) { return a.acc - b.acc; });
    function th(k, label) { return '<th><button data-act="a-sort" data-k="' + k + '">' + label + (SORT.k === k ? (SORT.d > 0 ? ' ▲' : ' ▼') : '') + '</button></th>'; }
    var body = '<div class="chead"><div><h1>Tổng quan lớp</h1><p class="muted">Số liệu lấy từ các tài khoản học sinh trên trình duyệt này.</p></div>' + (list.length ? '' : '<button class="btn btn-yel" data-act="a-demo">Tạo dữ liệu mẫu để xem thử</button>') + '</div>' +
      '<div class="row" style="margin:16px 0 18px">' +
      '<div class="stat"><p class="k">Học sinh</p><p class="v">' + list.length + '</p></div>' +
      '<div class="stat"><p class="k">Có học trong 7 ngày</p><p class="v">' + act + '</p></div>' +
      '<div class="stat"><p class="k">Độ chính xác trung bình</p><p class="v" style="color:' + accCol(avgAcc) + '">' + (avgAcc == null ? '—' : avgAcc + '%') + '</p></div>' +
      '<div class="stat"><p class="k">Câu sai chưa ôn (cả lớp)</p><p class="v">' + list.reduce(function (a, s) { return a + s.mistakes.length; }, 0) + '</p></div></div>' +
      (list.length ? '<div class="card" style="margin-bottom:18px"><div class="chead"><h2>Danh sách học sinh</h2><input class="inp" style="max-width:260px;min-height:42px" id="a-search" placeholder="Tìm theo tên…" aria-label="Tìm học sinh"></div><div class="tblw"><table class="tbl"><thead><tr>' +
        th('name', 'Học sinh') + th('prog', 'Tiến độ') + th('acc', 'Chính xác') + th('mis', 'Câu sai') + th('days', 'Ngày học / 7') + th('last', 'Lần cuối') + '<th>Vắng / 30 ngày</th><th>Học phí thiếu</th><th></th></tr></thead><tbody>' +
        list.map(function (s) {
          return '<tr class="click" data-name="' + esc((s.u.name || '').toLowerCase()) + '" data-act="a-open" data-u="' + esc(s.un) + '"><td><b>' + esc(s.u.name) + '</b>' + (s.u.demo ? ' <span class="tag tag-yel">mẫu</span>' : '') + '</td>' +
            '<td><span class="bar thin"><i style="width:' + s.overall + '%"></i></span>' + s.overall + '% <span class="tiny muted">· ' + s.unitsDone + '/' + s.units.length + ' Unit</span></td>' +
            '<td style="color:' + accCol(s.acc) + ';font-weight:800">' + (s.acc == null ? '—' : s.acc + '%') + '</td><td>' + s.mistakes.length + '</td><td>' + s.activeDays + '</td><td class="small muted">' + ago(s.last) + '</td>' +
            (function () { var a = attOf(s.un, 30), f = feeStatus(s.un); return '<td>' + (a.e + a.a ? '<b style="color:var(--red-dk)">' + (a.e + a.a) + '</b>' : '0') + '</td><td>' + (f.owed ? '<span class="owed sm">' + money(f.owed) + '</span>' : '<span style="color:var(--mint-dk);font-weight:800">Đủ</span>') + '</td>'; })() +
            '<td><a class="btn btn-sm" href="#/admin/report/' + encodeURIComponent(s.un) + '">' + ic('img', 16) + 'Phiếu</a></td></tr>';
        }).join('') + '</tbody></table></div></div>' +
        '<div class="card"><h2>Cả lớp đang yếu phần nào</h2>' + (cls.length ? cls.slice(0, 8).map(function (x) { return '<div class="hbar"><span class="nm">' + esc(x.name) + '</span><span class="bar ' + barCls(x.acc) + '"><i style="width:' + x.acc + '%"></i></span><span class="v" style="color:' + accCol(x.acc) + '">' + x.acc + '%</span></div>'; }).join('') : '<p class="muted small">Chưa đủ dữ liệu.</p>') + '</div>'
        : '<div class="card empty">' + chick(130) + '<h2>Chưa có học sinh nào</h2><p class="muted">Học sinh đăng ký ở trang chính sẽ hiện ở đây. Bấm "Tạo dữ liệu mẫu" để xem thử giao diện.</p></div>');
    shell('home', body);
    var sInp = document.getElementById('a-search');
    if (sInp) sInp.addEventListener('input', function () { var q = sInp.value.trim().toLowerCase(); document.querySelectorAll('tr[data-name]').forEach(function (r) { r.style.display = r.getAttribute('data-name').indexOf(q) >= 0 ? '' : 'none'; }); });
  }

  /* ================= Chi tiết học sinh ================= */
  function cols14(p) {
    var d = new Date(); d.setDate(d.getDate() - 13); var arr = [];
    for (var i = 0; i < 14; i++) { arr.push({ k: LN.dayKey(d), n: p.days[LN.dayKey(d)] || 0, l: d.getDate() + '/' + (d.getMonth() + 1), t: i === 13 }); d.setDate(d.getDate() + 1); }
    var mx = Math.max.apply(null, arr.map(function (x) { return x.n; }).concat([1]));
    return '<div class="cols">' + arr.map(function (x) { return '<div class="c' + (x.t ? ' t' : '') + '"><b>' + (x.n || '') + '</b><i style="height:' + Math.max(3, Math.round(x.n / mx * 118)) + 'px"></i></div>'; }).join('') + '</div><div class="colsx">' + arr.map(function (x) { return '<span>' + (x.t ? 'Nay' : x.l) + '</span>'; }).join('') + '</div>';
  }
  function viewStudent(un) {
    if (!LN.users()[un]) { LN.go('#/admin'); return; }
    var s = summary(un, 0), s7 = summary(un, 7), note = store.get('ln_note_' + un, '');
    var top = s.mistakes.slice().sort(function (a, b) { return b.n - a.n; }).slice(0, 6);
    var body = '<p class="small muted"><a href="#/admin">Tổng quan lớp</a> · Học sinh</p>' +
      '<div class="card" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin:10px 0 16px"><span class="ava" style="width:64px;height:64px;font-size:28px">' + esc((s.u.name || '?').trim().split(/\s+/).pop().charAt(0)) + '</span>' +
      '<div style="flex:1 1 260px"><h1 style="font-size:30px">' + esc(s.u.name) + '</h1><p class="muted small">@' + esc(un) + ' · ' + LN.gradeName(s.u.grade) + ' · phụ huynh: ' + esc(s.u.mail || '—') + ' · tạo ngày ' + fmtD(s.u.created) + ' · học lần cuối ' + ago(s.last) + '</p></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn btn-pink" href="#/admin/report/' + encodeURIComponent(un) + '">' + ic('img', 18) + 'Phiếu báo cáo (ảnh)</a><button class="btn" data-act="a-resetpw" data-u="' + esc(un) + '">' + ic('key', 17) + 'Đặt lại mật khẩu</button><button class="btn" data-act="a-del" data-u="' + esc(un) + '">' + ic('trash', 17) + 'Xoá</button></div></div>' +
      '<div class="row" style="margin-bottom:16px">' +
      '<div class="stat"><p class="k">Tiến độ chung</p><p class="v">' + s.overall + '%</p></div><div class="stat"><p class="k">Unit hoàn thành</p><p class="v">' + s.unitsDone + '/20</p></div>' +
      '<div class="stat"><p class="k">Độ chính xác</p><p class="v" style="color:' + accCol(s.acc) + '">' + (s.acc == null ? '—' : s.acc + '%') + '</p></div><div class="stat"><p class="k">Câu đã làm</p><p class="v">' + s.answered + '</p></div>' +
      '<div class="stat"><p class="k">Học tuần này</p><p class="v">' + s7.activeDays + '/7 ngày</p></div><div class="stat"><p class="k">Sao · chuỗi ngày</p><p class="v">⭐' + s.stars + ' · 🔥' + s.streak + '</p></div></div>' +
      '<div class="row" style="margin-bottom:16px;align-items:flex-start"><div class="card grow"><div class="chead"><h2>Tiến độ ' + s.units.length + ' Unit</h2>' + (s.cur ? '<span class="tag tag-pink">Đang học Unit ' + s.cur.n + '</span>' : '<span class="tag tag-mint">Xong cả ' + s.units.length + ' Unit</span>') + '</div><div class="ugrid">' +
      s.units.map(function (x) { return '<div class="ucell"><p class="t"><span>' + x.u.icon + ' Unit ' + x.u.n + '</span><span style="color:' + (x.s.pct === 100 ? 'var(--mint-dk)' : 'var(--ink2)') + '">' + x.s.pct + '%</span></p><div class="bar thin ' + (x.s.pct === 100 ? 'mint' : '') + '"><i style="width:' + x.s.pct + '%"></i></div>' + (x.s.avg != null ? '<p class="tiny muted" style="margin-top:4px">điểm TB ' + x.s.avg + '%</p>' : '') + '</div>'; }).join('') + '</div></div>' +
      '<div class="card side"><h2>Học lực theo phần</h2>' + (s.topics.length ? s.topics.map(function (x) { return '<div class="hb2"><p><span>' + esc(x.name) + ' <span class="tiny muted">· ' + x.n + ' câu</span></span><b style="color:' + accCol(x.acc) + '">' + x.acc + '%</b></p><span class="bar ' + barCls(x.acc) + '"><i style="width:' + x.acc + '%"></i></span></div>'; }).join('') : '<p class="muted small">Bé chưa làm bài nào.</p>') + '</div></div>' +
      '<div class="row" style="margin-bottom:16px;align-items:flex-start"><div class="card grow"><h2>Số câu làm mỗi ngày · 14 ngày</h2>' + cols14(s.p) + '</div>' +
      '<div class="card side"><h2>Chỗ còn yếu</h2>' + (s.weak.length ? s.weak.map(function (x) { return '<div class="wl" style="padding:8px 0"><b style="color:var(--red-dk)">' + esc(x.name) + '</b> · đúng ' + x.acc + '% · ' + (s.mby[x.id] || 0) + ' câu sai chưa ôn</div>'; }).join('') : '<p class="small muted">Chưa có phần nào dưới 70%.</p>') +
      (top.length ? '<p class="head" style="font-size:17px;margin:14px 0 4px">Câu sai nhiều lần</p>' + top.map(function (m) { var it = LN.itemFrom(m.exId, m.idx); return '<div class="wl" style="padding:8px 0"><p class="small" style="font-weight:800">' + esc(it.type === 'order' ? it.w.split('/').join(' / ') : it.q) + '</p><p class="tiny r">Đáp án: ' + esc(LN.answerText(it)) + ' · sai ' + m.n + ' lần</p></div>'; }).join('') : '') + '</div></div>' +
      (function () { var a = attOf(un, 30), f = feeStatus(un); return '<div class="row" style="margin-bottom:16px;align-items:stretch"><div class="card grow"><div class="chead"><h2>Chuyên cần 30 ngày</h2><a class="btn btn-sm" href="#/admin/attendance">Điểm danh</a></div>' +
        (a.total ? '<p style="font-size:20px"><b style="color:var(--mint-dk);font-size:30px">' + a.present + '/' + a.total + '</b> buổi có mặt</p><p class="small muted">Vắng có phép ' + a.e + ' · Vắng không phép <b style="color:' + (a.a ? 'var(--red-dk)' : 'inherit') + '">' + a.a + '</b> · Đi muộn ' + a.l + '</p>' : '<p class="muted small">Chưa có buổi điểm danh.</p>') + '</div>' +
        '<div class="card side' + (f.owed ? ' owedcard' : '') + '"><div class="chead"><h2>Học phí</h2><a class="btn btn-sm" href="#/admin/fees">Quản lý</a></div>' + (f.owed ? '<p class="owed">' + money(f.owed) + '</p><p class="small" style="margin-top:6px">Còn thiếu tháng: ' + f.unpaid.map(function (x) { return 'T' + ymLabel(x.m); }).join(', ') + '</p>' : '<p style="color:var(--mint-dk);font-weight:800;font-size:22px">Đã đóng đủ ✓</p>') + '<p class="tiny muted" style="margin-top:6px">' + money(f.fee) + '/tháng · đã đóng ' + money(f.paid) + '</p></div></div>'; })() +
      '<div class="card" style="margin-bottom:16px"><div class="chead"><h2>Nhận xét của giáo viên</h2><div style="display:flex;gap:8px;align-items:center">' + autosaveTag() + '<button class="btn btn-sm" data-act="a-autocmt" data-u="' + esc(un) + '">✨ Gợi ý nhận xét</button></div></div><textarea class="ta" id="a-note" data-u="' + esc(un) + '" rows="4" placeholder="Viết nhận xét — tự động lưu và in lên phiếu báo cáo gửi phụ huynh">' + esc(note) + '</textarea></div>' +
      '<div class="card"><h2>Lịch sử làm bài gần đây</h2>' + (s.p.log.length ? '<div class="tblw"><table class="tbl"><thead><tr><th>Bài</th><th>Kết quả</th><th>Thời gian</th></tr></thead><tbody>' + s.p.log.slice(-12).reverse().map(function (l) { var a = pct(l.right, l.total); return '<tr><td>' + esc(l.title) + '</td><td style="color:' + accCol(a) + ';font-weight:800">' + l.right + '/' + l.total + '</td><td class="small muted">' + ago(l.t) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted small">Chưa có.</p>') + '</div>';
    shell('roster', body);
    var nt = document.getElementById('a-note');
    nt.addEventListener('input', function () { clearTimeout(nt._t); nt._t = setTimeout(function () { store.set('ln_note_' + un, nt.value); saved(); }, 400); });
  }

  /* ================= Phiếu báo cáo (ảnh) ================= */
  var RP = {};
  function viewReport(un) {
    if (!LN.users()[un]) { LN.go('#/admin'); return; }
    var s = summary(un, 0);
    RP = { un: un, days: RP.un === un ? RP.days : 7, comment: store.get('ln_note_' + un, '') || autoComment(summary(un, 7)), teacher: klass().teacher || (cur() || {}).name || '' };
    var body = '<p class="small muted"><a href="#/admin">Tổng quan lớp</a> · <a href="#/admin/s/' + encodeURIComponent(un) + '">' + esc(s.u.name) + '</a> · Phiếu báo cáo</p><h1 style="margin:6px 0 16px">Phiếu báo cáo gửi phụ huynh</h1>' +
      '<div class="row" style="align-items:flex-start"><div class="report-prev grow"><canvas id="rp-cv" aria-label="Ảnh phiếu báo cáo của ' + esc(s.u.name) + '"></canvas></div>' +
      '<div class="card side"><div class="field"><label for="rp-days">Khoảng thời gian</label><select class="sel" id="rp-days"><option value="7">7 ngày gần nhất</option><option value="30">30 ngày gần nhất</option><option value="0">Từ khi bắt đầu</option></select></div>' +
      '<div class="field"><label for="rp-cmt">Nhận xét in trên phiếu ' + autosaveTag() + '</label><textarea class="ta" id="rp-cmt" rows="7">' + esc(RP.comment) + '</textarea><button class="btn btn-sm" style="margin-top:8px" data-act="a-rpauto">✨ Viết lại tự động</button></div>' +
      (function () { var f = feeStatus(un); return '<div class="field"><label>Học phí</label>' + (f.owed ? '<div class="owedbox"><b>Còn thiếu ' + money(f.owed) + '</b><br><span class="small">Tháng ' + f.unpaid.map(function (x) { return ymLabel(x.m); }).join(', ') + '</span></div>' : '<div class="tag tag-mint">Đã đóng đủ</div>') + ' <a class="small" href="#/admin/fees">Sửa ở trang Học phí →</a></div>'; })() +
      '<div class="field"><label for="rp-teacher">Giáo viên</label><input class="inp" id="rp-teacher" value="' + esc(RP.teacher) + '"></div>' +
      '<button class="btn btn-lg btn-pink btn-block" data-act="a-rpdown">' + ic('down', 19) + 'Tải ảnh PNG</button><p class="tiny muted" style="margin-top:10px">Ảnh khổ dọc 1080×1900, gửi qua Zalo hoặc Messenger rõ nét. Nhận xét tự lưu; chuyên cần và học phí lấy tự động từ trang Điểm danh và Học phí.</p></div></div>';
    shell('roster', body);
    document.getElementById('rp-days').value = String(RP.days);
    var redraw = function () { RP.days = +document.getElementById('rp-days').value; RP.comment = document.getElementById('rp-cmt').value; RP.teacher = document.getElementById('rp-teacher').value; drawReport2(); clearTimeout(RP._t); RP._t = setTimeout(function () { store.set('ln_note_' + un, RP.comment); var c = store.get('ln_class', {}); c.teacher = RP.teacher; store.set('ln_class', c); saved(); }, 400); };
    ['rp-days', 'rp-cmt', 'rp-teacher'].forEach(function (id) { document.getElementById(id).addEventListener('input', redraw); document.getElementById(id).addEventListener('change', redraw); });
    var ready = document.fonts && document.fonts.load ? Promise.all([document.fonts.load('700 40px "Mali"'), document.fonts.load('700 24px "Quicksand"'), document.fonts.load('600 24px "Quicksand"')]).catch(function () {}) : Promise.resolve();
    drawReport2(); ready.then(drawReport2);
  }
  function rr(c, x, y, w, h, r, fill, stroke) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.strokeStyle = stroke; c.lineWidth = 3; c.stroke(); } }
  function wrap(c, text, maxW) { var words = String(text).split(/\s+/), lines = [], cur = ''; words.forEach(function (w) { var t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }); if (cur) lines.push(cur); return lines; }
  function drawChick(c, x, y, s) {
    var k = s / 120; c.save(); c.translate(x, y); c.scale(k, k);
    c.fillStyle = '#FFBE1A'; c.beginPath(); c.ellipse(17, 72, 10, 17, 0.44, 0, 7); c.fill(); c.beginPath(); c.ellipse(103, 72, 10, 17, -0.44, 0, 7); c.fill();
    c.fillStyle = '#FFD24D'; c.beginPath(); c.arc(60, 64, 44, 0, 7); c.fill();
    c.fillStyle = '#FFE79A'; c.beginPath(); c.ellipse(60, 80, 27, 22, 0, 0, 7); c.fill();
    c.strokeStyle = '#3B2A3A'; c.lineWidth = 4.5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(38, 58); c.quadraticCurveTo(46, 49, 54, 58); c.stroke(); c.beginPath(); c.moveTo(66, 58); c.quadraticCurveTo(74, 49, 82, 58); c.stroke();
    c.fillStyle = 'rgba(242,85,139,0.45)'; c.beginPath(); c.ellipse(34, 70, 7.5, 5, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(86, 70, 7.5, 5, 0, 0, 7); c.fill();
    c.fillStyle = '#F28C28'; c.beginPath(); c.moveTo(52, 66); c.lineTo(68, 66); c.lineTo(60, 76); c.closePath(); c.fill();
    c.fillStyle = '#F2558B'; c.beginPath(); c.ellipse(93, 22, 7, 5, 0.4, 0, 7); c.fill(); c.beginPath(); c.ellipse(80, 26, 7, 5, -0.4, 0, 7); c.fill(); c.fillStyle = '#C93A6C'; c.beginPath(); c.arc(86, 24, 3.6, 0, 7); c.fill();
    c.restore();
  }
  function drawReport() {
    var cv = document.getElementById('rp-cv'); if (!cv) return;
    var s = summary(RP.un, RP.days), all = summary(RP.un, 0), W = 1080, H = 1620, c = cv.getContext('2d');
    cv.width = W; cv.height = H;
    var HEAD = '"Mali", "Quicksand", sans-serif', BODY = '"Quicksand", system-ui, sans-serif';
    var INK = '#3B2A3A', INK2 = '#75606F';
    c.fillStyle = '#FFF8EE'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#FFF4CF'; c.beginPath(); c.arc(1010, 1540, 190, 0, 7); c.fill(); c.fillStyle = '#FFE6EE'; c.beginPath(); c.arc(60, 1570, 120, 0, 7); c.fill();
    rr(c, 40, 40, 1000, 230, 44, '#FFE6EE');
    c.fillStyle = '#C93A6C'; c.font = '800 58px ' + HEAD; c.fillText('PHIẾU BÁO CÁO HỌC TẬP', 84, 132);
    c.fillStyle = INK2; c.font = '700 30px ' + BODY; c.fillText('Tiếng Anh lớp 4 · Lớp Nhỏ', 86, 182);
    var to = new Date(), from = RP.days ? new Date(Date.now() - (RP.days - 1) * 86400000) : (all.u.created ? new Date(all.u.created) : new Date());
    c.font = '600 26px ' + BODY; c.fillText((RP.days ? RP.days + ' ngày: ' : 'Toàn bộ: ') + fmtD(from) + ' – ' + fmtD(to), 86, 228);
    drawChick(c, 820, 52, 200);
    c.fillStyle = INK; c.font = '800 60px ' + HEAD; c.fillText(all.u.name || '', 60, 360);
    c.fillStyle = INK2; c.font = '600 26px ' + BODY; c.fillText(LN.gradeName(all.u.grade) + (all.cur ? ' · đang học Unit ' + all.cur.n + ': ' + all.cur.title : ' · đã xong cả ' + all.units.length + ' Unit'), 62, 402);
    var st = [['Unit đã xong', all.unitsDone + '/' + all.units.length, '#FFE6EE', '#C93A6C'], ['Độ chính xác', s.acc == null ? '—' : s.acc + '%', '#DDF6EC', '#1E8A63'], ['Câu đã làm', String(s.answered), '#FFF4CF', '#8A6200'], ['Ngày có học', s.activeDays + (RP.days ? '/' + RP.days : '') , '#E2F1FD', '#2E7CC0']];
    st.forEach(function (x, i) { var X = 40 + i * 255; rr(c, X, 436, 235, 150, 30, x[2]); c.fillStyle = x[3]; c.font = '800 58px ' + HEAD; c.fillText(x[1], X + 26, 520); c.fillStyle = INK2; c.font = '700 24px ' + BODY; c.fillText(x[0], X + 28, 562); });
    rr(c, 40, 616, 1000, 520, 34, '#FFFFFF', '#F2DDE3');
    c.fillStyle = INK; c.font = '800 34px ' + HEAD; c.fillText('Tiến độ các Unit', 76, 674);
    c.fillStyle = INK2; c.font = '600 22px ' + BODY; c.fillText('Tiến độ chung ' + all.overall + '%', 790, 672);
    all.units.forEach(function (x, i) {
      var col = i < 10 ? 0 : 1, row = i % 10, X = 76 + col * 490, Y = 712 + row * 41;
      c.fillStyle = INK; c.font = '700 21px ' + BODY; var lab = 'U' + x.u.n + ' ' + x.u.title; if (lab.length > 22) lab = lab.slice(0, 21) + '…'; c.fillText(lab, X, Y + 20);
      rr(c, X + 262, Y + 4, 140, 18, 9, '#F6E9EE'); if (x.s.pct) rr(c, X + 262, Y + 4, Math.max(18, 140 * x.s.pct / 100), 18, 9, x.s.pct === 100 ? '#2FB383' : '#F2558B');
      c.fillStyle = x.s.pct === 100 ? '#1E8A63' : INK2; c.font = '800 20px ' + BODY; c.fillText(x.s.pct + '%', X + 412, Y + 21);
    });
    function box(X, title, items, bg, fg, empty) {
      rr(c, X, 1160, 490, 196, 30, bg); c.fillStyle = fg; c.font = '800 30px ' + HEAD; c.fillText(title, X + 28, 1210);
      c.fillStyle = INK; c.font = '700 24px ' + BODY;
      if (!items.length) { c.fillStyle = INK2; c.font = '600 22px ' + BODY; wrap(c, empty, 430).slice(0, 3).forEach(function (l, i) { c.fillText(l, X + 28, 1252 + i * 32); }); return; }
      c.font = '700 22px ' + BODY;
      items.slice(0, 3).forEach(function (t, i) { var nm = t.name, tail = ' — ' + t.acc + '%'; while (c.measureText('• ' + nm + tail).width > 440 && nm.length > 4) nm = nm.slice(0, -2); if (nm !== t.name) nm = nm.replace(/\s+$/, '') + '…'; c.fillText('• ' + nm + tail, X + 28, 1254 + i * 38); });
    }
    box(40, 'Điểm mạnh', all.strong, '#DDF6EC', '#1E8A63', all.topics.length ? 'Con đang tiến bộ đều ở các phần.' : 'Con chưa làm đủ bài để đánh giá.');
    box(550, 'Cần cố gắng', all.weak, '#FFE6EE', '#C93A6C', 'Chưa có phần nào dưới 70%. Tốt lắm!');
    rr(c, 40, 1380, 1000, 168, 30, '#FFFFFF', '#FFE494');
    c.fillStyle = '#8A6200'; c.font = '800 28px ' + HEAD; c.fillText('Nhận xét của giáo viên', 72, 1426);
    c.fillStyle = INK; c.font = '600 23px ' + BODY;
    var lines = wrap(c, RP.comment || '', 936); if (lines.length > 4) { lines = lines.slice(0, 4); lines[3] = lines[3].replace(/.{0,2}$/, '…'); }
    lines.forEach(function (l, i) { c.fillText(l, 72, 1464 + i * 30); });
    c.fillStyle = INK2; c.font = '700 22px ' + BODY; c.fillText((RP.teacher ? 'Giáo viên: ' + RP.teacher + '   ·   ' : '') + 'Ngày lập: ' + fmtD(Date.now()), 44, 1590);
    c.fillStyle = '#C93A6C'; c.font = '800 24px ' + HEAD; c.textAlign = 'right'; c.fillText('⭐ ' + all.stars + ' sao   🔥 ' + all.streak + ' ngày', 1036, 1590); c.textAlign = 'left';
  }

  /* ================= Ngữ pháp tổng hợp (soạn thảo) ================= */
  var GHELP = '<details class="ghelp-box"><summary>📖 Cách viết nội dung (bấm để xem)</summary><div class="small">' +
    '<p><code># Tiêu đề phần</code> → mở một khung mới (mỗi thì / mỗi cấu trúc một khung)</p><p><code>## Tiêu đề nhỏ</code> → tiêu đề trong khung</p>' +
    '<p><code>| Dạng câu | Công thức | Ví dụ |</code> → bảng, dòng đầu là tiêu đề. Ô đầu ghi <code>(+) Khẳng định</code>, <code>(–) Phủ định</code>, <code>(?) Nghi vấn</code>, <code>Trả lời ngắn</code>, <code>Câu hỏi Wh-</code> sẽ tự tô màu.</p>' +
    '<p><code>- ý</code> → gạch đầu dòng · <code>@ always, usually</code> → dấu hiệu nhận biết</p><p><code>&gt; She plays. || Cô ấy chơi.</code> → câu ví dụ có nút nghe + dịch</p>' +
    '<p><code>! ...</code> → ô Lưu ý · <code>!! Sai: ... → Đúng: ...</code> → ô Lỗi hay gặp · <code>**chữ đậm**</code></p></div></details>';
  function viewGrammarAdmin(tid) {
    var b = LN.grammarBody(tid, { base: '#/admin/grammar/', admin: true }), t = b.t, groups = [];
    LN.grammar().forEach(function (x) { if (x.group && groups.indexOf(x.group) < 0) groups.push(x.group); });
    var body = t ? (t.body != null ? t.body : LN.oldToMark(t)) : '';
    var edit = '<aside class="gedit" aria-label="Soạn thảo"><h3>✏️ Soạn nội dung</h3><p class="tiny muted" style="margin-bottom:12px">Chỉ giáo viên thấy ô này. Học sinh thấy phần nội dung ở giữa.</p>' +
      (t ? '<form id="g-form" novalidate><div class="two"><div class="field"><label for="g-block">Khối</label><select class="sel" id="g-block" name="block">' + LN.BLOCKS().map(function (bk) { return '<option value="' + bk.id + '"' + ((t.block || 'other') === bk.id ? ' selected' : '') + '>' + esc(bk.title) + '</option>'; }).join('') + '</select></div><div class="field"><label for="g-icon">Biểu tượng</label><input class="inp" id="g-icon" name="icon" value="' + esc(t.icon || '') + '" maxlength="4"></div></div>' +
        '<div class="field"><label for="g-group">Nhóm</label><input class="inp" id="g-group" name="group" list="g-groups" value="' + esc(t.group || '') + '"><datalist id="g-groups">' + groups.map(function (g) { return '<option value="' + esc(g) + '">'; }).join('') + '</datalist></div>' +
        '<div class="field"><label for="g-title">Tên chủ điểm</label><input class="inp" id="g-title" name="title" value="' + esc(t.title) + '"></div>' +
        '<div class="field"><label for="g-en">Tên tiếng Anh (không bắt buộc)</label><input class="inp" id="g-en" name="en" value="' + esc(t.en || '') + '"></div>' +
        '<div class="field"><label for="g-sum">Tóm tắt (1–2 câu)</label><textarea class="ta" id="g-sum" name="summary" rows="2">' + esc(t.summary || '') + '</textarea></div>' +
        '<div class="field"><label for="g-body">Nội dung chi tiết</label><textarea class="ta mono" id="g-body" name="body" rows="18" spellcheck="false">' + esc(body) + '</textarea>' + GHELP + '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-pink grow" type="submit">Lưu thay đổi</button><button class="btn" type="button" data-act="g-preview">👁 Xem trước</button></div></form>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="btn btn-sm" data-act="g-up">' + ic('up', 15) + 'Lên</button><button class="btn btn-sm" data-act="g-down">' + ic('down', 15) + 'Xuống</button><button class="btn btn-sm" data-act="g-del">' + ic('trash', 15) + 'Xoá</button>' + (window.GRAMMAR_DEFAULT.some(function (d) { return d.id === t.id; }) ? '<button class="btn btn-sm" data-act="g-restore">↺ Nội dung gốc</button>' : '') + '</div>' : '') +
      '<hr style="border:none;border-top:2px dashed var(--line);margin:16px 0"><button class="btn btn-yel btn-block" data-act="g-new">' + ic('plus', 18) + 'Thêm chủ điểm mới</button><button class="btn btn-sm btn-ghost btn-block" style="margin-top:8px" data-act="g-reset">Khôi phục toàn bộ nội dung mặc định</button>' + importPanel(t) + '</aside>';
    shell('grammar', '<h1 style="margin-bottom:4px">Ngữ pháp tổng hợp</h1><p class="muted" style="margin-bottom:18px">Phần giữa là thứ học sinh thấy. Sửa ở ô bên phải rồi bấm Lưu.</p><div class="glayout gl-adm">' + b.nav + '<div class="gmain" id="g-main">' + b.main + '</div>' + edit + '</div>' + importReview());
    bindImport(); LN.bindToc();
    var f = document.getElementById('g-form');
    if (f) f.addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(f), list = LN.grammar(), x = list.filter(function (y) { return y.id === t.id; })[0];
      var title = String(d.get('title') || '').trim(); if (!title) { toast('Nhập tên chủ điểm.'); return; }
      x.group = String(d.get('group') || '').trim(); x.title = title; x.block = String(d.get('block') || 'other'); x.icon = String(d.get('icon') || '').trim() || '📘'; x.en = String(d.get('en') || '').trim();
      x.summary = String(d.get('summary') || '').trim(); x.body = String(d.get('body') || '').replace(/\r/g, ''); delete x.explain; delete x.table; delete x.examples;
      LN.saveGrammar(list); toast('Đã lưu “' + title + '”'); viewGrammarAdmin(t.id);
    });
  }

  /* ================= Dữ liệu & tài khoản ================= */
  function viewData() {
    var keys = store.keys(), size = 0; keys.forEach(function (k) { size += JSON.stringify(store.get(k)).length; });
    var demo = Object.keys(LN.users()).filter(function (u) { return LN.users()[u].demo; }).length;
    shell('data', '<h1 style="margin-bottom:6px">Dữ liệu & sao lưu</h1><p class="muted" style="margin-bottom:18px">Bản demo lưu mọi thứ trong trình duyệt này (' + Object.keys(LN.users()).length + ' học sinh, khoảng ' + Math.round(size / 1024) + ' KB). Xoá dữ liệu trình duyệt là mất — nên sao lưu thường xuyên.</p>' +
      '<div class="row"><div class="card grow"><h2>Sao lưu</h2><p class="muted small" style="margin-bottom:14px">Tải toàn bộ tài khoản, tiến độ, nhận xét và Ngữ pháp tổng hợp về một file .json.</p><button class="btn btn-pink" data-act="a-export">' + ic('down', 18) + 'Tải file sao lưu</button>' +
      '<h2 style="margin-top:24px">Khôi phục</h2><p class="muted small" style="margin-bottom:10px">Chọn file sao lưu để nạp lại. Dữ liệu hiện tại sẽ bị thay thế.</p><label class="btn" for="a-import">' + ic('up', 18) + 'Chọn file sao lưu…</label><input type="file" id="a-import" accept=".json,application/json" class="sr-only"></div>' +
      '<div class="card side"><h2>Dữ liệu mẫu</h2><p class="muted small" style="margin-bottom:14px">Tạo 4 học sinh mẫu có tiến độ khác nhau để xem thử báo cáo. Có nhãn "mẫu", xoá được bất kỳ lúc nào.</p>' +
      '<button class="btn btn-yel btn-block" data-act="a-demo">Tạo dữ liệu mẫu</button>' + (demo ? '<button class="btn btn-block" style="margin-top:10px" data-act="a-undemo">Xoá ' + demo + ' học sinh mẫu</button>' : '') + '</div></div>');
    document.getElementById('a-import').addEventListener('change', function (ev) {
      var f = ev.target.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () {
        try {
          var obj = JSON.parse(rd.result); if (!obj || typeof obj !== 'object' || !obj.ln_users) throw new Error('bad');
          if (!confirm('Thay toàn bộ dữ liệu hiện tại bằng file "' + f.name + '"?')) return;
          store.keys().forEach(function (k) { if (k !== 'ln_admin_session' && k !== 'ln_admin') store.del(k); });
          Object.keys(obj).forEach(function (k) { if (k.indexOf('ln_') === 0 && k !== 'ln_admin_session' && k !== 'ln_session' && k !== 'ln_admin' && k !== 'ln_admin_fail' && k !== 'ln_teachers') store.set(k, obj[k]); });
          toast('Đã khôi phục dữ liệu'); LN.route();
        } catch (e) { toast('File không đúng định dạng sao lưu của Aurora English.'); }
      };
      rd.readAsText(f);
    });
  }
  /* ================= Trợ lý AI (Gemini – Google AI Studio) ================= */
  function viewAI(msg) {
    var A = LN.ai, st = A.status, c = A.cfg(), owner = cur() && cur().role === 'owner';
    var srv = st.server === null ? '<span class="tag">Đang kiểm tra…</span>' : st.server ? '<span class="tag tag-mint">✅ Đã có khoá trên máy chủ · ' + esc(st.model || '') + '</span>' : '<span class="tag tag-yel">Chưa có khoá trên máy chủ' + (location.protocol === 'file:' ? ' (đang mở file trực tiếp, không có máy chủ)' : '') + '</span>';
    shell('ai', '<h1 style="margin-bottom:6px">Trợ lý AI Chíp</h1><p class="muted" style="margin-bottom:18px">Chíp AI dùng <b>Gemini</b> (Google AI Studio, gói miễn phí) để <b>chấm phát âm</b> trong Thẻ nói, <b>chấm câu trả lời</b> trong Cô hỏi – em trả lời, <b>trò chuyện tiếng Anh</b> (mục Hỏi Chíp) và <b>giải thích câu sai</b>. Chỉ giáo viên cài khoá một lần, học sinh không phải làm gì.</p>' +
      (msg ? '<div class="note ' + (msg.ok ? 'note-mint' : 'note-yel') + '" style="margin-bottom:14px">' + msg.html + '</div>' : '') +
      '<div class="row"><div class="card grow"><h2>1. Trạng thái</h2><p style="margin:10px 0">Máy chủ: ' + srv + '</p>' + (c.key ? '<p>Khoá riêng trên máy này: <span class="tag tag-mint">đã lưu (…' + esc(c.key.slice(-4)) + ')</span></p>' : '') +
      '<p style="margin-top:12px"><button class="btn btn-pink" data-act="ai-test">🤖 Thử Chíp AI</button> <button class="btn" data-act="ai-recheck">Kiểm tra lại máy chủ</button></p><div id="ai-test-out"></div></div>' +
      '<div class="card grow"><h2>2. Cài khoá trên Vercel (khuyên dùng)</h2><ol class="small" style="line-height:1.8;padding-left:18px;margin-top:8px">' +
      '<li>Vào <b>aistudio.google.com/apikey</b>, đăng nhập Gmail → <b>Create API key</b> → sao chép khoá (bắt đầu bằng <code>AIza…</code>).</li>' +
      '<li>Vào <b>vercel.com</b> → mở dự án Aurora English → <b>Settings → Environment Variables</b>.</li>' +
      '<li>Thêm biến: Name <code>GEMINI_API_KEY</code>, Value = khoá vừa chép → <b>Save</b>.</li>' +
      '<li>Vào <b>Deployments</b> → bấm ⋯ ở bản mới nhất → <b>Redeploy</b>. Xong! Mọi học sinh dùng được ngay.</li></ol>' +
      '<p class="small muted">Khoá nằm trên máy chủ, không lộ ra trình duyệt. Gói miễn phí có giới hạn số lượt mỗi phút/ngày; khi hết lượt, app tự quay về cách chấm cũ.</p></div></div>' +
      (owner ? '<div class="card" style="margin-top:18px"><h2>3. Khoá riêng cho máy này (khi mở file trực tiếp, không qua Vercel)</h2><p class="small muted" style="margin:6px 0 12px">Chỉ dùng trên máy của lớp/cô. Khoá lưu trong trình duyệt của máy này — đừng dán trên máy của học sinh.</p>' +
        '<form id="f-aikey" class="two" style="align-items:end"><div class="field"><label for="ai-key">Khoá Google AI Studio</label><input class="inp" id="ai-key" name="key" type="password" autocomplete="off" placeholder="AIza…"></div><div class="field"><label for="ai-model">Model (để trống = tự chọn)</label><input class="inp" id="ai-model" name="model" placeholder="gemini-2.5-flash" value="' + esc(c.model || '') + '"></div>' +
        '<div><button class="btn btn-pink" type="submit">Lưu khoá</button> ' + (c.key ? '<button class="btn" type="button" data-act="ai-del">Xoá khoá</button>' : '') + '</div></form></div>' : ''));
    var f = document.getElementById('f-aikey');
    if (f) f.addEventListener('submit', function (ev) { ev.preventDefault(); var k = f.key.value.trim(), m = f.model.value.trim(); if (k && !/^AIza[\w-]{20,}$/.test(k)) { toast('Khoá không đúng dạng (bắt đầu bằng AIza…).'); return; } A.saveCfg(Object.assign({ model: m }, k ? { key: k } : {})); viewAI({ ok: true, html: 'Đã lưu. Bấm <b>Thử Chíp AI</b> để kiểm tra.' }); });
    if (st.server === null) A.check().then(function () { if (location.hash === '#/admin/ai') viewAI(msg); });
  }
  LN.adminAI = viewAI;
  function viewAccount(err) {
    var a = cur(), owner = a.role === 'owner', T = teachers();
    var msg = err ? '<div class="' + (err.ok ? 'note note-mint' : 'ferr') + '" style="margin-bottom:14px">' + esc(err.msg) + '</div>' : '';
    shell('account', '<h1 style="margin-bottom:6px">Tài khoản & giáo viên</h1><p class="muted" style="margin-bottom:16px">Đang đăng nhập: <b>' + esc(a.name) + '</b> (@' + esc(a.user) + ') · ' + (owner ? 'Quản trị chính' : 'Giáo viên') + '</p>' + msg +
      '<div class="row" style="align-items:flex-start"><div class="card grow" style="max-width:520px"><h2>Tài khoản của tôi</h2>' +
      '<form id="f-acc" novalidate><div class="field"><label for="ac-name">Tên hiển thị trên phiếu báo cáo</label><input class="inp" id="ac-name" name="name" value="' + esc(a.name) + '"></div>' +
      '<div class="field"><label for="ac-old">Mật khẩu hiện tại</label><input class="inp" id="ac-old" name="old" type="password" autocomplete="current-password"></div>' +
      '<div class="two"><div class="field"><label for="ac-new">Mật khẩu mới</label><input class="inp" id="ac-new" name="new" type="password" autocomplete="new-password" placeholder="Bỏ trống nếu không đổi"></div><div class="field"><label for="ac-new2">Nhập lại</label><input class="inp" id="ac-new2" name="new2" type="password" autocomplete="new-password"></div></div>' +
      '<button class="btn btn-pink" type="submit">Lưu</button></form></div>' +
      (owner ? '<div class="card grow"><h2>👩‍🏫 Tài khoản giáo viên</h2><p class="small muted" style="margin-bottom:12px">Chỉ quản trị chính tạo được. Giáo viên đăng nhập ở cùng trang “Giáo viên đăng nhập”, lần đầu phải tự đổi mật khẩu.</p>' +
        (T.length ? '<div class="tblw"><table class="tbl"><thead><tr><th>Giáo viên</th><th>Tên đăng nhập</th><th>Trạng thái</th><th></th></tr></thead><tbody>' + T.map(function (t) {
          return '<tr><td><b>' + esc(t.name) + '</b></td><td>@' + esc(t.user) + '</td><td>' + (t.must ? '<span class="tag tag-yel">Chưa đổi mật khẩu</span>' : '<span class="tag tag-mint">Đang dùng</span>') + '</td><td style="white-space:nowrap"><button class="btn btn-sm" data-act="t-reset" data-u="' + esc(t.user) + '">🔑 Cấp lại MK</button> <button class="btn btn-sm" data-act="t-del" data-u="' + esc(t.user) + '">' + ic('trash', 15) + '</button></td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="small muted">Chưa có giáo viên nào.</p>') +
        '<form id="f-tch" novalidate style="margin-top:16px;border-top:2px dashed var(--line);padding-top:14px"><h3 style="margin-bottom:10px">Thêm giáo viên</h3><div class="field"><label for="t-name">Họ tên</label><input class="inp" id="t-name" name="name" placeholder="Cô Lan"></div>' +
        '<div class="two"><div class="field"><label for="t-user">Tên đăng nhập</label><input class="inp" id="t-user" name="user" placeholder="colan" autocapitalize="none"></div><div class="field"><label for="t-pass">Mật khẩu cấp lần đầu</label><input class="inp" id="t-pass" name="pass" placeholder="ít nhất 8 ký tự"></div></div>' +
        '<button class="btn btn-yel" type="submit">' + ic('plus', 17) + 'Tạo tài khoản giáo viên</button></form></div>' : '') + '</div>');
    document.getElementById('f-acc').addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(ev.target), a2 = cur();
      if (a2.pass !== LN.hash('admin:' + a2.user + ':' + String(d.get('old') || ''))) return viewAccount({ msg: 'Mật khẩu hiện tại chưa đúng.' });
      var nw = String(d.get('new') || '');
      if (nw) { if (nw.length < 8) return viewAccount({ msg: 'Mật khẩu mới cần ít nhất 8 ký tự.' }); if (nw !== d.get('new2')) return viewAccount({ msg: 'Hai lần nhập mật khẩu mới chưa khớp.' }); a2.pass = LN.hash('admin:' + a2.user + ':' + nw); }
      a2.name = String(d.get('name') || '').trim() || a2.name; a2.must = false; saveAcc(a2); viewAccount({ ok: true, msg: 'Đã lưu.' });
    });
    var ft = document.getElementById('f-tch');
    if (ft) ft.addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(ft), name = String(d.get('name') || '').trim(), user = LN.normUser(d.get('user')), pass = String(d.get('pass') || '');
      if (!name) return viewAccount({ msg: 'Nhập họ tên giáo viên.' });
      if (!/^[a-z0-9_]{3,20}$/.test(user)) return viewAccount({ msg: 'Tên đăng nhập gồm chữ thường không dấu, số hoặc _, dài 3–20 ký tự.' });
      if (user === adm().user || teachers().some(function (x) { return x.user === user; })) return viewAccount({ msg: 'Tên đăng nhập “' + user + '” đã có.' });
      if (pass.length < 8) return viewAccount({ msg: 'Mật khẩu cấp lần đầu cần ít nhất 8 ký tự.' });
      var l = teachers(); l.push({ user: user, name: name, pass: LN.hash('admin:' + user + ':' + pass), must: true, created: Date.now() }); store.set('ln_teachers', l);
      viewAccount({ ok: true, msg: 'Đã tạo tài khoản @' + user + ' (mật khẩu: ' + pass + '). Gửi cho giáo viên để đăng nhập.' });
    });
  }

  /* ================= Dữ liệu mẫu ================= */
  function makeDemo() {
    var all = LN.users();
    var prof = [
      { u: 'mau_an', name: 'Nguyễn Minh An', units: 12, skill: 0.92, weak: [] },
      { u: 'mau_binh', name: 'Trần Gia Bình', units: 7, skill: 0.8, weak: ['past', 'prep'] },
      { u: 'mau_chi', name: 'Lê Bảo Chi', units: 4, skill: 0.68, weak: ['be', 'wh'] },
      { u: 'mau_dung', name: 'Phạm Anh Dũng', units: 2, skill: 0.85, weak: ['vocab'] }
    ];
    prof.forEach(function (pf, pi) {
      all[pf.u] = { name: pf.name, grade: 4, pass: LN.hash(pf.u + ':123456'), mail: '09' + (12345670 + pi), created: Date.now() - (30 + pi * 3) * 86400000, last: Date.now() - (pi * 9 + 2) * 3600000, demo: true };
      var p = { seen: {}, ex: {}, mistakes: {}, days: {}, topics: {}, games: {}, vlearn: {}, log: [], stars: 0 };
      var tday = 0;
      UNITS.forEach(function (u) {
        if (u.n > pf.units + 1) return; var partial = u.n === pf.units + 1;
        p.vlearn[u.n] = true; p.seen['p' + u.n] = Date.now(); p.games[u.n] = { cards: 3, listen: 2 + (pi % 2), memory: 2 };
        u.exercises.forEach(function (e, ei) {
          if (partial && ei > 2) return;
          var sk = pf.skill - (pf.weak.indexOf(e.topic) >= 0 ? 0.28 : 0) + (Math.random() - 0.5) * 0.14; sk = Math.max(0.3, Math.min(1, sk));
          var n = LN.itemCount(e), r = Math.round(n * sk), when = Date.now() - (pf.units + 1 - u.n) * 1.6 * 86400000 - Math.random() * 40000000;
          p.ex[e.id] = { best: pct(r, n), last: pct(r, n), attempts: 1, t: when };
          p.topics[e.topic] = p.topics[e.topic] || [0, 0]; p.topics[e.topic][0] += r; p.topics[e.topic][1] += n; p.stars += r;
          p.log.push({ id: e.id, title: e.title, right: r, total: n, t: when });
          LN.shuffle(Array.apply(null, Array(n)).map(function (_, i) { return i; })).slice(0, n - r).forEach(function (idx) { p.mistakes[e.id + '#' + idx] = { exId: e.id, idx: idx, n: 1 + Math.floor(Math.random() * 3), t: when }; });
          var dk = LN.dayKey(new Date(when)); p.days[dk] = (p.days[dk] || 0) + n; tday++;
        });
      });
      p.log.sort(function (a, b) { return a.t - b.t; });
      for (var i = 0; i < 4 - pi; i++) { var d = new Date(); d.setDate(d.getDate() - i); var k = LN.dayKey(d); p.days[k] = (p.days[k] || 0) + 8 + Math.floor(Math.random() * 20); }
      store.set('ln_prog_' + pf.u, p);
      if (pi === 0) store.set('ln_note_' + pf.u, '');
    });
    store.set('ln_users', all);
    demoClass();
  }

  /* ================= Lớp học: sĩ số, điểm danh, học phí ================= */
  function money(n) { return (Math.round(n) || 0).toLocaleString('vi-VN') + ' đ'; }
  LN.money = money;
  function klass() { return Object.assign({ name: 'Lớp tiếng Anh 4', fee: 600000, days: [2, 4, 6] }, store.get('ln_class', {})); }
  function ym(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function ymLabel(m) { var a = m.split('-'); return (+a[1]) + '/' + a[0]; }
  function monthsBetween(a, b) { var out = [], y = +a.slice(0, 4), m = +a.slice(5, 7), y2 = +b.slice(0, 4), m2 = +b.slice(5, 7), g = 0; while ((y < y2 || (y === y2 && m <= m2)) && g++ < 240) { out.push(y + '-' + String(m).padStart(2, '0')); m++; if (m > 12) { m = 1; y++; } } return out; }
  function feeStatus(un) {
    var u = LN.users()[un] || {}, f = (store.get('ln_fees', {}))[un] || {}, fee = f.fee != null && f.fee !== '' ? +f.fee : klass().fee;
    var start = f.start || (u.joined ? u.joined.slice(0, 7) : ym(new Date(u.created || Date.now())));
    var endM = u.status === 'stopped' && u.stopped ? u.stopped.slice(0, 7) : ym();
    var months = start <= endM ? monthsBetween(start, endM) : [];
    var pays = f.payments || [], by = {}; pays.forEach(function (p) { by[p.month] = (by[p.month] || 0) + (+p.amount || 0); });
    var unpaid = months.filter(function (m) { return (by[m] || 0) < fee; }).map(function (m) { return { m: m, owe: fee - (by[m] || 0) }; });
    var due = fee * months.length, paid = pays.reduce(function (a, p) { return a + (+p.amount || 0); }, 0);
    return { fee: fee, start: start, months: months, due: due, paid: paid, owed: Math.max(0, due - paid), unpaid: unpaid, pays: pays };
  }
  LN.feeStatus = feeStatus;
  var ATT = { p: ['Có mặt', '✓', 'mint'], l: ['Đi muộn', 'M', 'yel'], e: ['Vắng có phép', 'P', 'sky'], a: ['Vắng không phép', 'K', 'red'] };
  var WD = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  function attAll() { return store.get('ln_att', {}); }
  function attOf(un, days) {
    var all = attAll(), since = days ? LN.dayKey(new Date(Date.now() - (days - 1) * 86400000)) : '0000', today = LN.dayKey(), r = { p: 0, l: 0, e: 0, a: 0, total: 0 };
    Object.keys(all).forEach(function (d) { if (d < since || d > today) return; var x = all[d][un]; if (x && x.s) { r[x.s]++; r.total++; } });
    r.present = r.p + r.l; return r;
  }
  LN.attOf = attOf;
  function lastName(n) { return (n || '').trim().split(/\s+/).pop(); }
  function sortedUsers(filter) { var all = LN.users(); return Object.keys(all).filter(function (k) { return !filter || filter(all[k]); }).sort(function (a, b) { return lastName(all[a].name).localeCompare(lastName(all[b].name), 'vi'); }); }
  function saved() { var el = document.getElementById('autosave'); if (el) { el.textContent = 'Đã lưu ✓'; el.style.opacity = 1; clearTimeout(el._t); el._t = setTimeout(function () { el.style.opacity = 0.5; el.textContent = 'Tự động lưu'; }, 1400); } }
  function autosaveTag() { return '<span id="autosave" class="tag tag-mint" style="opacity:.5">Tự động lưu</span>'; }

  /* ---- Sĩ số ---- */
  var ADDOPEN = false, ADDERR = '';
  function viewRoster() {
    var all = LN.users(), keys = sortedUsers(), k = klass(), today = attAll()[LN.dayKey()] || {};
    var act = keys.filter(function (u) { return all[u].status !== 'stopped'; }), stopped = keys.length - act.length;
    var pres = act.filter(function (u) { return today[u] && (today[u].s === 'p' || today[u].s === 'l'); }).length, marked = act.filter(function (u) { return today[u] && today[u].s; }).length;
    var owing = act.filter(function (u) { return feeStatus(u).owed > 0; }).length;
    var days = [[2, 'T2'], [3, 'T3'], [4, 'T4'], [5, 'T5'], [6, 'T6'], [7, 'T7'], [8, 'CN']];
    var body = '<div class="chead"><div><h1>Sĩ số học sinh</h1><p class="muted">Thêm học sinh, sửa thông tin, đánh dấu nghỉ học.</p></div>' + autosaveTag() + '</div>' +
      '<div class="row" style="margin:14px 0 16px"><div class="stat"><p class="k">Đang học</p><p class="v">' + act.length + '</p></div><div class="stat"><p class="k">Đã nghỉ học</p><p class="v">' + stopped + '</p></div>' +
      '<div class="stat"><p class="k">Có mặt hôm nay</p><p class="v">' + (marked ? pres + '/' + act.length : '—') + '</p><p class="tiny muted">' + (marked ? '' : 'chưa điểm danh') + '</p></div><div class="stat"><p class="k">Còn thiếu học phí</p><p class="v" style="color:' + (owing ? 'var(--red-dk)' : 'var(--mint-dk)') + '">' + owing + ' bé</p></div></div>' +
      '<div class="row" style="margin-bottom:16px;align-items:flex-start"><div class="card grow"><h2>Thông tin lớp</h2><div class="two"><div class="field"><label for="c-name">Tên lớp</label><input class="inp" id="c-name" data-cls="name" value="' + esc(k.name) + '"></div><div class="field"><label for="c-fee">Học phí mặc định / tháng (đ)</label><input class="inp" id="c-fee" data-cls="fee" type="number" step="10000" min="0" value="' + k.fee + '"></div></div>' +
      '<label class="swi" style="margin-bottom:14px"><input type="checkbox" id="c-allowreg"' + (k.allowReg ? ' checked' : '') + '><span></span>Cho phép học sinh tự đăng ký tài khoản (mặc định tắt — giáo viên cấp tài khoản)</label>' + '<p style="font-weight:800;margin-bottom:6px">Lịch học</p><div style="display:flex;gap:8px;flex-wrap:wrap">' + days.map(function (d) { return '<label class="daychk"><input type="checkbox" data-clsday="' + d[0] + '"' + (k.days.indexOf(d[0]) >= 0 ? ' checked' : '') + '><span>' + d[1] + '</span></label>'; }).join('') + '</div></div>' +
      '<div class="card side"><h2>Thêm học sinh</h2>' + (ADDOPEN ? '<form id="f-add" novalidate>' + (ADDERR ? '<div class="ferr">' + esc(ADDERR) + '</div>' : '') +
        '<div class="field"><label for="n-name">Họ tên</label><input class="inp" id="n-name" name="name"></div><div class="two"><div class="field"><label for="n-user">Tên đăng nhập</label><input class="inp" id="n-user" name="user" placeholder="chữ thường, số"></div><div class="field"><label for="n-pass">Mật khẩu</label><input class="inp" id="n-pass" name="pass" value="123456"></div></div>' +
        '<div class="two"><div class="field"><label for="n-grade">Lớp</label><select class="sel" id="n-grade" name="grade">' + LN.gradeOpts(4) + '</select></div><div class="field"><label for="n-mail">SĐT / email phụ huynh</label><input class="inp" id="n-mail" name="mail"></div></div><div class="two"><div class="field"><label for="n-join">Ngày vào học</label><input class="inp" id="n-join" name="joined" type="date" value="' + LN.dayKey() + '"></div><div class="field"><label for="n-fee">Học phí / tháng</label><input class="inp" id="n-fee" name="fee" type="number" step="10000" value="' + k.fee + '"></div></div>' +
        '<div style="display:flex;gap:8px"><button class="btn btn-pink" type="submit">Thêm vào lớp</button><button class="btn" type="button" data-act="r-add">Huỷ</button></div></form>'
        : '<p class="muted small" style="margin-bottom:12px">Tạo tài khoản cho bé ngay tại đây, không cần bé tự đăng ký.</p><button class="btn btn-yel btn-block" data-act="r-add">' + ic('plus', 18) + 'Thêm học sinh</button>') + '</div></div>' +
      '<div class="card"><h2>Danh sách lớp (' + keys.length + ')</h2>' + (keys.length ? '<div class="tblw"><table class="tbl" id="roster"><thead><tr><th>Họ tên</th><th>Đăng nhập</th><th>Lớp</th><th>Phụ huynh</th><th>Vào học</th><th>Trạng thái</th><th>Vắng 30 ngày</th><th>Học phí thiếu</th><th></th></tr></thead><tbody>' +
        keys.map(function (un) {
          var u = all[un], a30 = attOf(un, 30), fs = feeStatus(un);
          return '<tr data-un="' + esc(un) + '"' + (u.status === 'stopped' ? ' style="opacity:.55"' : '') + '><td><input class="inp cellinp" data-f="name" value="' + esc(u.name) + '" aria-label="Họ tên"></td><td class="small">@' + esc(un) + (u.demo ? ' <span class="tag tag-yel">mẫu</span>' : '') + '</td>' +
            '<td><select class="sel cellinp" data-f="grade" aria-label="Lớp" style="min-width:90px">' + LN.gradeOpts(+u.grade || 4) + '</select></td>' +
            '<td><input class="inp cellinp" data-f="mail" value="' + esc(u.mail || '') + '" aria-label="Phụ huynh"></td><td><input class="inp cellinp" type="date" data-f="joined" value="' + esc(u.joined || LN.dayKey(new Date(u.created || Date.now()))) + '" aria-label="Ngày vào học"></td>' +
            '<td><select class="sel cellinp" data-f="status" aria-label="Trạng thái"><option value="active">Đang học</option><option value="stopped"' + (u.status === 'stopped' ? ' selected' : '') + '>Đã nghỉ</option></select></td>' +
            '<td>' + (a30.e + a30.a ? '<b style="color:var(--red-dk)">' + (a30.e + a30.a) + '</b> <span class="tiny muted">(' + a30.e + ' P · ' + a30.a + ' K)</span>' : '0') + '</td>' +
            '<td>' + (fs.owed ? '<b style="color:var(--red-dk)">' + money(fs.owed) + '</b>' : '<span style="color:var(--mint-dk);font-weight:800">Đủ</span>') + '</td>' +
            '<td style="white-space:nowrap"><button class="btn btn-sm" data-act="a-resetpw" data-u="' + esc(un) + '" title="Cấp lại mật khẩu">🔑</button> <a class="btn btn-sm" href="#/admin/s/' + encodeURIComponent(un) + '">Chi tiết</a> <a class="btn btn-sm" href="#/admin/report/' + encodeURIComponent(un) + '">Phiếu</a></td></tr>';
        }).join('') + '</tbody></table></div>' : '<p class="muted">Chưa có học sinh.</p>') + '</div>';
    shell('roster', body);
    var tb = document.getElementById('roster');
    if (tb) tb.addEventListener('change', function (ev) {
      var el = ev.target, f = el.getAttribute('data-f'); if (!f) return;
      var un = el.closest('tr').getAttribute('data-un'), all2 = LN.users(); if (!all2[un]) return;
      all2[un][f] = f === 'grade' ? +el.value : el.value; if (f === 'status') all2[un].stopped = el.value === 'stopped' ? LN.dayKey() : null;
      store.set('ln_users', all2); saved(); if (f === 'status') viewRoster();
    });
    [].slice.call(document.querySelectorAll('[data-cls]')).forEach(function (el) { el.addEventListener('change', function () { var c = store.get('ln_class', {}); c[el.getAttribute('data-cls')] = el.type === 'number' ? +el.value : el.value; store.set('ln_class', c); saved(); }); });
    var ar = document.getElementById('c-allowreg'); if (ar) ar.addEventListener('change', function () { var c = store.get('ln_class', {}); c.allowReg = ar.checked; store.set('ln_class', c); saved(); });
    [].slice.call(document.querySelectorAll('[data-clsday]')).forEach(function (el) { el.addEventListener('change', function () { var c = store.get('ln_class', {}), d = klass().days.slice(), v = +el.getAttribute('data-clsday'); if (el.checked) { if (d.indexOf(v) < 0) d.push(v); } else d = d.filter(function (x) { return x !== v; }); c.days = d.sort(); store.set('ln_class', c); saved(); }); });
    var fa = document.getElementById('f-add');
    if (fa) fa.addEventListener('submit', function (ev) {
      ev.preventDefault(); var d = new FormData(fa), all3 = LN.users(), name = String(d.get('name') || '').trim(), user = String(d.get('user') || '').trim().toLowerCase(), pass = String(d.get('pass') || '');
      ADDERR = !name ? 'Nhập họ tên.' : !/^[a-z0-9_]{3,20}$/.test(user) ? 'Tên đăng nhập gồm chữ thường, số, dài 3–20 ký tự.' : all3[user] ? 'Tên đăng nhập đã có người dùng.' : pass.length < 6 ? 'Mật khẩu ít nhất 6 ký tự.' : '';
      if (ADDERR) { viewRoster(); return; }
      all3[user] = { name: name, grade: +d.get('grade') || 4, pass: LN.hash(user + ':' + pass), mail: String(d.get('mail') || ''), created: Date.now(), joined: String(d.get('joined') || LN.dayKey()), status: 'active', byAdmin: true };
      store.set('ln_users', all3);
      var fees = store.get('ln_fees', {}); fees[user] = { fee: +d.get('fee') || klass().fee, start: String(d.get('joined') || LN.dayKey()).slice(0, 7), payments: [] }; store.set('ln_fees', fees);
      ADDOPEN = false; toast('Đã thêm ' + name + ' (mật khẩu: ' + pass + ')'); viewRoster();
    });
  }

  /* ---- Điểm danh ---- */
  var ATTMONTH = null;
  function viewAttendance(date) {
    date = /^\d{4}-\d{2}-\d{2}$/.test(date || '') ? date : LN.dayKey();
    var all = LN.users(), list = sortedUsers(function (u) { return u.status !== 'stopped'; }), day = attAll()[date] || {}, k = klass();
    var wd = new Date(date + 'T12:00:00').getDay(), sched = k.days.indexOf(wd === 0 ? 8 : wd + 1) >= 0;
    var cnt = { p: 0, l: 0, e: 0, a: 0, none: 0 }; list.forEach(function (u) { var s = day[u] && day[u].s; if (s) cnt[s]++; else cnt.none++; });
    var month = ATTMONTH || date.slice(0, 7), dates = Object.keys(attAll()).filter(function (d) { return d.slice(0, 7) === month; }).sort();
    var body = '<div class="chead"><div><h1>Điểm danh</h1><p class="muted">' + WD[wd] + ', ' + fmtD(new Date(date + 'T12:00:00')) + (sched ? ' · có lịch học' : ' · <span style="color:var(--yel-dk)">không phải ngày học theo lịch</span>') + '</p></div>' +
      '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">' + autosaveTag() + '<input class="inp" type="date" id="att-date" value="' + date + '" style="width:auto" aria-label="Ngày điểm danh"><button class="btn btn-mint" data-act="att-all" data-d="' + date + '">Tất cả có mặt</button></div></div>' +
      '<div class="row" style="margin:14px 0 16px">' + ['p', 'l', 'e', 'a'].map(function (s) { return '<div class="stat"><p class="k">' + ATT[s][0] + '</p><p class="v" style="color:var(--' + (s === 'p' ? 'mint-dk' : s === 'l' ? 'yel-dk' : s === 'e' ? 'sky' : 'red-dk') + ')">' + cnt[s] + '</p></div>'; }).join('') + '<div class="stat"><p class="k">Chưa điểm danh</p><p class="v">' + cnt.none + '</p></div></div>' +
      '<div class="card" style="margin-bottom:16px">' + (list.length ? list.map(function (un) {
        var x = day[un] || {};
        return '<div class="attrow"><span class="ava" style="width:40px;height:40px;font-size:17px">' + esc(lastName(all[un].name).charAt(0)) + '</span><b class="attn">' + esc(all[un].name) + '</b><div class="attbtns">' + ['p', 'l', 'e', 'a'].map(function (s) {
          return '<button type="button" class="attb a-' + s + (x.s === s ? ' on' : '') + '" data-act="att-set" data-u="' + esc(un) + '" data-s="' + s + '" data-d="' + date + '" aria-pressed="' + (x.s === s) + '">' + ATT[s][0] + '</button>';
        }).join('') + '</div><input class="inp attnote" data-attnote="' + esc(un) + '" placeholder="Ghi chú (lý do vắng…)" value="' + esc(x.note || '') + '" aria-label="Ghi chú cho ' + esc(all[un].name) + '"></div>';
      }).join('') : '<p class="muted">Chưa có học sinh đang học. Thêm ở trang Sĩ số.</p>') + '</div>' +
      '<div class="card"><div class="chead"><h2>Bảng điểm danh tháng</h2><input class="inp" type="month" id="att-month" value="' + month + '" style="width:auto" aria-label="Tháng"></div>' +
      (dates.length ? '<div class="tblw"><table class="tbl attgrid"><thead><tr><th>Học sinh</th>' + dates.map(function (d) { return '<th class="center">' + (+d.slice(8)) + '</th>'; }).join('') + '<th>Có mặt</th><th>Vắng P</th><th>Vắng K</th><th>Muộn</th></tr></thead><tbody>' +
        sortedUsers().map(function (un) {
          var c = { p: 0, l: 0, e: 0, a: 0 };
          return '<tr><td><b>' + esc(all[un].name) + '</b></td>' + dates.map(function (d) { var x = (attAll()[d] || {})[un]; if (x && x.s) c[x.s]++; return '<td class="center">' + (x && x.s ? '<span class="attm m-' + x.s + '" title="' + ATT[x.s][0] + (x.note ? ': ' + esc(x.note) : '') + '">' + ATT[x.s][1] + '</span>' : '<span class="muted">·</span>') + '</td>'; }).join('') +
            '<td><b>' + c.p + '</b></td><td>' + c.e + '</td><td style="color:' + (c.a ? 'var(--red-dk)' : 'inherit') + '">' + c.a + '</td><td>' + c.l + '</td></tr>';
        }).join('') + '</tbody></table></div><p class="tiny muted" style="margin-top:8px">✓ có mặt · M đi muộn · P vắng có phép · K vắng không phép</p>' : '<p class="muted small">Tháng này chưa có buổi điểm danh nào.</p>') + '</div>';
    shell('att', body);
    document.getElementById('att-date').addEventListener('change', function (ev) { if (ev.target.value) LN.go('#/admin/attendance/' + ev.target.value); });
    document.getElementById('att-month').addEventListener('change', function (ev) { ATTMONTH = ev.target.value || null; viewAttendance(date); });
    [].slice.call(document.querySelectorAll('[data-attnote]')).forEach(function (el) {
      el.addEventListener('change', function () { var a = attAll(), un = el.getAttribute('data-attnote'); a[date] = a[date] || {}; a[date][un] = a[date][un] || {}; a[date][un].note = el.value; store.set('ln_att', a); saved(); });
    });
  }

  /* ---- Học phí ---- */
  var FEEOPEN = null;
  function viewFees() {
    var all = LN.users(), list = sortedUsers(), k = klass(), tot = { due: 0, paid: 0, owed: 0, n: 0 };
    var rows = list.map(function (un) { var fs = feeStatus(un); tot.due += fs.due; tot.paid += fs.paid; tot.owed += fs.owed; if (fs.owed) tot.n++; return { un: un, fs: fs }; });
    var body = '<div class="chead"><div><h1>Học phí</h1><p class="muted">Học phí tính theo tháng, từ tháng bắt đầu học đến tháng hiện tại. Phần còn thiếu tự in lên phiếu báo cáo.</p></div>' + autosaveTag() + '</div>' +
      '<div class="row" style="margin:14px 0 16px"><div class="stat"><p class="k">Tổng phải thu</p><p class="v" style="font-size:26px">' + money(tot.due) + '</p></div><div class="stat"><p class="k">Đã thu</p><p class="v" style="font-size:26px;color:var(--mint-dk)">' + money(tot.paid) + '</p></div>' +
      '<div class="stat" style="border-color:' + (tot.owed ? 'var(--red)' : 'var(--line)') + '"><p class="k">Còn thiếu</p><p class="v" style="font-size:26px;color:' + (tot.owed ? 'var(--red-dk)' : 'var(--mint-dk)') + '">' + money(tot.owed) + '</p><p class="tiny muted">' + tot.n + ' học sinh</p></div>' +
      '<div class="stat"><p class="k">Học phí mặc định / tháng</p><input class="inp" type="number" step="10000" min="0" id="fee-default" value="' + k.fee + '" style="margin-top:6px" aria-label="Học phí mặc định"></div></div>' +
      '<div class="card"><div class="tblw"><table class="tbl feetbl"><thead><tr><th>Học sinh</th><th>Học phí / tháng</th><th>Tính từ tháng</th><th>Số tháng</th><th>Phải đóng</th><th>Đã đóng</th><th>Còn thiếu</th><th></th></tr></thead><tbody>' +
      rows.map(function (r) {
        var fs = r.fs, u = all[r.un], f = (store.get('ln_fees', {}))[r.un] || {};
        var main = '<tr data-un="' + esc(r.un) + '"' + (u.status === 'stopped' ? ' style="opacity:.6"' : '') + '><td><b>' + esc(u.name) + '</b>' + (u.status === 'stopped' ? ' <span class="tag tag-soft">đã nghỉ</span>' : '') + '</td>' +
          '<td><input class="inp cellinp" type="number" step="10000" min="0" data-fee="fee" value="' + (f.fee != null && f.fee !== '' ? f.fee : '') + '" placeholder="' + k.fee + '" style="width:100px" aria-label="Học phí"></td>' +
          '<td><input class="inp cellinp" type="month" data-fee="start" value="' + fs.start + '" style="width:130px" aria-label="Tính từ tháng"></td><td>' + fs.months.length + '</td><td>' + money(fs.due) + '</td><td style="color:var(--mint-dk);font-weight:800">' + money(fs.paid) + '</td>' +
          '<td>' + (fs.owed ? '<span class="owed">' + money(fs.owed) + '</span><br><span class="tiny muted">' + fs.unpaid.map(function (x) { return 'T' + ymLabel(x.m); }).join(', ') + '</span>' : '<span class="tag tag-mint">Đã đủ</span>') + '</td>' +
          '<td><button class="btn btn-sm ' + (FEEOPEN === r.un ? '' : 'btn-pink') + '" data-act="fee-open" data-u="' + esc(r.un) + '">' + (FEEOPEN === r.un ? 'Đóng lại' : '+ Thu tiền') + '</button></td></tr>';
        if (FEEOPEN === r.un) {
          var opts = fs.unpaid.map(function (x) { return x.m; }); [ym(), ym(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1))].forEach(function (m) { if (opts.indexOf(m) < 0) opts.push(m); });
          main += '<tr class="feeform"><td colspan="8"><div class="two" style="align-items:flex-end"><div class="field"><label for="pay-amt">Số tiền (đ)</label><input class="inp" id="pay-amt" type="number" step="10000" value="' + (fs.unpaid[0] ? fs.unpaid[0].owe : fs.fee) + '"></div>' +
            '<div class="field"><label for="pay-month">Cho tháng</label><select class="sel" id="pay-month">' + opts.map(function (m) { return '<option value="' + m + '">Tháng ' + ymLabel(m) + '</option>'; }).join('') + '</select></div>' +
            '<div class="field"><label for="pay-date">Ngày đóng</label><input class="inp" id="pay-date" type="date" value="' + LN.dayKey() + '"></div><div class="field"><label for="pay-note">Ghi chú</label><input class="inp" id="pay-note" placeholder="Tiền mặt / chuyển khoản"></div>' +
            '<div class="field"><button class="btn btn-mint" data-act="fee-save" data-u="' + esc(r.un) + '">Lưu khoản đóng</button></div></div>' +
            (fs.pays.length ? '<p style="font-weight:800;margin:6px 0">Lịch sử đóng tiền</p>' + fs.pays.slice().reverse().map(function (p) { return '<div class="payrow"><span>' + fmtD(new Date(p.date + 'T12:00:00')) + '</span><b>' + money(p.amount) + '</b><span>Tháng ' + ymLabel(p.month) + '</span><span class="muted small">' + esc(p.note || '') + '</span><button class="btn btn-sm btn-ghost" data-act="fee-del" data-u="' + esc(r.un) + '" data-id="' + p.id + '">' + ic('trash', 15) + 'Xoá</button></div>'; }).join('') : '<p class="small muted">Chưa có khoản đóng nào.</p>') + '</td></tr>';
        }
        return main;
      }).join('') + '</tbody></table></div></div>';
    shell('fees', body);
    document.getElementById('fee-default').addEventListener('change', function (ev) { var c = store.get('ln_class', {}); c.fee = +ev.target.value || 0; store.set('ln_class', c); saved(); viewFees(); });
    [].slice.call(document.querySelectorAll('[data-fee]')).forEach(function (el) {
      el.addEventListener('change', function () { var un = el.closest('tr').getAttribute('data-un'), fees = store.get('ln_fees', {}); fees[un] = fees[un] || { payments: [] }; var k2 = el.getAttribute('data-fee'); fees[un][k2] = k2 === 'fee' ? (el.value === '' ? null : +el.value) : el.value; store.set('ln_fees', fees); saved(); viewFees(); });
    });
  }

  /* ---- Nạp bài tập (trợ lý tự động) ---- */
  var IMP = null;
  function topicOptions(sel) {
    var list = LN.grammar();
    return '<option value="">— chưa xếp —</option>' + LN.BLOCKS().map(function (b) {
      var items = list.filter(function (x) { return (x.block || 'other') === b.id; }); if (!items.length) return '';
      return '<optgroup label="' + esc(b.title) + '">' + items.map(function (x) { return '<option value="' + x.id + '"' + (x.id === sel ? ' selected' : '') + '>' + esc((x.block === 'cd' ? 'CĐ' + x.no + ' · ' : '') + x.title) + '</option>'; }).join('') + '</optgroup>';
    }).join('');
  }
  function importPanel(t) {
    var mine = t ? LN.importsFor(t.id) : [];
    return '<hr style="border:none;border-top:2px dashed var(--line);margin:16px 0"><h3>📥 Nạp bài tập</h3><p class="tiny muted" style="margin-bottom:10px">Trợ lý tự động đọc file, tách câu hỏi – lựa chọn – đáp án, rồi xếp từng câu vào đúng chủ điểm.</p>' +
      '<label class="btn btn-block" for="imp-file">' + ic('up', 17) + 'Chọn file .docx / .pdf / .txt</label><input type="file" id="imp-file" class="sr-only" accept=".txt,.md,.docx,.pdf">' +
      '<textarea class="ta" id="imp-text" rows="4" style="margin-top:8px" placeholder="…hoặc dán bài tập vào đây"></textarea>' +
      '<button class="btn btn-pink btn-block" style="margin-top:8px" data-act="imp-run">🤖 Phân tích bài tập</button>' +
      '<p class="tiny muted" style="margin-top:8px">Dạng đọc được: "1. câu hỏi … A. … B. … C. … D. …". Đáp án: đánh dấu * trước lựa chọn đúng, hoặc ghi "Đáp án: B" sau câu, hoặc bảng "Đáp án: 1.B 2.C …" ở cuối. Câu điền từ: "… ___ … => đáp án".</p>' +
      (mine.length ? '<p style="font-weight:800;margin:12px 0 6px">Bài đã nạp vào chủ điểm này</p>' + mine.map(function (e) { return '<div class="payrow"><span>' + esc(e.title) + '</span><span class="muted small">' + e.items.length + ' câu</span><button class="btn btn-sm btn-ghost" data-act="imp-del" data-id="' + e.id + '">' + ic('trash', 15) + '</button></div>'; }).join('') : '');
  }
  function importReview() {
    if (!IMP) return '';
    var it = IMP.items, ok = it.filter(function (x) { return x.inc && hasAns(x); }).length, noAns = it.filter(function (x) { return !hasAns(x); }).length;
    return '<div class="card" id="imp-review" style="margin-top:18px;border-color:var(--yel-mid)"><div class="chead"><div><h2>🤖 Kết quả phân tích' + (IMP.fname ? ': ' + esc(IMP.fname) : '') + '</h2><p class="small muted">Tìm thấy ' + it.length + ' câu · ' + (it.length - noAns) + ' câu có đáp án' + (noAns ? ' · <b style="color:var(--red-dk)">' + noAns + ' câu chưa có đáp án</b> (điền vào để thêm)' : '') + '. Kiểm tra lại chủ điểm trợ lý gợi ý rồi bấm Thêm.</p></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-sm" data-act="imp-all-topic">Xếp tất cả vào chủ điểm đang mở</button><button class="btn btn-sm" data-act="imp-cancel">Huỷ</button><button class="btn btn-pink" data-act="imp-save">Thêm ' + ok + ' câu vào app</button></div></div>' +
      (it.length ? '<div class="tblw"><table class="tbl imptbl"><thead><tr><th></th><th>Câu hỏi</th><th>Lựa chọn (cách nhau bằng |)</th><th>Đáp án</th><th>Chủ điểm</th></tr></thead><tbody>' + it.map(function (x, i) {
        return '<tr' + (hasAns(x) ? '' : ' class="noans"') + '><td><input type="checkbox" data-imp="inc" data-i="' + i + '"' + (x.inc ? ' checked' : '') + ' aria-label="Chọn câu ' + (i + 1) + '"></td>' +
          '<td><input class="inp cellinp" data-imp="q" data-i="' + i + '" value="' + esc(x.q) + '" aria-label="Câu hỏi"></td>' +
          '<td>' + (x.type === 'mcq' ? '<input class="inp cellinp" data-imp="o" data-i="' + i + '" value="' + esc(x.o.join(' | ')) + '" aria-label="Lựa chọn">' : '<span class="tag tag-soft">Điền từ</span>') + '</td>' +
          '<td>' + (x.type === 'mcq' ? '<select class="sel cellinp" data-imp="a" data-i="' + i + '" aria-label="Đáp án"><option value="-1">?</option>' + x.o.map(function (o, k) { return '<option value="' + k + '"' + (x.a === k ? ' selected' : '') + '>' + 'ABCDEF'[k] + '</option>'; }).join('') + '</select>' : '<input class="inp cellinp" data-imp="ans" data-i="' + i + '" value="' + esc((x.ans || []).join(' / ')) + '" placeholder="đáp án" style="width:120px" aria-label="Đáp án">') + '</td>' +
          '<td><select class="sel cellinp" data-imp="topic" data-i="' + i + '" aria-label="Chủ điểm">' + topicOptions(x.topic) + '</select>' + (x.conf ? '<span class="tiny muted"> gợi ý: độ chắc ' + x.conf + '</span>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : '<p class="muted">Không tìm thấy câu hỏi nào. Kiểm tra lại định dạng (mỗi câu bắt đầu bằng số thứ tự "1.", "2." …).</p>') + '</div>';
  }
  function hasAns(x) { return x.type === 'mcq' ? x.a >= 0 && x.o.length >= 2 : (x.ans || []).length > 0; }
  function bindImport() {
    var f = document.getElementById('imp-file');
    if (f) f.addEventListener('change', function () {
      var file = f.files[0]; if (!file) return; toast('Đang đọc ' + file.name + '…');
      LN.readFileText(file).then(function (txt) { runImport(txt, file.name); }).catch(function (e) { toast(e.message || 'Không đọc được file.'); });
    });
    var rv = document.getElementById('imp-review');
    if (rv) {
      var upd = function (ev) {
        var el = ev.target, k = el.getAttribute('data-imp'); if (!k) return; var x = IMP.items[+el.getAttribute('data-i')];
        if (k === 'inc') x.inc = el.checked; else if (k === 'q') x.q = el.value; else if (k === 'o') { x.o = el.value.split('|').map(function (s) { return s.trim(); }).filter(Boolean); if (x.a >= x.o.length) x.a = -1; }
        else if (k === 'a') x.a = +el.value; else if (k === 'ans') x.ans = el.value.split('/').map(function (s) { return s.trim(); }).filter(Boolean); else if (k === 'topic') x.topic = el.value;
        if (k === 'o' || k === 'a' || k === 'ans') { if (hasAns(x)) x.inc = true; viewGrammarAdmin(location.hash.split('/')[3]); }
      };
      rv.addEventListener('change', upd);
    }
  }
  function runImport(txt, fname) {
    var items = LN.parseExercises(txt);
    items.forEach(function (x) { x.inc = hasAns(x); });
    IMP = { items: items, fname: fname || '' };
    toast(items.length ? 'Trợ lý tìm thấy ' + items.length + ' câu' : 'Không tìm thấy câu hỏi nào');
    viewGrammarAdmin(location.hash.split('/')[3]);
    var r = document.getElementById('imp-review'); if (r) r.scrollIntoView({ behavior: 'smooth' });
  }
  function saveImport() {
    var pick = IMP.items.filter(function (x) { return x.inc && hasAns(x); });
    if (!pick.length) { toast('Chưa có câu nào đủ đáp án để thêm.'); return; }
    var cur = location.hash.split('/')[3] || LN.grammar()[0].id, by = {};
    pick.forEach(function (x) { var t = x.topic || cur; (by[t] = by[t] || []).push(x); });
    var imps = store.get('ln_imports', []), base = (IMP.fname || 'Bài dán').replace(/\.[^.]+$/, ''), stamp = Date.now().toString(36);
    Object.keys(by).forEach(function (t, k) {
      imps.push({ id: 'imp' + stamp + k, title: 'Bài tập: ' + base, topic: t, type: 'mcq', created: Date.now(), source: IMP.fname || '',
        items: by[t].map(function (x) { return x.type === 'mcq' ? { type: 'mcq', q: x.q, o: x.o, a: x.a } : { type: 'fill', q: x.q, a: x.ans }; }) });
    });
    store.set('ln_imports', imps); LN.registerImports();
    toast('Đã thêm ' + pick.length + ' câu vào ' + Object.keys(by).length + ' chủ điểm'); IMP = null; viewGrammarAdmin(cur);
  }

  /* ---- Phiếu báo cáo: vẽ ---- */
  function drawReport2() {
    var cv = document.getElementById('rp-cv'); if (!cv) return;
    var s = summary(RP.un, RP.days), all = summary(RP.un, 0), fs = feeStatus(RP.un), at = attOf(RP.un, RP.days), W = 1080, H = 1900, c = cv.getContext('2d');
    cv.width = W; cv.height = H;
    var HEAD = '"Mali", "Quicksand", sans-serif', BODY = '"Quicksand", system-ui, sans-serif', INK = '#3B2A3A', INK2 = '#75606F';
    c.fillStyle = '#FFF8EE'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#FFF4CF'; c.beginPath(); c.arc(1010, 1830, 190, 0, 7); c.fill(); c.fillStyle = '#FFE6EE'; c.beginPath(); c.arc(60, 1860, 120, 0, 7); c.fill();
    rr(c, 40, 40, 1000, 230, 44, '#FFE6EE');
    c.fillStyle = '#C93A6C'; c.font = '800 58px ' + HEAD; c.fillText('PHIẾU BÁO CÁO HỌC TẬP', 84, 132);
    c.fillStyle = INK2; c.font = '700 30px ' + BODY; c.fillText('Aurora English · Tiếng Anh lớp 4 · ' + klass().name, 86, 182);
    var to = new Date(), from = RP.days ? new Date(Date.now() - (RP.days - 1) * 86400000) : (all.u.created ? new Date(all.u.created) : new Date());
    c.font = '600 26px ' + BODY; c.fillText((RP.days ? RP.days + ' ngày qua: ' : 'Từ đầu khoá: ') + fmtD(from) + ' – ' + fmtD(to), 86, 228);
    drawChick(c, 820, 52, 200);
    c.fillStyle = INK; c.font = '800 60px ' + HEAD; c.fillText(all.u.name || '', 60, 360);
    c.fillStyle = INK2; c.font = '600 26px ' + BODY; c.fillText(LN.gradeName(all.u.grade) + (all.cur ? ' · đang học Bài ' + all.cur.n + ': ' + all.cur.vi : ' · đã học xong ' + all.units.length + ' bài'), 62, 402);
    var st = [['Bài đã xong', all.unitsDone + '/' + all.units.length, '#FFE6EE', '#C93A6C'], ['Làm đúng', s.acc == null ? '—' : s.acc + '%', '#DDF6EC', '#1E8A63'], ['Câu đã luyện', String(s.answered), '#FFF4CF', '#8A6200'], ['Ngày tự học', String(s.activeDays), '#E2F1FD', '#2E7CC0']];
    st.forEach(function (x, i) { var X = 40 + i * 255; rr(c, X, 436, 235, 150, 30, x[2]); c.fillStyle = x[3]; c.font = '800 58px ' + HEAD; c.fillText(x[1], X + 26, 520); c.fillStyle = INK2; c.font = '700 24px ' + BODY; c.fillText(x[0], X + 28, 562); });
    // chuyên cần
    rr(c, 40, 610, 490, 210, 30, '#FFFFFF', '#F2DDE3');
    c.fillStyle = INK; c.font = '800 30px ' + HEAD; c.fillText('Chuyên cần trên lớp', 70, 660);
    if (at.total) {
      c.fillStyle = '#1E8A63'; c.font = '800 52px ' + HEAD; c.fillText(at.present + '/' + at.total, 70, 728); var aw = c.measureText(at.present + '/' + at.total).width; c.fillStyle = INK2; c.font = '700 24px ' + BODY; c.fillText('buổi có mặt', 70 + aw + 14, 726);
      c.font = '700 22px ' + BODY; c.fillStyle = INK2; c.fillText('Vắng có phép: ' + at.e + '  ·  Không phép: ' + at.a + '  ·  Muộn: ' + at.l, 70, 772);
      rr(c, 70, 790, 430, 14, 7, '#F6E9EE'); rr(c, 70, 790, Math.max(14, 430 * at.present / at.total), 14, 7, '#2FB383');
    } else { c.fillStyle = INK2; c.font = '600 23px ' + BODY; c.fillText('Chưa có buổi điểm danh trong thời gian này.', 70, 720); }
    // học phí
    if (fs.owed > 0) {
      rr(c, 550, 610, 490, 210, 30, '#FFE4E2'); c.strokeStyle = '#EF5B5B'; c.lineWidth = 6; rr(c, 553, 613, 484, 204, 28, null); c.stroke();
      c.fillStyle = '#C53D3D'; c.font = '800 28px ' + HEAD; c.fillText('⚠ HỌC PHÍ CÒN THIẾU', 580, 660);
      c.font = '800 60px ' + HEAD; c.fillText(money(fs.owed), 580, 730);
      c.fillStyle = '#7A2E2E'; c.font = '700 21px ' + BODY;
      var ml = 'Tháng: ' + fs.unpaid.map(function (x) { return ymLabel(x.m); }).join(', '); while (c.measureText(ml).width > 430 && ml.length > 12) ml = ml.slice(0, -4) + '…';
      c.fillText(ml, 580, 770); c.fillText('Phụ huynh vui lòng đóng sớm. Xin cảm ơn!', 580, 800);
    } else {
      rr(c, 550, 610, 490, 210, 30, '#DDF6EC'); c.fillStyle = '#1E8A63'; c.font = '800 30px ' + HEAD; c.fillText('Học phí', 580, 660);
      c.font = '800 46px ' + HEAD; c.fillText('Đã đóng đủ ✓', 580, 730); c.fillStyle = INK2; c.font = '700 22px ' + BODY; c.fillText('Đến tháng ' + ymLabel(ym()) + ' · cảm ơn phụ huynh!', 580, 772);
    }
    // tiến độ bài
    rr(c, 40, 846, 1000, 520, 34, '#FFFFFF', '#F2DDE3');
    c.fillStyle = INK; c.font = '800 34px ' + HEAD; c.fillText('Tiến độ ' + all.units.length + ' bài học', 76, 904);
    c.fillStyle = INK2; c.font = '600 22px ' + BODY; c.textAlign = 'right'; c.fillText('Tiến độ chung ' + all.overall + '%', 1004, 902); c.textAlign = 'left';
    all.units.forEach(function (x, i) {
      var col = i < 10 ? 0 : 1, row = i % 10, X = 76 + col * 490, Y = 942 + row * 41;
      c.fillStyle = INK; c.font = '700 21px ' + BODY; var lab = 'Bài ' + x.u.n + '. ' + x.u.vi; while (c.measureText(lab).width > 250 && lab.length > 6) lab = lab.slice(0, -2); if (lab !== 'Bài ' + x.u.n + '. ' + x.u.vi) lab = lab.replace(/\s+$/, '') + '…'; c.fillText(lab, X, Y + 20);
      rr(c, X + 262, Y + 4, 140, 18, 9, '#F6E9EE'); if (x.s.pct) rr(c, X + 262, Y + 4, Math.max(18, 140 * x.s.pct / 100), 18, 9, x.s.pct === 100 ? '#2FB383' : '#F2558B');
      c.fillStyle = x.s.pct === 100 ? '#1E8A63' : INK2; c.font = '800 20px ' + BODY; c.fillText(x.s.pct + '%', X + 412, Y + 21);
    });
    function box(X, title, items, bg, fg, empty) {
      rr(c, X, 1390, 490, 196, 30, bg); c.fillStyle = fg; c.font = '800 30px ' + HEAD; c.fillText(title, X + 28, 1440);
      if (!items.length) { c.fillStyle = INK2; c.font = '600 22px ' + BODY; wrap(c, empty, 430).slice(0, 3).forEach(function (l, i) { c.fillText(l, X + 28, 1482 + i * 32); }); return; }
      c.fillStyle = INK; c.font = '700 22px ' + BODY;
      items.slice(0, 3).forEach(function (t, i) { var nm = t.name, tail = ' — ' + t.acc + '%'; while (c.measureText('• ' + nm + tail).width > 440 && nm.length > 4) nm = nm.slice(0, -2); if (nm !== t.name) nm = nm.replace(/\s+$/, '') + '…'; c.fillText('• ' + nm + tail, X + 28, 1484 + i * 38); });
    }
    box(40, 'Điểm mạnh', all.strong, '#DDF6EC', '#1E8A63', all.topics.length ? 'Con đang tiến bộ đều ở các phần.' : 'Con chưa làm đủ bài để đánh giá.');
    box(550, 'Cần cố gắng', all.weak, '#FFE6EE', '#C93A6C', 'Chưa có phần nào dưới 70%. Tốt lắm!');
    rr(c, 40, 1610, 1000, 190, 30, '#FFFFFF', '#FFE494');
    c.fillStyle = '#8A6200'; c.font = '800 28px ' + HEAD; c.fillText('Nhận xét của giáo viên', 72, 1656);
    c.fillStyle = INK; c.font = '600 23px ' + BODY;
    var lines = wrap(c, RP.comment || '', 936); if (lines.length > 4) { lines = lines.slice(0, 4); lines[3] = lines[3].replace(/.{0,2}$/, '…'); }
    lines.forEach(function (l, i) { c.fillText(l, 72, 1696 + i * 30); });
    c.fillStyle = INK2; c.font = '700 22px ' + BODY; c.fillText((RP.teacher ? 'Giáo viên: ' + RP.teacher + '   ·   ' : '') + 'Ngày lập: ' + fmtD(Date.now()), 44, 1862);
    c.fillStyle = '#C93A6C'; c.font = '800 24px ' + HEAD; c.textAlign = 'right'; c.fillText('⭐ ' + all.stars + ' sao   🔥 ' + all.streak + ' ngày liền', 1036, 1862); c.textAlign = 'left';
  }

  /* ---- Dữ liệu mẫu cho lớp ---- */
  function demoClass() {
    var users = LN.users(), demo = Object.keys(users).filter(function (u) { return users[u].demo; }), att = attAll(), fees = store.get('ln_fees', {}), k = klass();
    var probs = { mau_an: [0.95, 0.03, 0.02, 0], mau_binh: [0.8, 0.1, 0.05, 0.05], mau_chi: [0.65, 0.1, 0.1, 0.15], mau_dung: [0.85, 0.05, 0.1, 0] };
    for (var i = 0; i < 35; i++) {
      var d = new Date(); d.setDate(d.getDate() - i); var wd = d.getDay(), vn = wd === 0 ? 8 : wd + 1; if (k.days.indexOf(vn) < 0) continue;
      var key = LN.dayKey(d); att[key] = att[key] || {};
      demo.forEach(function (u) {
        var pr = probs[u] || [0.85, 0.05, 0.05, 0.05], r = Math.random(), s = r < pr[0] ? 'p' : r < pr[0] + pr[1] ? 'l' : r < pr[0] + pr[1] + pr[2] ? 'e' : 'a';
        att[key][u] = { s: s, note: s === 'e' ? 'Ốm, phụ huynh báo' : s === 'a' ? '' : '' };
      });
    }
    store.set('ln_att', att);
    var start = ym(new Date(Date.now() - 40 * 86400000)), months = monthsBetween(start, ym());
    demo.forEach(function (u, i) {
      users[u].joined = start + '-05'; users[u].status = 'active';
      var pays = [];
      months.forEach(function (m, j) { if (i === 0 || (i === 1 && j < months.length - 1) || (i === 2 && j === 0)) pays.push({ id: 'p' + i + j, month: m, amount: i === 2 ? k.fee / 2 : k.fee, date: m + '-08', note: j % 2 ? 'Chuyển khoản' : 'Tiền mặt' }); });
      fees[u] = { fee: k.fee, start: start, payments: pays };
    });
    store.set('ln_users', users); store.set('ln_fees', fees);
  }

  /* ================= Điều hướng & sự kiện ================= */
  LN.adminRoute = function (parts) {
    if (!authed()) { viewLogin(); return; }
    if (cur().must) { viewForceChange(); return; }
    var p1 = parts[1] ? decodeURIComponent(parts[1]) : null;
    switch (parts[0]) {
      case 's': viewStudent(p1); break;
      case 'report': viewReport(p1); break;
      case 'grammar': viewGrammarAdmin(parts[1]); break;
      case 'data': viewData(); break;
      case 'ai': viewAI(); break;
      case 'students': viewRoster(); break;
      case 'attendance': viewAttendance(p1); break;
      case 'fees': viewFees(); break;
      case 'account': viewAccount(); break;
      default: viewOverview();
    }
  };
  LN.adminClick = function (a, t, ev) {
    var un = t.getAttribute('data-u');
    if (a === 'a-logout') { ev.preventDefault(); store.del('ln_admin_session'); toast('Đã đăng xuất quản trị'); LN.go('#/'); }
    else if (a === 'a-open') { if (ev.target.closest('a')) return; LN.go('#/admin/s/' + encodeURIComponent(un)); }
    else if (a === 'a-sort') { var k = t.getAttribute('data-k'); SORT = { k: k, d: SORT.k === k ? -SORT.d : (k === 'name' ? 1 : -1) }; viewOverview(); }
    else if (a === 'a-demo') { makeDemo(); toast('Đã tạo 4 học sinh mẫu'); if (location.hash === '#/admin') viewOverview(); else LN.go('#/admin'); }
    else if (a === 'a-undemo') { var all = LN.users(); Object.keys(all).forEach(function (u) { if (all[u].demo) { delete all[u]; store.del('ln_prog_' + u); store.del('ln_note_' + u); var fz = store.get('ln_fees', {}); delete fz[u]; store.set('ln_fees', fz); } }); store.set('ln_users', all); toast('Đã xoá học sinh mẫu'); LN.route(); }
    else if (a === 't-reset' || a === 't-del') {
      if (!cur() || cur().role !== 'owner') return;
      var tu = t.getAttribute('data-u'), tl = teachers();
      if (a === 't-del') { if (!confirm('Xoá tài khoản giáo viên @' + tu + '?')) return; store.set('ln_teachers', tl.filter(function (x) { return x.user !== tu; })); toast('Đã xoá @' + tu); viewAccount(); return; }
      var np = prompt('Mật khẩu mới cho giáo viên @' + tu + ' (ít nhất 8 ký tự):'); if (np == null) return; if (np.length < 8) { toast('Mật khẩu cần ít nhất 8 ký tự.'); return; }
      store.set('ln_teachers', tl.map(function (x) { if (x.user === tu) { x.pass = LN.hash('admin:' + tu + ':' + np); x.must = true; } return x; })); viewAccount({ ok: true, msg: 'Đã cấp lại mật khẩu cho @' + tu + ': ' + np });
    }
    else if (a === 'r-add') { ADDOPEN = !ADDOPEN; ADDERR = ''; viewRoster(); if (ADDOPEN) document.getElementById('n-name').focus(); }
    else if (a === 'att-set' || a === 'att-all') {
      var d0 = t.getAttribute('data-d'), at = attAll(); at[d0] = at[d0] || {};
      var who = a === 'att-all' ? sortedUsers(function (u) { return u.status !== 'stopped'; }) : [un];
      who.forEach(function (u) { at[d0][u] = at[d0][u] || {}; var sv = a === 'att-all' ? 'p' : t.getAttribute('data-s'); at[d0][u].s = (a === 'att-set' && at[d0][u].s === sv) ? null : sv; });
      store.set('ln_att', at); var y = window.scrollY; viewAttendance(d0); window.scrollTo(0, y); saved();
    }
    else if (a === 'fee-open') { FEEOPEN = FEEOPEN === un ? null : un; viewFees(); }
    else if (a === 'fee-save') {
      var amt = +document.getElementById('pay-amt').value; if (!(amt > 0)) { toast('Nhập số tiền.'); return; }
      var fees = store.get('ln_fees', {}); fees[un] = fees[un] || { payments: [] }; fees[un].payments = fees[un].payments || [];
      fees[un].payments.push({ id: 'p' + Date.now().toString(36), month: document.getElementById('pay-month').value, amount: amt, date: document.getElementById('pay-date').value || LN.dayKey(), note: document.getElementById('pay-note').value.trim() });
      store.set('ln_fees', fees); toast('Đã ghi nhận ' + money(amt)); viewFees(); saved();
    }
    else if (a === 'fee-del') {
      if (!confirm('Xoá khoản đóng tiền này?')) return;
      var fees2 = store.get('ln_fees', {}), pid = t.getAttribute('data-id'); if (fees2[un]) fees2[un].payments = (fees2[un].payments || []).filter(function (p) { return p.id !== pid; });
      store.set('ln_fees', fees2); viewFees(); saved();
    }
    else if (a === 'imp-run') { var tx0 = (document.getElementById('imp-text') || {}).value || ''; if (!tx0.trim()) { toast('Dán bài tập hoặc chọn file trước.'); return; } runImport(tx0, ''); }
    else if (a === 'imp-save') saveImport();
    else if (a === 'imp-cancel') { IMP = null; viewGrammarAdmin(location.hash.split('/')[3]); }
    else if (a === 'imp-all-topic') { var cid = location.hash.split('/')[3] || LN.grammar()[0].id; IMP.items.forEach(function (x) { x.topic = cid; }); viewGrammarAdmin(cid); toast('Đã xếp tất cả vào chủ điểm đang mở'); }
    else if (a === 'imp-del') { if (!confirm('Xoá bài tập đã nạp này?')) return; var iid = t.getAttribute('data-id'); store.set('ln_imports', store.get('ln_imports', []).filter(function (e) { return e.id !== iid; })); LN.registerImports(); viewGrammarAdmin(location.hash.split('/')[3]); toast('Đã xoá'); }
    else if (a === 'ai-recheck') { LN.ai.check(true).then(function () { viewAI(); }); }
    else if (a === 'ai-del') { LN.ai.saveCfg({ key: '' }); viewAI({ ok: true, html: 'Đã xoá khoá trên máy này.' }); }
    else if (a === 'ai-test') {
      var out = document.getElementById('ai-test-out'); out.innerHTML = '<p class="muted" style="margin-top:10px">Đang hỏi Chíp…</p>';
      LN.ai.call('explain', { q: 'She ___ a doctor.', options: ['is', 'are', 'am'], correct: 'is', picked: 'are' }).then(function (r) {
        out.innerHTML = '<div class="note note-mint" style="margin-top:10px">✅ Chíp AI hoạt động' + (r._model ? ' (' + esc(r._model) + ')' : '') + ':<br>' + LN.mdb(r.vi || '') + (r.example ? '<br><i>' + esc(r.example) + '</i>' : '') + '</div>';
      }).catch(function (e) { out.innerHTML = '<div class="note note-yel" style="margin-top:10px">❌ ' + esc(e.message || 'Chưa gọi được AI') + '</div>'; });
    }
    else if (a === 'a-savenote') { store.set('ln_note_' + un, document.getElementById('a-note').value); toast('Đã lưu nhận xét'); }
    else if (a === 'a-autocmt') { var tn = autoComment(summary(un, 7)); document.getElementById('a-note').value = tn; store.set('ln_note_' + un, tn); saved(); toast('Đã điền và lưu gợi ý — sửa tiếp nếu cần'); }
    else if (a === 'a-resetpw') {
      var np = prompt('Mật khẩu mới cho @' + un + ' (ít nhất 6 ký tự):'); if (np == null) return;
      if (np.length < 6) { toast('Mật khẩu cần ít nhất 6 ký tự.'); return; }
      var all2 = LN.users(); all2[un].pass = LN.hash(un + ':' + np); store.set('ln_users', all2); toast('Đã đặt lại mật khẩu cho @' + un);
    }
    else if (a === 'a-del') {
      if (!confirm('Xoá tài khoản @' + un + ' và toàn bộ tiến độ học? Không hoàn tác được.')) return;
      var all3 = LN.users(); delete all3[un]; store.set('ln_users', all3); store.del('ln_prog_' + un); store.del('ln_note_' + un);
      if (store.get('ln_session') === un) store.del('ln_session');
      toast('Đã xoá @' + un); LN.go('#/admin');
    }
    else if (a === 'a-rpauto') { var tx = autoComment(summary(RP.un, RP.days || 0)); document.getElementById('rp-cmt').value = tx; RP.comment = tx; store.set('ln_note_' + RP.un, tx); saved(); drawReport2(); }
    else if (a === 'a-rpdown') {
      var cv = document.getElementById('rp-cv'), nm = (LN.users()[RP.un].name || RP.un).replace(/\s+/g, '_');
      var save = function (url) { var l = document.createElement('a'); l.href = url; l.download = 'BaoCao_' + nm + '_' + LN.dayKey() + '.png'; document.body.appendChild(l); l.click(); l.remove(); };
      if (cv.toBlob) cv.toBlob(function (b) { var u = URL.createObjectURL(b); save(u); setTimeout(function () { URL.revokeObjectURL(u); }, 4000); }, 'image/png');
      else save(cv.toDataURL('image/png'));
      toast('Đã tải ảnh phiếu báo cáo');
    }
    else if (a === 'a-export') {
      var obj = {}; store.keys().forEach(function (k) { if (k !== 'ln_admin_session' && k !== 'ln_session' && k !== 'ln_admin' && k !== 'ln_admin_fail' && k !== 'ln_teachers') obj[k] = store.get(k); });
      var url = URL.createObjectURL(new Blob([JSON.stringify(obj, null, 1)], { type: 'application/json' }));
      var l2 = document.createElement('a'); l2.href = url; l2.download = 'AuroraEnglish_saoluu_' + LN.dayKey() + '.json'; document.body.appendChild(l2); l2.click(); l2.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      toast('Đã tải file sao lưu');
    }
    else if (a === 'g-new') {
      var list = LN.grammar(), cur = location.hash.split('/')[3], base = list.filter(function (x) { return x.id === cur; })[0];
      var nt = { id: 'c' + Date.now().toString(36), block: 'other', icon: '📘', group: 'Chủ điểm thêm', title: 'Chủ điểm mới', summary: '', body: '# Cách dùng\n- …\n\n# Công thức\n| Dạng câu | Công thức | Ví dụ |\n| (+) Khẳng định | … | … |\n| (–) Phủ định | … | … |\n| (?) Nghi vấn | … | … |\n\n# Ví dụ\n> English sentence. || Câu dịch.' };
      list.push(nt); LN.saveGrammar(list); LN.go('#/admin/grammar/' + nt.id);
    }
    else if (a === 'g-del' || a === 'g-up' || a === 'g-down') {
      var list2 = LN.grammar(), id = location.hash.split('/')[3] || (list2[0] && list2[0].id), ix = -1;
      list2.forEach(function (x, i) { if (x.id === id) ix = i; }); if (ix < 0) return;
      if (a === 'g-del') { if (!confirm('Xoá chủ điểm "' + list2[ix].title + '"?')) return; var dl = store.get('ln_grammar_del', []); dl.push(list2[ix].id); store.set('ln_grammar_del', dl); list2.splice(ix, 1); LN.saveGrammar(list2); LN.go('#/admin/grammar' + (list2[0] ? '/' + list2[0].id : '')); return; }
      var j = a === 'g-up' ? ix - 1 : ix + 1; if (j < 0 || j >= list2.length) return;
      var tmp = list2[ix]; list2[ix] = list2[j]; list2[j] = tmp; LN.saveGrammar(list2); viewGrammarAdmin(id);
    }
    else if (a === 'g-preview') {
      var gb = document.getElementById('g-body'), gm = document.getElementById('g-main'); if (!gb || !gm) return;
      var r = LN.gmark(gb.value); gm.innerHTML = '<div class="gdoc"><div class="note note-yel" style="margin-bottom:12px">Bản xem trước — chưa lưu.</div>' + r.html + '</div>'; toast('Đang xem trước, bấm Lưu để giữ lại');
    }
    else if (a === 'g-restore') {
      var gid = location.hash.split('/')[3]; if (!confirm('Bỏ chỉnh sửa và dùng lại nội dung gốc của chủ điểm này?')) return;
      var l3 = LN.grammar(), d0 = window.GRAMMAR_DEFAULT.filter(function (y) { return y.id === gid; })[0], k3 = -1; l3.forEach(function (x, i) { if (x.id === gid) k3 = i; });
      if (d0 && k3 >= 0) { l3[k3] = Object.assign({}, d0); LN.saveGrammar(l3); toast('Đã khôi phục nội dung gốc'); viewGrammarAdmin(gid); }
    }
    else if (a === 'g-reset') { if (!confirm('Bỏ mọi chỉnh sửa và dùng lại nội dung Ngữ pháp tổng hợp mặc định?')) return; store.del('ln_grammar'); store.del('ln_grammar_del'); if (location.hash === '#/admin/grammar') viewGrammarAdmin(); else LN.go('#/admin/grammar'); toast('Đã khôi phục mặc định'); }
  };
})();
