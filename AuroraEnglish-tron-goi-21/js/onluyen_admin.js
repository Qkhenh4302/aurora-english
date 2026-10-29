/* Aurora English — Ôn luyện đề: trang của cô (tạo đề từ Word / PDF / Excel bằng Gemini, xem & sửa, giao lớp, xem kết quả, chấm lại câu viết) */
(function () {
  var LN = window.LN, store = LN.store, esc = LN.esc, OL = LN.OL, toast = function (m) { if (LN.toast) LN.toast(m); };
  var LET = 'ABCDEFGH';
  function ix() { var x = store.get('ln_ol', null); x = x && x.tests ? x : { tests: {} }; return JSON.parse(JSON.stringify(x)); }
  function saveIx(x) { store.set('ln_ol', x); }
  function getT(id) { var t = store.get('ln_olt_' + id, null); return t ? OL.normalize(JSON.parse(JSON.stringify(t))) : null; }
  function clean(T) {   // bỏ các trường tạm trước khi lưu
    var o = JSON.parse(JSON.stringify(T, function (k, v) { return k === '_p' || k === '_id' ? undefined : v; }));
    return o;
  }
  /* Lưu đề: hình (data:) được tải lên máy chủ thành đường dẫn riêng để nội dung đề nhỏ, đồng bộ nhanh */
  function upImg(d) {
    if (!/^data:image\//.test(d || '') || !(LN.cloud && LN.cloud.on && LN.cloud.api) || !tok()) return Promise.resolve(d);
    return LN.cloud.api('aolimg', { token: tok(), data: d }).then(function (j) { return j.h ? 'api/data?olimg=' + j.h : d; }, function () { return d; });
  }
  function saveT(id, T, quiet) {
    OL.normalize(T);
    var jobs = [];
    T.parts.forEach(function (p) { p.items.forEach(function (it) {
      if (/^data:/.test(it.src || '')) jobs.push(upImg(it.src).then(function (u) { it.src = u; }));
      if (typeof it.img === 'string' && /^data:/.test(it.img)) jobs.push(upImg(it.img).then(function (u) { it.img = u; }));
    }); });
    return Promise.all(jobs).then(function () {
      var o = clean(T), str = JSON.stringify(o);
      if (str.length > 850000) { toast('⚠ Đề quá lớn (' + Math.round(str.length / 1024) + ' KB) – chưa lưu được. Cô bớt hình hoặc chia đề làm hai.'); throw new Error('big'); }
      T.v = o.v = Date.now();
      store.set('ln_olt_' + id, o);
      var x = ix(), m = x.tests[id] || (x.tests[id] = { status: 'nhap', created: Date.now() });
      if (m.grade == null) m.grade = guessGrade((T.title || '') + ' ' + (T.kicker || '') + ' ' + (T.desc || '')) || null;
      m.title = T.title || 'Đề ôn luyện'; m.kicker = T.kicker || ''; m.n = T.total; m.updated = T.v; m.nokey = T.nokey || 0; delete m.del; saveIx(x);
      if (!quiet) toast('✅ Đã lưu đề');
      return T;
    });
  }
  function newId(title) { var b = String(title || 'de').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'de'; return b + '-' + Date.now().toString(36).slice(-5); }
  function tok() { var s = store.get('ln_admin_session', null); return s && s.tok; }
  function shell(body) { LN.adminShell('onluyen', '<div class="olx" style="background:transparent;min-height:0">' + body + '</div>'); OL.fonts(); }
  function users() { return LN.users ? LN.users() : store.get('ln_users', {}); }
  function classes() { var c = store.get('ln_classes', {}) || {}; return Object.keys(c).map(function (k) { return c[k]; }).filter(function (c) { return c && !c.del && !c.archived; }); }
  function gname(g) { return LN.gradeName ? LN.gradeName(+g) : 'Lớp ' + g; }
  /* khối của đề: cô chọn, hoặc đoán từ tên đề (vd. "Tiếng Anh 7", "GS7", "lớp 4") */
  function guessGrade(t) { var m = /(?:lớp|lop|khối|khoi|tiếng anh|tieng anh|grade|gs|global success)\s*(\d{1,2})\b/i.exec(String(t || '')); var g = m ? +m[1] : 0; return g >= 1 && g <= 12 ? g : 0; }
  function gradeOf(m) { return +m.grade || guessGrade((m.title || '') + ' ' + (m.kicker || '') + ' ' + (m.src || '')) || (m.grades && m.grades.length ? +m.grades[0] : 0); }
  function uh(un) { return LN.hash('ol:' + un); }
  /* lớp có thêm / bớt học sinh: cập nhật danh sách được giao theo lớp */
  function syncClassUsers() {
    var x = ix(), C = classes(), ch = false;
    Object.keys(x.tests).forEach(function (id) {
      var m = x.tests[id]; if (!m || m.del || m.status !== 'giao' || !(m.classes || []).length) return;
      var us = {}; C.forEach(function (c) { if (m.classes.indexOf(c.id) < 0) return; (c.students || []).forEach(function (s) { if (s.user && !s.left) us[uh(s.user)] = 1; }); });
      var nu = Object.keys(us).sort(); if (JSON.stringify(nu) !== JSON.stringify(m.uh || [])) { m.uh = nu; ch = true; }
      if (m.users) { delete m.users; ch = true; }
    });
    if (ch) saveIx(x);
  }
  function clsOf(un) { var r = ''; classes().some(function (c) { return (c.students || []).some(function (s) { if (s.user === un && !s.left) { r = c.name || ''; return true; } return false; }); }); return r; }

  /* ================= Danh sách đề ================= */
  function viewList() {
    syncClassUsers();
    var x = ix(), ids = Object.keys(x.tests).filter(function (id) { return !x.tests[id].del; }).sort(function (a, b) { return (x.tests[b].updated || 0) - (x.tests[a].updated || 0); });
    var cnt = {}; Object.keys(users()).forEach(function (un) { var p = store.get('ln_prog_' + un, null); if (p && p.ol) Object.keys(p.ol).forEach(function (id) { cnt[id] = (cnt[id] || 0) + 1; }); });
    shell('<h1 style="margin-bottom:6px">📝 Ôn luyện đề</h1><p class="muted" style="margin-bottom:16px">Tải lên file đề (Word, PDF hoặc Excel) có đáp án → web tự tạo đề ôn luyện giống mẫu GS7. Học sinh làm xong bấm Nộp bài mới thấy điểm, đáp án, lí do sai và lí thuyết từng câu; cô luôn xem được toàn bộ đáp án ở đây. Cô xem và sửa bản nháp rồi mới giao cho lớp.</p>' +
      '<div class="ol-toolbar" style="margin-bottom:16px"><a class="ol-btn ol-solid" style="text-decoration:none" href="#/admin/onluyen/moi">➕ Tạo đề từ file Word / PDF / Excel</a>' + (x.tests['gs7-mid1'] && !x.tests['gs7-mid1'].del ? '' : '<button type="button" class="ol-btn" data-ola="sample">Nạp đề mẫu GS7</button>') + '</div>' +
      (ids.length ? (function () {
        var groups = {}; ids.forEach(function (id) { var g = gradeOf(x.tests[id]); (groups[g] = groups[g] || []).push(id); });
        var gs = Object.keys(groups).map(Number).sort(function (a, b) { return (a || 99) - (b || 99); });
        return '<div class="ol-toolbar" style="margin-bottom:12px">' + gs.map(function (g) { return '<button type="button" class="ol-btn ol-sm" data-ola="jumpg" data-g="' + g + '">' + (g ? 'Khối ' + g : 'Chưa xếp khối') + ' · ' + groups[g].length + ' đề</button>'; }).join('') + '</div>' +
          gs.map(function (g) { return '<section id="olg-' + g + '" style="margin-bottom:22px"><h2 style="margin:6px 0 10px;color:var(--brand)">' + (g ? '📚 Khối ' + g : '📂 Chưa xếp khối') + ' <span class="ol-hint" style="font-weight:600">(' + groups[g].length + ' đề)</span></h2>' + (g ? '' : '<p class="ol-hint" style="margin:-4px 0 10px">Mở đề → «Sửa tên đề» để chọn khối.</p>') + '<div class="ol-list">' + groups[g].map(card).join('') + '</div></section>'; }).join('');
      })() : '<div class="ol-empty">Chưa có đề nào. Bấm <b>Tạo đề từ file</b> để bắt đầu.</div>'));
    function card(id) {
        var m = x.tests[id], to = [];
        (m.grades || []).forEach(function (g) { to.push(gname(g)); }); (m.classNames || []).forEach(function (n) { to.push(n); });
        return '<div class="ol-card"><span class="ol-k2">' + esc(m.kicker || 'Đề ôn luyện') + '</span><h3>' + esc(m.title) + '</h3>' +
          '<p>' + (m.status === 'giao' ? '<span class="ol-pill ol-g">Đã giao</span> ' + esc(to.join(', ') || '—') : '<span class="ol-pill ol-y">Bản nháp – học sinh chưa thấy</span>') + '</p>' +
          '<p>' + (m.n || 0) + ' câu · ' + (cnt[id] || 0) + ' học sinh đã làm' + (m.src ? ' · từ file ' + esc(m.src) : '') + '</p>' +
          '<div class="ol-act"><a class="ol-btn ol-sm" style="text-decoration:none" href="#/admin/onluyen/' + id + '">✏️ Xem & sửa</a>' +
          '<button type="button" class="ol-btn ol-sm' + (m.status === 'giao' ? '' : ' ol-solid') + '" data-ola="assign" data-id="' + id + '">' + (m.status === 'giao' ? 'Đổi lớp được giao' : '📤 Giao đề') + '</button>' +
          '<a class="ol-btn ol-sm" style="text-decoration:none" href="#/admin/onluyen/' + id + '/kq">📊 Kết quả</a>' +
          (m.status === 'giao' ? '<button type="button" class="ol-btn ol-sm ol-ghost" data-ola="unassign" data-id="' + id + '">Thu hồi</button>' : '') +
          '<button type="button" class="ol-btn ol-sm ol-ghost" data-ola="del" data-id="' + id + '">Xoá</button></div></div>';
    }
  }

  /* ================= Giao đề ================= */
  function assignModal(id) {
    var x = ix(), m = x.tests[id]; if (!m) return;
    var U = users(), gs = {}; Object.keys(U).forEach(function (un) { var u = U[un]; if (u && u.status !== 'stopped' && u.grade) gs[+u.grade] = (gs[+u.grade] || 0) + 1; });
    var C = classes();
    var box = document.createElement('div'); box.className = 'ol-modal olx'; box.style.background = 'rgba(40,10,25,.45)';
    box.innerHTML = '<div><h2 style="color:var(--brand)">📤 Giao đề: ' + esc(m.title) + '</h2><p class="ol-hint">Chọn lớp học và/hoặc khối. Học sinh đăng nhập sẽ thấy đề ở mục <b>Ôn luyện đề</b>.</p>' +
      (C.length ? '<b>Lớp học</b>' + C.map(function (c) { var n = (c.students || []).filter(function (s) { return s.user && !s.left; }).length; return '<label class="ol-ck"><input type="checkbox" name="cl" value="' + esc(c.id) + '"' + ((m.classes || []).indexOf(c.id) >= 0 ? ' checked' : '') + '> ' + esc(c.name || c.id) + ' <span class="ol-hint">(' + n + ' tài khoản học sinh)</span></label>'; }).join('') : '') +
      '<b>Theo khối (mọi học sinh của khối)</b>' + Object.keys(gs).sort(function (a, b) { return a - b; }).map(function (g) { return '<label class="ol-ck"><input type="checkbox" name="gr" value="' + g + '"' + ((m.grades || []).indexOf(+g) >= 0 ? ' checked' : '') + '> ' + esc(gname(g)) + ' <span class="ol-hint">(' + gs[g] + ' học sinh)</span></label>'; }).join('') +
      '<div class="ol-act"><button type="button" class="ol-btn ol-solid" data-m="ok">Giao đề</button><button type="button" class="ol-btn ol-ghost" data-m="x">Huỷ</button></div></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (ev) {
      var a = ev.target.getAttribute('data-m'); if (ev.target === box || a === 'x') { box.remove(); return; }
      if (a !== 'ok') return;
      var cl = [].map.call(box.querySelectorAll('input[name=cl]:checked'), function (i) { return i.value; }), gr = [].map.call(box.querySelectorAll('input[name=gr]:checked'), function (i) { return +i.value; });
      if (!cl.length && !gr.length) { toast('Cô chọn ít nhất một lớp hoặc một khối nhé'); return; }
      if (!store.get('ln_olt_' + id, null)) { toast('Không thấy nội dung đề'); return; }
      var us = {}, names = [];
      C.forEach(function (c) { if (cl.indexOf(c.id) < 0) return; names.push(c.name || c.id); (c.students || []).forEach(function (s) { if (s.user && !s.left) us[s.user] = 1; }); });
      var x2 = ix(), m2 = x2.tests[id]; m2.classes = cl; m2.classNames = names; m2.grades = gr; delete m2.users; m2.uh = Object.keys(us).map(uh).sort(); m2.status = 'giao'; m2.pubAt = m2.pubAt || Date.now(); m2.updated = m2.updated || Date.now();
      saveIx(x2); box.remove(); toast('📤 Đã giao đề. Học sinh tải lại trang là thấy.'); route(curParts);
    });
  }

  /* ================= Tạo đề từ file ================= */
  var JOB = null;
  function viewNew() {
    shell('<p><a href="#/admin/onluyen">← Danh sách đề</a></p><h1 style="margin:6px 0">➕ Tạo đề từ file</h1>' +
      '<p class="muted" style="margin-bottom:14px">File cần có <b>câu hỏi và đáp án</b> (phần đáp án có thể nằm cuối file). Web giữ đúng đáp án của cô, tự viết lời giải, giải thích lỗi sai và lí thuyết cần nhớ. Mất khoảng 1–3 phút.</p>' +
      '<label class="ol-drop" id="ol-drop"><input type="file" id="ol-file" accept=".pdf,.docx,.xlsx,.xls,.csv" hidden><div style="font-size:40px">📄</div><b>Bấm để chọn file</b> hoặc kéo thả file vào đây<div class="ol-hint">Word (.docx), PDF, Excel (.xlsx, .xls, .csv) · tối đa 13 MB</div></label>' +
      '<div id="ol-job" style="margin-top:16px"></div>');
    var inp = document.getElementById('ol-file'), drop = document.getElementById('ol-drop');
    inp.onchange = function () { if (inp.files[0]) start(inp.files[0]); };
    drop.ondragover = function (e) { e.preventDefault(); drop.classList.add('ol-over'); };
    drop.ondragleave = function () { drop.classList.remove('ol-over'); };
    drop.ondrop = function (e) { e.preventDefault(); drop.classList.remove('ol-over'); if (e.dataTransfer.files[0]) start(e.dataTransfer.files[0]); };
    if (JOB) drawJob();
  }
  var STEPS = ['Đọc file', 'AI đọc đề và đáp án', 'AI viết lời giải, lỗi sai & lí thuyết', 'Cắt hình, kiểm tra và lưu bản nháp'];
  function drawJob() {
    var el = document.getElementById('ol-job'); if (!el || !JOB) return;
    el.innerHTML = '<div class="ol-card"><b>' + esc(JOB.name) + '</b><div class="ol-steps">' + STEPS.map(function (s, i) {
      var c = i < JOB.step ? 'ol-done' : i === JOB.step ? (JOB.err ? 'ol-bad' : 'ol-now') : '';
      return '<div class="' + c + '">' + (i < JOB.step ? '✅' : i === JOB.step ? (JOB.err ? '❌' : '<span class="ol-spin"></span>') : '○') + ' ' + s + (i === JOB.step && JOB.sub ? ' <span class="ol-hint">' + esc(JOB.sub) + '</span>' : '') + '</div>';
    }).join('') + '</div>' + (JOB.err ? '<p style="color:var(--no)"><b>Lỗi:</b> ' + esc(JOB.err) + '</p><p class="ol-hint">Cô thử lại, hoặc lưu file thành PDF rồi tải lên.</p>' : '') +
      (JOB.t0 && !JOB.err && JOB.step < STEPS.length ? '<p class="ol-hint">Đã chạy ' + Math.round((Date.now() - JOB.t0) / 1000) + ' giây… Cô cứ để trang này mở.</p>' : '') + '</div>';
  }
  function setStep(i, sub) { JOB.step = i; JOB.sub = sub || ''; drawJob(); }
  function start(file) {
    if (JOB && !JOB.err && JOB.step < STEPS.length) { toast('Đang tạo một đề khác, cô đợi xong nhé'); return; }
    if (file.size > 13 * 1048576) { toast('File lớn quá (tối đa 13 MB). Cô chia file làm hai nhé.'); return; }
    var ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'doc') { toast('File .doc đời cũ: cô mở bằng Word rồi Lưu thành .docx hoặc PDF nhé'); return; }
    if (['pdf', 'docx', 'xlsx', 'xls', 'csv'].indexOf(ext) < 0) { toast('Chỉ nhận file Word (.docx), PDF, Excel'); return; }
    JOB = { name: file.name, step: 0, t0: Date.now(), ext: ext };
    var tick = setInterval(function () { if (!JOB || JOB.err || JOB.step >= STEPS.length) clearInterval(tick); else drawJob(); }, 1000);
    drawJob();
    var src = null;
    readFile(file, ext).then(function (s) { src = s; setStep(1, ''); return gemKey(); })
      .then(function (key) { JOB.key = key; setStep(1, KFREE ? 'khoá miễn phí' : 'khoá trả tiền'); return extract(src); })
      .then(function (raw) { setStep(2, ''); return explainAll(raw, src); })
      .then(function (T) { setStep(3, ''); return images(T, src).then(function () { return T; }); })
      .then(function (T) {
        T = OL.normalize(T);
        if (!T.total) throw new Error('AI không tìm thấy câu hỏi nào trong file.');
        var id = newId(T.title);
        return saveT(id, T, true).then(function () {
          var x = ix(); x.tests[id].src = file.name; saveIx(x);
          JOB.step = STEPS.length; JOB = null;
          toast('✅ Đã tạo bản nháp ' + T.total + ' câu. Cô xem và sửa rồi bấm Giao đề.');
          LN.go('#/admin/onluyen/' + id);
        });
      })
      .catch(function (e) { if (JOB) { JOB.err = (e && e.message) || String(e); drawJob(); } });
  }

  /* ---- đọc file ---- */
  var LIBS = {};
  function lib(name, file, test) {
    if (test()) return Promise.resolve();
    if (LIBS[name]) return LIBS[name];
    return (LIBS[name] = new Promise(function (ok, no) { var s = document.createElement('script'); s.src = 'js/' + file; s.onload = function () { ok(); }; s.onerror = function () { delete LIBS[name]; no(new Error('Không tải được thư viện ' + file)); }; document.head.appendChild(s); }));
  }
  function b64(buf) { return new Promise(function (ok) { var fr = new FileReader(); fr.onload = function () { ok(String(fr.result).split(',')[1]); }; fr.readAsDataURL(new Blob([buf])); }); }
  function readFile(file, ext) {
    return file.arrayBuffer().then(function (buf) {
      if (ext === 'pdf') return b64(buf).then(function (d) { return { kind: 'pdf', buf: buf, parts: [{ inlineData: { mimeType: 'application/pdf', data: d } }], note: 'The document is the attached PDF. Look at the page images carefully (underlined letters, boxes, pictures).' }; });
      if (ext === 'docx') return lib('mammoth', 'ol_mammoth.min.js', function () { return !!window.mammoth; }).then(function () {
        var imgs = {}, n = 0;
        return window.mammoth.convertToHtml({ arrayBuffer: buf }, { styleMap: ['u => u'], convertImage: window.mammoth.images.imgElement(function (im) { return im.read('base64').then(function (d) { n++; var id = 'IMG' + n; imgs[id] = 'data:' + im.contentType + ';base64,' + d; return { src: id }; }); }) })
          .then(function (r) {
            var txt = htmlToText(r.value), parts = [{ text: 'DOCUMENT (converted from Word; underline kept as <u>…</u>; pictures marked [[IMGn]]):\n' + txt }];
            Object.keys(imgs).slice(0, 16).forEach(function (id) { var m = /^data:(image\/(png|jpeg|jpg|gif|webp));base64,(.*)$/.exec(imgs[id]); if (m) { parts.push({ text: 'Picture ' + id + ':' }); parts.push({ inlineData: { mimeType: m[1], data: m[3] } }); } });
            return { kind: 'docx', imgs: imgs, parts: parts, note: 'The document text is below.' };
          });
      });
      return lib('xlsx', 'ol_xlsx.min.js', function () { return !!window.XLSX; }).then(function () {
        var wb = ext === 'csv' ? window.XLSX.read(new TextDecoder('utf-8').decode(buf).replace(/^\ufeff/, ''), { type: 'string' }) : window.XLSX.read(buf, { type: 'array' }), out = [];
        wb.SheetNames.forEach(function (n) { out.push('=== Sheet: ' + n + ' ===\n' + window.XLSX.utils.sheet_to_csv(wb.Sheets[n], { blankrows: false })); });
        return { kind: 'xlsx', parts: [{ text: 'DOCUMENT (spreadsheet exported as CSV, one row per line):\n' + out.join('\n\n').slice(0, 300000) }], note: 'The document is a spreadsheet; columns may hold question, options A-D, answer, explanation.' };
      });
    });
  }
  function htmlToText(h) {
    return String(h).replace(/<img[^>]*src="(IMG\d+)"[^>]*>/g, ' [[$1]] ').replace(/<\/(p|h\d|li|tr)>/g, '\n').replace(/<br\s*\/?>/g, '\n').replace(/<\/t[dh]>/g, ' | ')
      .replace(/<(?!\/?(u|b|strong|i|em)\b)[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').slice(0, 300000);
  }

  /* ---- Gemini (máy của cô gọi trực tiếp bằng khoá lấy từ máy chủ) ---- */
  var KFREE = false;
  function gemKey() {
    return fetch('api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'key', use: 'text', token: tok() }) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.key) throw new Error(r.status === 401 ? 'Phiên đăng nhập hết hạn, cô đăng nhập lại.' : r.status === 503 ? 'Chưa có khoá Gemini trên máy chủ.' : 'Không lấy được khoá Gemini (' + r.status + ')'); KFREE = !!j.free; return j.key; }); });
  }
  /* Mẫu AI: hỏi Google danh sách mẫu khoá này dùng được (mẫu cũ bị ngừng cho tài khoản mới), mẫu nào chạy được thì lần sau dùng trước */
  var KEY0 = null, MODELS = null, GOOD = null, FALLBACK = ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.1-pro-preview', 'gemini-2.5-pro'];
  function gemBase() { return LN._gemBase || 'https://generativelanguage.googleapis.com'; }
  function models() {
    if (MODELS) return Promise.resolve(MODELS);
    return fetch(gemBase() + '/v1beta/models?pageSize=1000', { headers: { 'x-goog-api-key': (JOB && JOB.key) || KEY0 } }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { var L = j && j.models && window.AIPROMPTS ? window.AIPROMPTS.rankModels(j.models) : []; MODELS = L.length ? L.slice(0, 6) : FALLBACK; return MODELS; }, function () { MODELS = FALLBACK; return MODELS; });
  }
  var NOTHINK = {};
  function gem(parts, opt) {
    return models().then(function (L0) {
      var L = GOOD ? [GOOD].concat(L0.filter(function (m) { return m !== GOOD; })) : L0.slice(), i = 0, last = null, tried = [];
      function next() {
        if (i >= L.length) return Promise.reject(last && last.hard ? last : new Error('Không mẫu AI nào trả lời được. ' + tried.join(' · ')));
        var model = L[i++], body = { contents: [{ role: 'user', parts: parts }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: opt.max || 32000 } };
        if (/2\.5/.test(model)) body.generationConfig.thinkingConfig = { thinkingBudget: opt.think == null ? 1024 : opt.think }; else if (!NOTHINK[model]) body.generationConfig.thinkingConfig = { thinkingLevel: 'low' };   // Gemini 3: giảm "suy nghĩ" (tính tiền theo chữ)
        return fetch(gemBase() + '/v1beta/models/' + model + ':generateContent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': opt.key || JOB.key }, body: JSON.stringify(body) })
          .then(function (r) { return r.text().then(function (tx) {
            if (!r.ok) {
              var msg = ''; try { msg = JSON.parse(tx).error.message; } catch (e) { msg = tx.slice(0, 120); }
              tried.push(model + ': lỗi ' + r.status + (msg ? ' (' + String(msg).slice(0, 90) + ')' : ''));
              if (r.status === 400 && body.generationConfig.thinkingConfig && !/2\.5/.test(model) && !NOTHINK[model]) { NOTHINK[model] = 1; i--; tried.pop(); return next(); }
              if (r.status === 402) { last = new Error('Tài khoản Gemini đã hết tiền nạp trước (lỗi 402). Cô nạp thêm trong AI Studio (mục Billing) rồi thử lại.'); last.hard = 1; throw last; }
              if (r.status === 429) { last = new Error('Gemini báo hết lượt (429) với mẫu ' + model + '. Khoá miễn phí giới hạn số lượt mỗi phút/ngày: cô thử lại sau ít phút; nếu vẫn báo thì lượt trong ngày đã hết, sau 14:00 (giờ VN) có lượt mới.'); return next(); }
              if (r.status === 401 || r.status === 403) { last = new Error('Khoá Gemini bị từ chối (' + r.status + '): ' + String(msg).slice(0, 150)); last.hard = 1; throw last; }
              return next();
            }
            var j = JSON.parse(tx), c = j.candidates && j.candidates[0], t = c && c.content && (c.content.parts || []).map(function (x) { return x.thought ? '' : x.text || ''; }).join('');
            var out = parseJ(t);
            if (!out) {
              if (c && c.finishReason === 'MAX_TOKENS') { last = new Error('Đề dài quá, AI không viết hết được. Cô chia file làm hai phần rồi tạo hai đề nhé.'); last.hard = 1; throw last; }
              tried.push(model + ': trả về dữ liệu hỏng' + (c && c.finishReason ? ' (' + c.finishReason + ')' : '')); return next();
            }
            GOOD = model; return out;
          }); }, function (e) { if (e && e.hard) throw e; tried.push(model + ': mạng lỗi'); return next(); });
      }
      return next();
    });
  }
  function parseJ(t) { t = String(t || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, ''); try { return JSON.parse(t); } catch (e) { var m = t.match(/\{[\s\S]*\}/); if (m) { try { return JSON.parse(m[0]); } catch (e2) {} } } return null; }

  var EXTRACT = 'OL_EXTRACT. You convert an English test document from a Vietnamese school (it may contain theory/summary pages, the test itself and an ANSWER KEY, often at the end) into JSON for an interactive practice website.\n' +
    'RULES\n' +
    '1. Use ONLY the questions in the document, in the original order. Do not skip, merge or invent questions. Answers ("ans" for multiple choice, "model" for writing) MUST come from the document\'s answer key. If the key has no answer for a question, solve it yourself and add "nokey": true to that item.\n' +
    '2. Number all gradable questions consecutively through the whole test starting at 1 (n: "1", "2", …), even if the document restarts numbering in each section. In passages, rewrite each blank as "<b>(N)</b> ______" using the new number of the question for that blank.\n' +
    '3. Each section of the test (I, II, III… or Exercise 1, 2…) becomes one part: {"ro": "Ex 1"…, "label": short English section name (e.g. "Pronunciation", "Stress", "Vocabulary", "Grammar", "Verb forms", "Communication", "Cloze test", "Reading", "Signs & notices", "Conjunctions", "Ordering", "Sentence insertion", "Rewriting", "Sentence building", "Paragraph writing"), "sub": short Vietnamese name (e.g. "Phát âm phần gạch chân"), "lead": the instruction rewritten in clear Vietnamese for students, "bank": words of a word box if the section has one, "items": [...]}. A sub-group inside a section (a., b., c.) may stay in the same part; put its instruction into the prompt of its questions.\n' +
    '4. ITEM TYPES\n' +
    ' - Multiple choice: {"t":"q","n":"…","stem":"question text or null","opts":["…","…"],"ans": 0-based index of the key}. Do not put the letters A. B. C. D. inside options.\n' +
    '   Pronunciation (underlined part): add "kind":"p" and write the underlined letters of EACH option inside square brackets, e.g. "y[ea]r", "cook[ed]", "v[i]tamin". Look carefully at the page image to find which letters are underlined. Never use square brackets anywhere else.\n' +
    '   Choosing a sentence/letter for numbered blanks of a passage → one "q" per blank with the full option sentences as opts. Ordering tasks → "q" with opts like "a – b – c".\n' +
    ' - Writing / typing answers (verb forms, fill a word from a box, complete or combine sentences, rewrite with a given word, negative and question forms…): {"t":"w","n":"…","prompt":"the task line exactly as the student sees it (keep the given cues, the word in brackets, the sentence beginning)","label": short Vietnamese input label (e.g. "Điền dạng đúng của động từ", "Viết cả câu", "Điền liên từ"),"model":"key answer","accept":[other fully correct answers]}.\n' +
    '   When the student fills only a blank (verb form, word from box), "model" is only the missing word(s) and "accept" may also contain the whole completed sentence. When the task asks for two answers (e.g. negative (–) AND question (?)), make TWO "w" items, adding "(–) Câu phủ định" / "(?) Câu hỏi" at the end of the prompt.\n' +
    ' - Free paragraph writing: {"t":"w","long":true,"min":<min words>,"max":<max words>,"prompt":"the task with all topics","label":"Viết đoạn văn","model":"a model paragraph YOU write for the first topic, at the students\' level, following the document\'s guidance","exp":"the document\'s guidance in Vietnamese"}.\n' +
    ' - Reading passage: {"t":"psg","title":"title or \'Đoạn văn · Câu x – y\'","paras":["paragraph 1","paragraph 2"]} placed right before its questions.\n' +
    ' - Notice / sign written in a box: {"t":"notice","title":"SWIMMING POOL","text":"No running. …"} placed right before its question.\n' +
    ' - A picture needed to answer a question: IMAGE_RULE\n' +
    '5. Allowed HTML inside strings: <b>, <i>, <u>, <br>. Write blanks as "______". Keep English text exactly (fix only obvious OCR errors).\n' +
    '6. Ignore student name/class lines, logos, headers, footers and page numbers.\n' +
    '7. "theory_notes": copy the document\'s theory / knowledge summary (vocabulary, grammar, pronunciation, communication…) as compact plain text, max 6000 characters ("" if none).\n' +
    'Return ONE JSON object: {"title": Vietnamese test title, "kicker": short line such as "Tiếng Anh 7 · Global Success · Giữa kì I", "desc": one Vietnamese sentence describing the scope (units, number of questions), "theory_notes": "…", "parts": [ … ]}';
  var IMG_PDF = '{"t":"img","page": <1-based page number>,"box":[ymin,xmin,ymax,xmax] (0-1000 normalized on that page),"cap":"short Vietnamese caption"} placed right before its question. Do NOT add images for logos or decorations.';
  var IMG_DOCX = 'pictures appear in the text as [[IMGn]] and are attached after the document; use {"t":"img","ref":"IMGn","cap":"short Vietnamese caption"} placed right before its question. Skip logos and decorations.';
  function extract(src) {
    var parts = [{ text: EXTRACT.replace('IMAGE_RULE', src.kind === 'pdf' ? IMG_PDF : src.kind === 'docx' ? IMG_DOCX : 'not applicable.') + '\n\n' + src.note }].concat(src.parts);
    return gem(parts, { max: 60000, think: 2048 }).then(function (j) {
      if (!j || !Array.isArray(j.parts) || !j.parts.length) throw new Error('AI không đọc ra được phần nào của đề.');
      return j;
    });
  }
  var EXPLAIN = 'OL_EXPLAIN. You are an experienced English teacher in Vietnam. Below is one part of a practice test (JSON, answers are FINAL — never change "ans" or "model") and the theory notes of the document.\n' +
    'For EVERY gradable item ("q" and "w") write, in Vietnamese suitable for lower-secondary students:\n' +
    ' - "exp": why the correct answer is right (1–3 short sentences: meaning, grammar rule, signal words, IPA for pronunciation, stress pattern…). You may use <b>, <i>, <u>.\n' +
    ' - "why" (only for "q"): an object mapping EVERY wrong option index (string "0","1",…) to ONE short Vietnamese sentence saying exactly why that option is wrong (wrong tense, wrong meaning, wrong collocation, different sound…).\n' +
    ' - "accept" (only for short "w"): up to 5 extra answers that are also fully correct (contractions, British/American spelling, alternative correct wording that still follows the task). [] if none.\n' +
    ' - "th": the key of the rule box below that best matches the item.\n' +
    'Also write 1–3 rule boxes for this part ("rules"): {"key": UPPERCASE_ID (A-Z, 0-9, _), "t": Vietnamese title, "f": [["label","formula or key examples"], ["label","…"]] (1–2 rows, short), "b": ["2–3 Vietnamese tips with English examples in <i>…</i>"]}. Base them on the theory notes and standard grammar. Prefer reusing these existing keys when they fit: EXISTING_KEYS.\n' +
    'Return ONE JSON object: {"rules":[…],"items":[{"n":"…","exp":"…","why":{"1":"…"},"accept":[…],"th":"KEY"}]}';
  function explainAll(raw, src) {
    var T = OL.normalize({ title: String(raw.title || 'Đề ôn luyện'), kicker: String(raw.kicker || ''), desc: String(raw.desc || ''), theory: {}, parts: raw.parts });
    var notes = String(raw.theory_notes || '').slice(0, 6000), done = 0, total = T.parts.length;
    function one(p) {
      var slim = { ro: p.ro, label: p.label, lead: p.lead, bank: p.bank, items: p.items.map(function (it) { var o = {}; ['t', 'n', 'stem', 'opts', 'ans', 'prompt', 'model', 'long', 'kind', 'title', 'paras', 'text'].forEach(function (k) { if (it[k] != null) o[k] = it[k]; }); return o; }) };
      if (!slim.items.some(function (it) { return it.t === 'q' || it.t === 'w'; })) { done++; return Promise.resolve(); }
      var prompt = EXPLAIN.replace('EXISTING_KEYS', Object.keys(T.theory).join(', ') || '(none yet)') + '\n\nTHEORY NOTES:\n' + (notes || '(none)') + '\n\nPART:\n' + JSON.stringify(slim);
      return gem([{ text: prompt }], { max: 24000, think: 512 }).then(function (j) { try {
        var map = {}; j = j && typeof j === 'object' ? j : {}; if (!Array.isArray(j.rules)) j.rules = []; if (!Array.isArray(j.items)) j.items = [];
        j.rules.forEach(function (r) { if (!r || typeof r !== 'object') return; var k = String(r.key || '').toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 30); if (!k || !r.t) return; if (!T.theory[k]) T.theory[k] = { t: String(r.t), f: (Array.isArray(r.f) ? r.f : []).filter(Array.isArray).slice(0, 2).map(function (x) { return [String(x[0] || ''), String(x[1] || '')]; }), b: (Array.isArray(r.b) ? r.b : r.b ? [r.b] : []).slice(0, 4).map(String) }; map[k] = 1; });
        p.th = Object.keys(map).slice(0, 1);
        var byN = {}; j.items.forEach(function (x) { if (x && typeof x === 'object') byN[String(x.n)] = x; });
        (p.items || []).forEach(function (it) {
          var x = byN[String(it.n)]; if (!x || (it.t !== 'q' && it.t !== 'w')) return;
          if (x.exp) it.exp = String(x.exp);
          if (it.t === 'q' && x.why && typeof x.why === 'object' && !Array.isArray(x.why)) { it.why = {}; Object.keys(x.why).forEach(function (i) { var ii = /^[A-H]$/i.test(i) ? LET.indexOf(i.toUpperCase()) : +i; if (ii >= 0 && ii < it.opts.length && ii !== it.ans && x.why[i]) it.why[ii] = String(x.why[i]); }); }
          if (it.t === 'w' && !it.long && Array.isArray(x.accept)) it.accept = (it.accept || []).concat(x.accept.map(String)).filter(function (v, i, a) { return v && a.indexOf(v) === i; }).slice(0, 10);
          var k = String(x.th || '').toUpperCase(); if (T.theory[k]) it.th = k; else if (p.th[0]) it.th = p.th[0];
        });
      } catch (e) { /* bỏ qua phần lỗi, giữ câu hỏi */ } }, function () { /* phần này không viết được lời giải: vẫn giữ câu hỏi, cô bổ sung sau */ }).then(function () { done++; JOB.sub = done + '/' + total + ' phần'; drawJob(); });
    }
    var q = T.parts.slice(), run = function () { var p = q.shift(); return p ? one(p).then(run) : Promise.resolve(); };
    return Promise.all([run(), run(), run()]).then(function () { return T; });
  }

  /* ---- hình: cắt từ trang PDF hoặc lấy từ file Word, nén JPEG ---- */
  function shrink(src, maxW) {
    return new Promise(function (ok) {
      var im = new Image(); im.onload = function () { var w = Math.min(maxW || 820, im.width), h = Math.round(im.height * w / im.width), c = document.createElement('canvas'); c.width = w; c.height = h; var g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.drawImage(im, 0, 0, w, h); ok(c.toDataURL('image/jpeg', 0.78)); };
      im.onerror = function () { ok(''); }; im.src = src;
    });
  }
  function images(T, src) {
    var jobs = [];
    T.parts.forEach(function (p) { (p.items || []).forEach(function (it) { if (it.t === 'img') jobs.push(it); else if (it.img && typeof it.img === 'object') { var o = { page: it.img.page, box: it.img.box, ref: it.img.ref, _q: it }; jobs.push(o); } }); });
    if (!jobs.length) return Promise.resolve();
    var fin = function () { jobs.forEach(function (o) { if (o._q) { o._q.img = o.src || ''; } }); };
    if (src.kind === 'docx') return Promise.all(jobs.map(function (it) { var d = src.imgs[it.ref]; if (!d) { it.src = ''; return null; } return shrink(d, 820).then(function (u) { it.src = u; delete it.ref; }); })).then(fin);
    if (src.kind !== 'pdf') { jobs.forEach(function (o) { o.src = ''; }); fin(); return Promise.resolve(); }
    return lib('pdf', 'ol_pdf.min.js', function () { return !!window.pdfjsLib; }).then(function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'js/ol_pdf.worker.min.js';
      return window.pdfjsLib.getDocument({ data: new Uint8Array(src.buf.slice(0)) }).promise;
    }).then(function (pdf) {
      var cache = {};
      function page(n) { return cache[n] || (cache[n] = pdf.getPage(n).then(function (pg) { var vp = pg.getViewport({ scale: 2 }), c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; return pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(function () { return c; }); })); }
      return jobs.reduce(function (pr, it) {
        return pr.then(function () {
          var n = +it.page, b = it.box; if (!n || !b || b.length !== 4 || n > pdf.numPages) { it.src = ''; return; }
          return page(n).then(function (c) {
            var y0 = Math.max(0, b[0] / 1000 * c.height - 6), x0 = Math.max(0, b[1] / 1000 * c.width - 6), y1 = Math.min(c.height, b[2] / 1000 * c.height + 6), x1 = Math.min(c.width, b[3] / 1000 * c.width + 6);
            if (x1 - x0 < 20 || y1 - y0 < 20) { it.src = ''; return; }
            var o = document.createElement('canvas'); o.width = Math.round(x1 - x0); o.height = Math.round(y1 - y0); o.getContext('2d').drawImage(c, x0, y0, x1 - x0, y1 - y0, 0, 0, o.width, o.height);
            return shrink(o.toDataURL('image/png'), 820).then(function (u) { it.src = u; delete it.page; delete it.box; });
          });
        });
      }, Promise.resolve());
    }).catch(function () { jobs.forEach(function (it) { if (!it.src) it.src = ''; }); }).then(fin);
  }

  /* ---- AI viết lí do sai còn thiếu (đề nạp sẵn / cô tự thêm câu) ---- */
  function missingWhy(T) { var n = 0; T.parts.forEach(function (p) { p.items.forEach(function (it) { if (it.t === 'q' && it.opts.some(function (o, i) { return i !== it.ans && !(it.why || {})[i]; })) n++; }); }); return n; }
  function fillWhy(id) {
    var T = ED.T, btn = document.querySelector('[data-ola=fillwhy]'), done = 0, parts = T.parts.filter(function (p) { return p.items.some(function (it) { return it.t === 'q' && it.opts.some(function (o, i) { return i !== it.ans && !(it.why || {})[i]; }); }); });
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="ol-spin"></span>AI đang viết… 0/' + parts.length + ' phần'; }
    return gemKey().then(function (key) {
      KEY0 = key;
      return parts.reduce(function (pr, p) { return pr.then(function () {
        var need = p.items.filter(function (it) { return it.t === 'q' && it.opts.some(function (o, i) { return i !== it.ans && !(it.why || {})[i]; }); });
        var slim = { ro: p.ro, label: p.label, lead: p.lead, items: need.map(function (it) { return { t: 'q', n: it.n, stem: it.stem, opts: it.opts, ans: it.ans, kind: it.kind }; }) };
        var prompt = EXPLAIN.replace('EXISTING_KEYS', Object.keys(T.theory).join(', ') || '(none yet)') + '\n\nTHEORY NOTES:\n(none)\n\nPART:\n' + JSON.stringify(slim);
        return gem([{ text: prompt }], { max: 16000, think: 512, key: key }).then(function (j) {
          var byN = {}; (j && Array.isArray(j.items) ? j.items : []).forEach(function (x) { if (x && typeof x === 'object') byN[String(x.n)] = x; });
          (j && Array.isArray(j.rules) ? j.rules : []).forEach(function (r0) { if (!r0 || !r0.t) return; var k = String(r0.key || '').toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 30); if (k && !T.theory[k]) T.theory[k] = { t: String(r0.t), f: (Array.isArray(r0.f) ? r0.f : []).filter(Array.isArray).slice(0, 2).map(function (x) { return [String(x[0] || ''), String(x[1] || '')]; }), b: (Array.isArray(r0.b) ? r0.b : []).slice(0, 4).map(String) }; if (k && !(p.th || []).length) p.th = [k]; });
          need.forEach(function (it) { var x = byN[String(it.n)]; if (!x) return; it.why = it.why || {};
            if (x.why && typeof x.why === 'object') Object.keys(x.why).forEach(function (i) { var ii = /^[A-H]$/i.test(i) ? LET.indexOf(i.toUpperCase()) : +i; if (ii >= 0 && ii < it.opts.length && ii !== it.ans && x.why[i] && !it.why[ii]) it.why[ii] = String(x.why[i]); });
            if (!it.exp && x.exp) it.exp = String(x.exp); var tk = String(x.th || '').toUpperCase(); if (!it.th && T.theory[tk]) it.th = tk; });
        }, function () {}).then(function () { done++; if (btn) btn.innerHTML = '<span class="ol-spin"></span>AI đang viết… ' + done + '/' + parts.length + ' phần'; });
      }); }, Promise.resolve());
    }).then(function () { return saveT(id, T); }).then(function () { toast('✅ AI đã viết lí do sai cho các câu còn thiếu – cô xem lại nhé'); viewEdit(id); }, function (e) { toast('Chưa viết được: ' + (e && e.message || e)); viewEdit(id); });
  }

  /* ================= Xem & sửa đề ================= */
  var ED = null;   // { id, T, mode }
  function viewEdit(id) {
    var T = getT(id), m = ix().tests[id];
    if (!T || !m) { shell('<p><a href="#/admin/onluyen">← Danh sách đề</a></p><div class="ol-empty">Không tìm thấy đề.</div>'); return; }
    if (!ED || ED.id !== id) ED = { id: id, mode: 'edit' };
    ED.T = T; tagIds(T);
    var st = { a: {} };
    shell('<p><a href="#/admin/onluyen">← Danh sách đề</a></p>' +
      '<div class="ol-info" style="margin:8px 0 14px"><div class="ol-toolbar"><b>' + (m.status === 'giao' ? '<span class="ol-pill ol-g">Đã giao</span>' : '<span class="ol-pill ol-y">Bản nháp</span>') + ' <span class="ol-pill">' + (gradeOf(m) ? 'Khối ' + gradeOf(m) : 'Chưa xếp khối') + '</span></b>' +
      '<button type="button" class="ol-btn ol-sm' + (ED.mode === 'edit' ? ' ol-solid' : '') + '" data-ola="mode" data-v="edit">✏️ Sửa đề (hiện đáp án)</button>' +
      '<button type="button" class="ol-btn ol-sm' + (ED.mode === 'preview' ? ' ol-solid' : '') + '" data-ola="mode" data-v="preview">👁 Làm thử (chấm & chữa từng câu)</button>' +
      '<button type="button" class="ol-btn ol-sm" data-ola="meta">Sửa tên đề & khối</button>' +
      (missingWhy(T) ? '<button type="button" class="ol-btn ol-sm" data-ola="fillwhy">🤖 AI viết lí do sai còn thiếu (' + missingWhy(T) + ' câu)</button>' : '') +
      '<button type="button" class="ol-btn ol-sm ' + (m.status === 'giao' ? '' : 'ol-solid') + '" data-ola="assign" data-id="' + id + '">' + (m.status === 'giao' ? 'Đổi lớp được giao' : '📤 Giao đề') + '</button>' +
      '<a class="ol-btn ol-sm" style="text-decoration:none" href="#/admin/onluyen/' + id + '/kq">📊 Kết quả</a></div>' +
      (m.nokey ? '<p class="ol-hint" style="color:var(--wait)">⚠ Có ' + m.nokey + ' câu file không có đáp án – AI tự giải, cô kiểm tra kỹ các câu này.</p>' : '') +
      (m.status === 'giao' ? '<p class="ol-hint">Đề đang giao: cô sửa xong, học sinh đang làm dở sẽ phải làm lại từ đầu.</p>' : '<p class="ol-hint">Bấm <b>✏️ Sửa</b> ở góc mỗi câu để sửa câu hỏi, đáp án, lời giải. Xem kỹ rồi bấm <b>Giao đề</b>.</p>') + '</div>' +
      '<div id="ol-root"></div>');
    OL.mount({ T: T, st: st, mode: ED.mode, perCheck: ED.mode === 'preview', root: document.getElementById('ol-root'), onReset: function () { viewEdit(id); }, onAction: edAction,
      bottomHTML: ED.mode === 'edit' ? '<div class="ol-act"><button type="button" class="ol-btn" data-ol="addpart">➕ Thêm phần mới</button></div>' : '' });
  }
  function tagIds(T) { T.parts.forEach(function (p, pi) { p.items.forEach(function (it, ii) { it._id = pi + '-' + ii; }); }); }
  function findIt(T, oid) { var a = String(oid).split('-'); return { pi: +a[0], ii: +a[1], p: T.parts[+a[0]], it: T.parts[+a[0]] && T.parts[+a[0]].items[+a[1]] }; }
  function edAction(a, t) {
    if (a === 'edit') itemForm(t.getAttribute('data-olid'));
    else if (a === 'editpart') partForm(+t.getAttribute('data-pi'));
    else if (a === 'addpart') { ED.T.parts.push({ ro: 'Ex ' + (ED.T.parts.length + 1), label: 'New part', sub: 'Phần mới', lead: '', items: [{ t: 'q', stem: 'Question ______.', opts: ['A', 'B', 'C', 'D'], ans: 0, exp: '' }] }); saveT(ED.id, ED.T).then(function () { viewEdit(ED.id); }, function () {}); }
  }
  function modal(title, html, onOk, extraBtns) {
    var box = document.createElement('div'); box.className = 'ol-modal olx'; box.style.background = 'rgba(40,10,25,.45)';
    box.innerHTML = '<div><h2 style="color:var(--brand)">' + title + '</h2><div class="ol-ed">' + html + '</div><div class="ol-act"><button type="button" class="ol-btn ol-solid" data-m="ok">Lưu</button><button type="button" class="ol-btn ol-ghost" data-m="x">Huỷ</button>' + (extraBtns || '') + '</div></div>';
    document.body.appendChild(box);
    box.addEventListener('click', function (ev) {
      var a = ev.target.getAttribute('data-m'); if (ev.target === box || a === 'x') { box.remove(); return; }
      if (!a) return;
      if (onOk(a, box) !== false) box.remove();
    });
    return box;
  }
  function v(box, n) { var e = box.querySelector('[name="' + n + '"]'); return e ? (e.type === 'checkbox' ? e.checked : e.value) : ''; }
  function thOpts(T, cur) { return '<option value="">(không)</option>' + Object.keys(T.theory).map(function (k) { return '<option value="' + esc(k) + '"' + (k === cur ? ' selected' : '') + '>' + esc(OL.plain(T.theory[k].t)) + '</option>'; }).join(''); }
  var ADD = '<select name="addt" style="width:auto"><option value="">➕ Thêm mục mới phía dưới…</option><option value="q">Câu trắc nghiệm</option><option value="w">Câu tự viết</option><option value="psg">Đoạn văn</option><option value="notice">Biển thông báo (chữ)</option><option value="img">Hình ảnh</option></select>';
  function itemForm(oid) {
    var T = ED.T, f = findIt(T, oid), it = f.it; if (!it) return;
    var h = '';
    if (it.t === 'q') {
      h = '<label>Câu hỏi (để trống nếu chỉ có phương án)</label><textarea name="stem">' + esc(it.stem || '') + '</textarea>' +
        '<label class="ol-ck"><input type="checkbox" name="kind"' + (it.kind === 'p' ? ' checked' : '') + '> Câu phát âm: chữ trong [ngoặc vuông] được gạch chân, ví dụ <i>y[ea]r</i></label>' +
        '<label>Các phương án – chọn đáp án đúng bằng nút tròn</label>' + it.opts.map(function (o, i) { return '<div class="ol-row"><input type="radio" name="ans" value="' + i + '"' + (i === it.ans ? ' checked' : '') + ' style="width:auto"><input name="o' + i + '" value="' + esc(o) + '"></div>'; }).join('') +
        '<div class="ol-row"><span></span><input name="o' + it.opts.length + '" placeholder="(thêm phương án)"></div>' +
        '<label>Vì sao đáp án đúng (lời giải)</label><textarea name="exp">' + esc(it.exp || '') + '</textarea>' +
        '<label>Vì sao từng phương án sai (giải thích lỗi sai cho học sinh)</label>' + it.opts.map(function (o, i) { return '<div class="ol-row"><b>' + LET[i] + '</b><input name="w' + i + '" value="' + esc((it.why || {})[i] || '') + '" placeholder="' + (i === it.ans ? '(đáp án đúng)' : '') + '"></div>'; }).join('');
    } else if (it.t === 'w') {
      h = '<label>Đề bài</label><textarea name="prompt">' + esc(it.prompt || '') + '</textarea><label>Nhãn ô trả lời</label><input name="label" value="' + esc(it.label || '') + '">' +
        '<label class="ol-ck"><input type="checkbox" name="long"' + (it.long ? ' checked' : '') + '> Viết đoạn văn (ô lớn, AI chấm theo nội dung)</label>' +
        '<label>' + (it.long ? 'Bài mẫu' : 'Đáp án') + '</label><textarea name="model">' + esc(it.model || '') + '</textarea>' +
        '<label>Các cách viết khác cũng đúng (mỗi dòng một cách)</label><textarea name="accept">' + esc((it.accept || []).filter(function (x) { return x !== it.model; }).join('\n')) + '</textarea>' +
        '<label>Lời giải / gợi ý</label><textarea name="exp">' + esc(it.exp || '') + '</textarea>';
    } else if (it.t === 'psg') h = '<label>Tiêu đề</label><input name="title" value="' + esc(it.title || '') + '"><label>Đoạn văn (cách nhau bằng một dòng trống). Chỗ trống viết ______</label><textarea name="paras" style="min-height:200px">' + esc((it.paras || []).join('\n\n')) + '</textarea>';
    else if (it.t === 'notice') h = '<label>Dòng tiêu đề</label><input name="title" value="' + esc(it.title || '') + '"><label>Nội dung</label><textarea name="text">' + esc(it.text || '') + '</textarea>';
    else if (it.t === 'img') h = (it.src ? '<img src="' + esc(it.src) + '" style="max-width:100%;max-height:200px">' : '') + '<label>Đổi hình (ảnh JPG/PNG)</label><input type="file" name="file" accept="image/*"><label>Chú thích</label><input name="cap" value="' + esc(it.cap || '') + '">';
    else if (it.t === 'sign') h = '<label>Chú thích</label><input name="cap" value="' + esc(it.cap || '') + '">';
    if (it.t === 'q' || it.t === 'w') h += '<label>Lí thuyết hiện kèm lời giải</label><select name="th">' + thOpts(T, it.th) + '</select>';
    h += ADD;
    modal('✏️ Sửa ' + (it.t === 'q' || it.t === 'w' ? 'câu ' + esc(it.n) : 'mục'), h, function (a, box) {
      if (a === 'del') { if (!confirm('Xoá mục này?')) return false; f.p.items.splice(f.ii, 1); saveT(ED.id, T).then(function () { viewEdit(ED.id); }, function () {}); return; }
      var pr = Promise.resolve();
      if (it.t === 'q') {
        it.stem = v(box, 'stem').trim() || null; it.kind = v(box, 'kind') ? 'p' : '';
        var opts = [], why = {}, ans = +((box.querySelector('input[name=ans]:checked') || {}).value || 0), map = {};
        for (var i = 0; i <= it.opts.length; i++) { var o = v(box, 'o' + i).trim(); if (o) { map[i] = opts.length; opts.push(o); var w = v(box, 'w' + i); if (w && w.trim()) why[opts.length - 1] = w.trim(); } }
        if (opts.length < 2) { toast('Cần ít nhất 2 phương án'); return false; }
        it.opts = opts; it.ans = map[ans] != null ? map[ans] : 0; delete why[it.ans]; it.why = why; it.exp = v(box, 'exp');
      } else if (it.t === 'w') {
        it.prompt = v(box, 'prompt'); it.label = v(box, 'label'); it.long = !!v(box, 'long'); it.model = v(box, 'model').trim(); it.exp = v(box, 'exp');
        it.accept = [it.model].concat(v(box, 'accept').split('\n').map(function (x) { return x.trim(); })).filter(function (x, i, a2) { return x && a2.indexOf(x) === i; });
      } else if (it.t === 'psg') { it.title = v(box, 'title'); it.paras = v(box, 'paras').split(/\n\s*\n/).map(function (x) { return x.trim().replace(/\n/g, '<br>'); }).filter(Boolean); }
      else if (it.t === 'notice') { it.title = v(box, 'title'); it.text = v(box, 'text'); }
      else if (it.t === 'img' || it.t === 'sign') {
        it.cap = v(box, 'cap'); var fi = box.querySelector('input[name=file]');
        if (fi && fi.files[0]) pr = new Promise(function (ok) { var fr = new FileReader(); fr.onload = function () { shrink(fr.result, 820).then(function (u) { if (u) it.src = u; ok(); }); }; fr.readAsDataURL(fi.files[0]); });
      }
      if (it.t === 'q' || it.t === 'w') it.th = v(box, 'th');
      var add = v(box, 'addt');
      if (add) f.p.items.splice(f.ii + 1, 0, add === 'q' ? { t: 'q', stem: 'Question ______.', opts: ['A', 'B', 'C', 'D'], ans: 0, exp: '' } : add === 'w' ? { t: 'w', prompt: 'Write …', label: 'Viết câu trả lời', model: '', accept: [], exp: '' } : add === 'psg' ? { t: 'psg', title: 'Đoạn văn', paras: ['…'] } : add === 'notice' ? { t: 'notice', title: 'NOTICE', text: '…' } : { t: 'img', src: '', cap: '' });
      pr.then(function () { return saveT(ED.id, T); }).then(function () { viewEdit(ED.id); }, function () { viewEdit(ED.id); });
    }, '<button type="button" class="ol-btn ol-ghost" data-m="del" style="margin-left:auto">🗑 Xoá mục</button>');
  }
  function partForm(pi) {
    var T = ED.T, p = T.parts[pi]; if (!p) return;
    var tk = (p.th || [])[0] || '', th = T.theory[tk] || { t: '', f: [], b: [] };
    var h = '<label>Ký hiệu (ví dụ Ex 3)</label><input name="ro" value="' + esc(p.ro || '') + '"><label>Tên phần (tiếng Anh)</label><input name="label" value="' + esc(p.label || '') + '"><label>Tên phần (tiếng Việt)</label><input name="sub" value="' + esc(p.sub || '') + '">' +
      '<label>Hướng dẫn làm bài</label><textarea name="lead">' + esc(p.lead || '') + '</textarea><label>Hộp từ cho sẵn (cách nhau bằng dấu phẩy, để trống nếu không có)</label><input name="bank" value="' + esc((p.bank || []).join(', ')) + '">' +
      '<label>Hộp «Quy tắc nhớ nhanh» đầu phần</label><select name="th">' + thOpts(T, tk) + '<option value="__new">➕ Tạo hộp lí thuyết mới</option></select>' +
      '<label>Tiêu đề lí thuyết</label><input name="tt" value="' + esc(th.t || '') + '"><label>Công thức (mỗi dòng: nhãn | nội dung)</label><textarea name="tf">' + esc((th.f || []).map(function (x) { return x[0] + ' | ' + x[1]; }).join('\n')) + '</textarea>' +
      '<label>Mẹo cần nhớ (mỗi dòng một ý)</label><textarea name="tb">' + esc((th.b || []).join('\n')) + '</textarea>';
    modal('✏️ Sửa phần ' + esc(p.ro), h, function (a, box) {
      if (a === 'del') { if (!confirm('Xoá cả phần này cùng mọi câu trong phần?')) return false; T.parts.splice(pi, 1); saveT(ED.id, T).then(function () { viewEdit(ED.id); }, function () {}); return; }
      if (a === 'up') { if (pi > 0) { T.parts.splice(pi - 1, 0, T.parts.splice(pi, 1)[0]); saveT(ED.id, T).then(function () { viewEdit(ED.id); }, function () {}); } return; }
      p.ro = v(box, 'ro'); p.label = v(box, 'label'); p.sub = v(box, 'sub'); p.lead = v(box, 'lead'); p.bank = v(box, 'bank').split(',').map(function (x) { return x.trim(); }).filter(Boolean);
      var k = v(box, 'th');
      if (k === '__new') { k = 'R' + Date.now().toString(36).toUpperCase(); T.theory[k] = { t: '', f: [], b: [] }; }
      if (k && T.theory[k]) {
        var tt = T.theory[k]; tt.t = v(box, 'tt') || tt.t; tt.f = v(box, 'tf').split('\n').map(function (l) { var i = l.indexOf('|'); return i < 0 ? null : [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }).filter(Boolean).slice(0, 2); tt.b = v(box, 'tb').split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
      }
      p.th = k ? [k] : [];
      saveT(ED.id, T).then(function () { viewEdit(ED.id); }, function () {});
    }, '<button type="button" class="ol-btn ol-ghost" data-m="up">↑ Đưa lên trên</button><button type="button" class="ol-btn ol-ghost" data-m="del" style="margin-left:auto">🗑 Xoá phần</button>');
    var sel = document.querySelector('.ol-modal select[name=th]');
    if (sel) sel.onchange = function () { var t2 = T.theory[sel.value] || { t: '', f: [], b: [] }, bx = sel.closest('.ol-ed'); bx.querySelector('[name=tt]').value = t2.t || ''; bx.querySelector('[name=tf]').value = (t2.f || []).map(function (x) { return x[0] + ' | ' + x[1]; }).join('\n'); bx.querySelector('[name=tb]').value = (t2.b || []).join('\n'); };
  }
  function metaForm() {
    var T = ED.T;
    var m0 = ix().tests[ED.id] || {}, g0 = gradeOf(m0), opts = '<option value="">(chưa xếp khối)</option>'; for (var g = 1; g <= 12; g++) opts += '<option value="' + g + '"' + (g === g0 ? ' selected' : '') + '>Khối ' + g + '</option>';
    modal('Sửa tên đề & khối', '<label>Khối</label><select name="grade">' + opts + '</select><label>Tên đề</label><input name="title" value="' + esc(T.title || '') + '"><label>Dòng nhỏ phía trên (ví dụ: Tiếng Anh 7 · Global Success · Giữa kì I)</label><input name="kicker" value="' + esc(T.kicker || '') + '"><label>Mô tả</label><textarea name="desc">' + esc(T.desc || '') + '</textarea>', function (a, box) {
      T.title = v(box, 'title'); T.kicker = v(box, 'kicker'); T.desc = v(box, 'desc'); var gsel = +v(box, 'grade') || 0;
      saveT(ED.id, T).then(function () { var x = ix(); if (x.tests[ED.id]) { x.tests[ED.id].grade = gsel || null; saveIx(x); } viewEdit(ED.id); }, function () {});
    });
  }

  /* ================= Kết quả ================= */
  function marks(id) { var m = store.get('ln_olm', null) || {}; return m[id] || {}; }
  function scoreOf(T, at, mk) { return OL.scoreWith(at, mk); }
  function viewResults(id) {
    var T = getT(id), m = ix().tests[id]; if (!T || !m) { shell('<div class="ol-empty">Không tìm thấy đề.</div>'); return; }
    var U = users(), rows = [], M = marks(id), seen = {};
    Object.keys(U).forEach(function (un) {
      var at = OL.attempts(un, id); var assigned = (m.uh || []).indexOf(uh(un)) >= 0 || (m.grades || []).indexOf(+U[un].grade) >= 0;
      if (!at.length && !(assigned && m.status === 'giao')) return; seen[un] = 1;
      var sc = at.map(function (x) { return Object.assign({}, x, { sc: scoreOf(T, x, (M[un] || {})[x.t]) }); });
      rows.push({ un: un, u: U[un], at: sc });
    });
    rows.sort(function (a, b) { return (b.at.length ? 1 : 0) - (a.at.length ? 1 : 0) || String(a.u.name).localeCompare(String(b.u.name)); });
    var doneN = rows.filter(function (r) { return r.at.length; }).length;
    shell('<p><a href="#/admin/onluyen">← Danh sách đề</a> · <a href="#/admin/onluyen/' + id + '">Xem đề</a></p><h1 style="margin:6px 0">📊 Kết quả: ' + esc(T.title) + '</h1>' +
      '<p class="muted" style="margin-bottom:12px">' + doneN + ' học sinh đã làm' + (m.status === 'giao' ? ' · ' + (rows.length - doneN) + ' học sinh được giao chưa làm' : '') + '. Bấm vào điểm để xem bài làm, sửa điểm câu viết.</p>' +
      (rows.length ? '<div style="overflow-x:auto"><table class="ol-tbl"><tr><th>Học sinh</th><th>Lớp</th><th>Số lần</th><th>Lần đầu</th><th>Cao nhất</th><th>Các lần làm (bấm để xem)</th></tr>' + rows.map(function (r) {
        var first = r.at[0], best = r.at.reduce(function (b, x) { return Math.max(b, x.sc.s); }, 0), pend = r.at.reduce(function (s, x) { return s + x.sc.pend; }, 0);
        return '<tr><td><b>' + esc(r.u.name || r.un) + '</b><div class="ol-hint">' + esc(r.un) + '</div></td><td>' + esc(clsOf(r.un) || gname(r.u.grade)) + '</td><td>' + r.at.length + '</td><td>' + (first ? '<b>' + OL.fmt(first.sc.s) + '</b>' : '<span class="ol-hint">chưa làm</span>') + '</td><td>' + (r.at.length ? OL.fmt(best) : '') + '</td>' +
          '<td><div class="ol-hist">' + r.at.map(function (x) { return '<a href="#/admin/onluyen/' + id + '/kq/' + encodeURIComponent(r.un) + '/' + x.t + '">' + OL.dateVN(x.t) + ': <b>' + OL.fmt(x.sc.s) + '</b>' + (x.sc.pend ? ' ⏳' : '') + '</a>'; }).join('') + '</div>' + (pend ? '<span class="ol-pill ol-y">' + pend + ' câu chờ cô chấm</span>' : '') + '</td></tr>';
      }).join('') + '</table></div>' : '<div class="ol-empty">Chưa có học sinh nào làm đề này.</div>'));
  }
  function viewAttempt(id, un, ts) {
    var T = getT(id), at = OL.attempts(un, id).filter(function (x) { return x.t === +ts; })[0], u = users()[un] || {};
    if (!T || !at) { shell('<p><a href="#/admin/onluyen/' + id + '/kq">← Kết quả</a></p><div class="ol-empty">Không tìm thấy bài làm.</div>'); return; }
    var all = store.get('ln_olm', null) || {}, mk = ((all[id] || {})[un] || {})[ts] || {}, sc = scoreOf(T, at, mk);
    var st = OL.stFromAttempt(T, at, mk);
    st.extra = function (it) {
      var cur = mk[it.k] != null ? +mk[it.k] : null;
      return '<div class="ol-act" style="font-size:13px"><span class="ol-hint">Cô chấm:</span>' + [0, 0.5, 1].map(function (pv) { return '<button type="button" class="ol-btn ol-sm' + (cur === pv ? ' ol-solid' : '') + '" data-ol="mark" data-k="' + it.k + '" data-v="' + pv + '">' + String(pv).replace('.', ',') + '</button>'; }).join('') + (cur != null ? '<button type="button" class="ol-btn ol-sm ol-ghost" data-ol="mark" data-k="' + it.k + '" data-v="">Bỏ, dùng điểm AI</button>' : '') + '</div>';
    };
    shell('<p><a href="#/admin/onluyen/' + id + '/kq">← Kết quả</a></p><div id="ol-root"></div>');
    OL.mount({ T: T, st: st, mode: 'review', root: document.getElementById('ol-root'),
      topHTML: '<div class="ol-info"><b>' + esc(u.name || un) + '</b> · nộp lúc ' + OL.dateVN(at.t) + ' · Điểm <b style="font-size:20px;color:var(--brand)">' + OL.fmt(sc.s) + '</b> (' + OL.fmt(sc.c).replace(',0', '') + '/' + (+at.n || T.total) + ' câu đúng)' + (sc.pend ? ' · <span class="ol-pill ol-y">' + sc.pend + ' câu chờ cô chấm</span>' : '') + (Object.keys(mk).length ? ' · <span class="ol-pill ol-g">Cô đã chấm lại ' + Object.keys(mk).length + ' câu</span>' : '') + '<p class="ol-hint" style="margin:6px 0 0">Mỗi câu có nút <b>Cô chấm</b> (0 / 0,5 / 1 điểm) để sửa điểm, nhất là các câu viết.</p></div>',
      onAction: function (a, t) {
        if (a !== 'mark') return;
        var k = t.getAttribute('data-k'), val = t.getAttribute('data-v'), M = store.get('ln_olm', null) || {};
        M[id] = M[id] || {}; M[id][un] = M[id][un] || {}; M[id][un][ts] = M[id][un][ts] || {};
        if (val === '') delete M[id][un][ts][k]; else M[id][un][ts][k] = +val;
        store.set('ln_olm', M); var y = window.scrollY; viewAttempt(id, un, ts); window.scrollTo(0, y);
      } });
  }

  /* ================= Điều hướng ================= */
  var curParts = [];
  function route(parts) {
    curParts = parts || [];
    var id = curParts[0];
    if (!id) viewList();
    else if (id === 'moi') viewNew();
    else if (curParts[1] === 'kq' && curParts[2]) viewAttempt(id, decodeURIComponent(curParts[2]), curParts[3]);
    else if (curParts[1] === 'kq') viewResults(id);
    else viewEdit(id);
  }
  LN.olAdmin = route;
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-ola]'); if (!t) return;
    var a = t.getAttribute('data-ola'), id = t.getAttribute('data-id');
    if (a === 'assign') assignModal(id);
    else if (a === 'unassign') { if (!confirm('Thu hồi đề? Học sinh sẽ không thấy đề nữa (kết quả đã làm vẫn giữ).')) return; var x = ix(); x.tests[id].status = 'nhap'; saveIx(x); route(curParts); }
    else if (a === 'del') { if (!confirm('Xoá đề này? Kết quả học sinh đã làm vẫn được giữ trong tiến độ.')) return; var x2 = ix(); x2.tests[id].del = 1; x2.tests[id].status = 'nhap'; saveIx(x2); store.set('ln_olt_' + id, null); route(curParts); }
    else if (a === 'sample') { if (!window.OL_SAMPLE_GS7) return; var T = JSON.parse(JSON.stringify(window.OL_SAMPLE_GS7)); saveT('gs7-mid1', T, true).then(function () { var x3 = ix(); x3.tests['gs7-mid1'].src = 'GS7 First Midterm.html'; saveIx(x3); toast('Đã nạp đề mẫu GS7 (bản nháp)'); LN.go('#/admin/onluyen/gs7-mid1'); }); }
    else if (a === 'mode' && ED) { ED.mode = t.getAttribute('data-v'); viewEdit(ED.id); }
    else if (a === 'meta' && ED) metaForm();
    else if (a === 'fillwhy' && ED) fillWhy(ED.id);
    else if (a === 'jumpg') { var el = document.getElementById('olg-' + t.getAttribute('data-g')); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
})();
;
(window.LN_V=window.LN_V||{})["onluyen_admin.js"]="f03525ea";
