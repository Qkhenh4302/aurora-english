/* Aurora English — Ôn luyện đề (giao diện & cách chấm theo mẫu "GS7 First Midterm").
   Dùng chung cho học sinh (#/ol) và cô giáo (xem trước / sửa / xem bài làm).
   Dữ liệu: ln_ol = danh mục đề (công khai), ln_olt_<id> = nội dung đề, ln_olm = điểm cô sửa (chỉ cô),
   kết quả học sinh: tiến độ ln_prog_<user>.ol[<id>][<thời điểm nộp>]. */
(function () {
  var LN = window.LN, store = LN.store, esc = LN.esc;
  var OL = LN.OL = {};
  var LET = 'ABCDEFGH';

  /* ---------- tiện ích ---------- */
  /* Lọc HTML bằng trình phân tích của trình duyệt: chỉ giữ vài thẻ định dạng, bỏ mọi thuộc tính; còn lại thành chữ thường */
  var OKTAG = { B: 'b', STRONG: 'b', I: 'i', EM: 'em', U: 'u', BR: 'br', DEL: 'del', S: 'del', SUP: 'sup', SUB: 'sub', SMALL: 'small', MARK: 'mark' }, SC = {}, SCN = 0;
  function escT(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function walk(n) {
    var out = '';
    for (var c = n.firstChild; c; c = c.nextSibling) {
      if (c.nodeType === 3) out += escT(c.nodeValue);
      else if (c.nodeType === 1) {
        var tg = OKTAG[c.nodeName.toUpperCase()];
        if (/^(SCRIPT|STYLE|TEMPLATE|IFRAME|OBJECT|EMBED|SVG|MATH|NOSCRIPT|TEXTAREA|TITLE)$/i.test(c.nodeName)) continue;
        if (tg === 'br') out += '<br>'; else if (tg) out += '<' + tg + '>' + walk(c) + '</' + tg + '>'; else out += walk(c);
      }
    }
    return out;
  }
  function san(h) {
    if (h == null || h === '') return '';
    h = String(h); if (SC[h] != null) return SC[h];
    var out;
    try { var d = new DOMParser().parseFromString('<!doctype html><body>' + h, 'text/html'); out = walk(d.body); }
    catch (e) { out = escT(h.replace(/<[^>]*>?/g, '')); }
    if (++SCN > 3000) { SC = {}; SCN = 0; }
    return (SC[h] = out);
  }
  OL.san = san;
  function U(s) { return String(s).replace(/\[([^\]]{1,30})\]/g, '<u>$1</u>'); }
  function plain(h) { return String(h == null ? '' : h).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/[\[\]]/g, ''); }
  OL.plain = plain;
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[‘’ʼ`´]/g, "'").replace(/[“”"]/g, '').replace(/[–—]/g, '-').replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  OL.norm = norm;
  function words(s) { return (String(s || '').trim().match(/[A-Za-zÀ-ỹ0-9'’-]+/g) || []).length; }
  function fmt(x) { return (Math.round(x * 10) / 10).toFixed(1).replace('.', ','); }
  OL.fmt = fmt;
  function svgSafe(s) { s = String(s || ''); if (!/^\s*<svg[\s>]/i.test(s)) return ''; if (!/xmlns=/.test(s)) s = s.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"'); return '<img alt="" style="flex:none;max-width:120px" src="data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s) + '">'; }
  function imgSafe(src) { src = String(src || ''); return /^(data:image\/(png|jpe?g|gif|webp);base64,[A-Za-z0-9+\/=]+$|api\/data\?olimg=[a-f0-9]{16,64}$)/i.test(src) ? src : ''; }
  function dateVN(t) { var d = new Date(t); return d.getDate() + '/' + (d.getMonth() + 1) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  OL.dateVN = dateVN;

  /* ---------- chuẩn hoá đề: gán mã câu, số câu, khoảng câu từng phần ---------- */
  OL.normalize = function (T) {
    T = T && typeof T === 'object' ? T : {};
    if (!T.theory || typeof T.theory !== 'object' || Array.isArray(T.theory)) T.theory = {};
    Object.keys(T.theory).forEach(function (k) { var t = T.theory[k]; if (!t || typeof t !== 'object') { delete T.theory[k]; return; } t.t = String(t.t || ''); t.f = Array.isArray(t.f) ? t.f.filter(Array.isArray).slice(0, 2).map(function (x) { return [String(x[0] || ''), String(x[1] || '')]; }) : []; t.b = Array.isArray(t.b) ? t.b.map(String).slice(0, 5) : (t.b ? [String(t.b)] : []); });
    T.parts = (Array.isArray(T.parts) ? T.parts : []).filter(function (p) { return p && typeof p === 'object'; });
    var k = 0, seen = {}, ids = {}, nokey = 0;
    T.parts.forEach(function (p) { p.items = (Array.isArray(p.items) ? p.items : []); p.items.forEach(function (it) { if (it && it.id) ids[it.id] = (ids[it.id] || 0) + 1; }); });
    var used = {};
    T.parts.forEach(function (p, pi) {
      p.items = p.items.filter(function (it) {
        if (!it || typeof it !== 'object') return false;
        if (it.t === 'q') {
          it.opts = (Array.isArray(it.opts) ? it.opts : []).map(function (o) { return String(o == null ? '' : o).replace(/^\s*[A-H]\s*[.)]\s+/, ''); }).filter(function (o) { return o !== ''; });
          if (typeof it.ans === 'string') {   // đáp án dạng chữ: "B", "2", "B. go" hoặc nguyên văn phương án
            var a0 = it.ans.trim(), L = a0.toUpperCase(), m = /^([A-H])(\s*[.)].*)?$/.exec(L);
            if (m) it.ans = LET.indexOf(m[1]);
            else if (/^\d+$/.test(a0)) it.ans = +a0;
            else { var hit = -1; it.opts.forEach(function (o, oi) { if (hit < 0 && norm(plain(o)) === norm(plain(a0))) hit = oi; }); if (hit >= 0) it.ans = hit; else { it.ans = 0; it.nokey = true; } }
          }
          if (typeof it.ans !== 'number' || isNaN(it.ans) || it.ans < 0 || it.ans >= it.opts.length) { it.ans = 0; it.nokey = true; }
          if (it.opts.length < 2) { if (it.model || it.prompt || it.stem) { it.t = 'w'; it.prompt = it.prompt || it.stem; it.model = it.model || ''; } else return false; }
        }
        if (it.t === 'w') { it.prompt = String(it.prompt || it.stem || ''); it.model = it.model == null ? '' : String(it.model); it.accept = Array.isArray(it.accept) ? it.accept.map(String) : []; }
        if (it.t === 'psg') it.paras = Array.isArray(it.paras) ? it.paras.map(String) : it.paras ? [String(it.paras)] : [];
        if (it.why && typeof it.why !== 'object') it.why = {};
        return /^(q|w|psg|notice|sign|img)$/.test(it.t);
      });
      p.th = (Array.isArray(p.th) ? p.th : []).filter(function (x) { return T.theory[x]; });
      if (Array.isArray(p.bank)) p.bank = p.bank.map(String); else p.bank = [];
      if (!p.ro) p.ro = 'Ex ' + (pi + 1);
      var nums = [];
      p.items.forEach(function (it) {
        it._p = pi;
        if (it.t === 'q' || it.t === 'w') {
          k++;
          // mã câu cố định (không đổi khi cô thêm / bớt câu) để bài làm cũ vẫn khớp đúng câu
          if (!it.id || used[it.id]) { var c = 'k' + k; if (ids[c] || used[c]) c = 'x' + Math.random().toString(36).slice(2, 9); it.id = c; }
          used[it.id] = 1; it.k = it.id;
          if (it.n == null || it.n === '' || seen[it.n]) it.n = String(k);
          it.n = String(it.n); seen[it.n] = 1; nums.push(it.n);
          if (it.t === 'q') { it.opts = it.opts.slice(0, 8); it.ans = Math.max(0, Math.min(it.opts.length - 1, +it.ans || 0)); it.why = it.why || {}; delete it.why[it.ans]; delete it.why[String(it.ans)]; }
          if (it.t === 'w') { it.accept = it.accept.filter(Boolean); if (it.model && it.accept.indexOf(it.model) < 0) it.accept.unshift(it.model); it.label = it.label || (it.long ? 'Viết đoạn văn' : 'Viết câu trả lời'); }
          if (it.th && !T.theory[it.th]) it.th = '';
          if (it.nokey) nokey++;
        }
      });
      p.range = nums.length ? 'Câu ' + nums[0] + (nums.length > 1 ? ' – ' + nums[nums.length - 1] : '') : '';
    });
    T.total = k; T.nokey = nokey;
    return T;
  };
  function graded(T) { var out = []; T.parts.forEach(function (p, pi) { p.items.forEach(function (it) { if (it.t === 'q' || it.t === 'w') { it._p = pi; out.push(it); } }); }); return out; }
  OL.graded = graded;

  /* ---------- giao diện ---------- */
  var fontsOn = false;
  OL.fonts = function () {
    if (fontsOn) return; fontsOn = true;
    try { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;1,400&display=swap'; document.head.appendChild(l); } catch (e) {}
  };
  function formsHTML(f) { f = f || []; return f.length ? '<div class="ol-forms' + (f.length > 1 ? ' ol-pair' : '') + '">' + f.map(function (x, i) { return '<div class="ol-form ' + (i ? 'ol-b' : 'ol-a') + '"><i class="ol-fl">' + san(x[0]) + '</i>' + san(x[1]) + '</div>'; }).join('') + '</div>' : ''; }
  function ruleHTML(t, cls, head) { if (!t) return ''; return '<div class="' + cls + '"><' + (cls === 'ol-rule' ? 'h3' : 'h4') + '>' + head + san(t.t) + '</' + (cls === 'ol-rule' ? 'h3' : 'h4') + '>' + formsHTML(t.f) + '<ul>' + (t.b || []).map(function (b) { return '<li>' + san(b) + '</li>'; }).join('') + '</ul></div>'; }
  function cols(it) { var len = Math.max.apply(null, it.opts.map(function (o) { return plain(o).length; }).concat([1])); return len <= 16 ? 'ol-four' : len <= 46 ? 'ol-two' : ''; }

  /* st = { a: { k: {pick, a, checked, pts, fix, why, pend, busy} }, done: thời điểm nộp } */
  function S(st, k) { return st.a[k] || (st.a[k] = { pick: null, a: '', checked: false, pts: 0 }); }
  function ready(it, s) { return it.t === 'q' ? s.pick != null : !!norm(s.a); }
  OL.ready = ready;

  function itemHTML(T, it, st, mode0) {
    var mode = mode0 === 'edit' ? 'key' : mode0;
    if (it.t === 'psg') return '<div class="ol-psg"' + edAttr(it, mode0) + '>' + (it.title ? '<h3>' + san(it.title) + '</h3>' : '') + (it.paras || []).map(function (x) { return '<p>' + san(x) + '</p>'; }).join('') + pen(it, mode0) + '</div>';
    if (it.t === 'notice') return '<div class="ol-notice"' + edAttr(it, mode0) + '>' + (it.title ? '<b>' + san(it.title) + '</b>' : '') + '<span>' + san(it.text) + '</span>' + pen(it, mode0) + '</div>';
    if (it.t === 'sign') return '<div class="ol-sign"' + edAttr(it, mode0) + '>' + svgSafe(it.svg) + '<span><b>Biển báo</b>' + san(it.cap) + '</span>' + pen(it, mode0) + '</div>';
    if (it.t === 'img') return '<figure class="ol-img"' + edAttr(it, mode0) + '>' + (imgSafe(it.src) ? '<img alt="" src="' + esc(imgSafe(it.src)) + '">' : '<div class="ol-hint">(chưa có hình)</div>') + (it.cap ? '<figcaption>' + san(it.cap) + '</figcaption>' : '') + pen(it, mode0) + '</figure>';
    var s = S(st, it.k), inner = '', lock = s.checked || s.busy || mode === 'review' || mode === 'key';
    if (it.img && imgSafe(it.img)) inner += '<div class="ol-img"><img alt="" src="' + esc(imgSafe(it.img)) + '"></div>';
    if (it.t === 'q') {
      inner += (it.stem ? '<div class="ol-stem">' + san(it.stem) + '</div>' : '') +
        '<div class="ol-opts ' + cols(it) + '">' + it.opts.map(function (o, i) {
          var c = 'ol-opt'; if (mode === 'key') { if (i === it.ans) c += ' ol-right'; } else if (!lock) { if (s.pick === i) c += ' ol-pick'; } else if (i === it.ans) c += ' ol-right'; else if (i === s.pick) c += ' ol-wrong';
          return '<button type="button" class="' + c + '" data-ol="pick" data-k="' + it.k + '" data-i="' + i + '"' + (lock ? ' disabled' : '') + '><kbd>' + LET[i] + '</kbd><span>' + (it.kind === 'p' ? U(san(o)) : san(o)) + '</span></button>';
        }).join('') + '</div>';
    } else {
      var val = mode === 'key' ? (it.model || '') : (s.a || '');
      inner += '<div class="ol-stem">' + san(it.prompt) + '</div><div class="ol-field"><label for="i' + it.k + '">' + san(it.label) + (it.long ? ' <b>(' + (it.min || 60) + '–' + (it.max || 80) + ' từ)</b>' : '') + '</label>' +
        (it.long ? '<textarea id="i' + it.k + '" data-ol="in" data-k="' + it.k + '" spellcheck="false" placeholder="Viết đoạn văn của em"' + (lock ? ' disabled' : '') + '>' + esc(val) + '</textarea><span class="ol-wc" id="wc' + it.k + '">' + words(val) + ' từ</span>'
          : '<input id="i' + it.k + '" data-ol="in" data-k="' + it.k + '" type="text" autocomplete="off" spellcheck="false" placeholder="Gõ câu trả lời của em" value="' + esc(val) + '"' + (lock ? ' disabled' : '') + '>') + '</div>';
    }
    var cls = 'ol-q' + (s.checked ? (s.pend ? ' ol-wait' : s.pts >= 0.999 ? ' ol-ok' : ' ol-no') : '');
    var act = (mode === 'do' || mode === 'preview') && st.perCheck && !s.checked ? '<div class="ol-act"><button type="button" class="ol-btn ol-chk" data-ol="chk" data-k="' + it.k + '"' + (s.busy || !ready(it, s) ? ' disabled' : '') + '>' + (s.busy ? '<span class="ol-spin"></span>Đang chấm…' : '✔ Kiểm tra câu này') + '</button><span class="ol-hint">Cô xem ngay đáp án, lí do sai và lí thuyết của câu này</span></div>' : mode === 'do' || mode === 'preview' ? (s.busy ? '<div class="ol-act"><span class="ol-tag"><span class="ol-spin"></span>Đang chấm…</span></div>' : s.checked ? '<div class="ol-act">' + tagHTML(s) + '</div>' : '') : (mode === 'review' ? '<div class="ol-act">' + tagHTML(s) + (st.mark && st.mark[it.k] != null ? ' <span class="ol-pill">Cô chấm lại: ' + fmt(st.mark[it.k]) + ' điểm</span>' : '') + '</div>' : '');
    return '<div class="' + cls + '" id="q' + it.k + '"' + edAttr(it, mode0) + '><div class="ol-qn">' + esc(it.n) + '</div><div class="ol-qb">' + inner + act +
      '<div class="ol-fb" id="fb' + it.k + '"' + (s.checked || mode === 'key' ? '' : ' hidden') + '>' + (s.checked || mode === 'key' ? fbHTML(T, it, s, mode) : '') + '</div>' + (st.extra ? st.extra(it, s) : '') + '</div>' + pen(it, mode0) + '</div>';
  }
  function edAttr(it, mode0) { return mode0 === 'edit' ? ' data-olid="' + esc(it._id || '') + '"' : ''; }
  function pen(it, mode0) { return mode0 === 'edit' ? '<button type="button" class="ol-epen" data-ol="edit" data-olid="' + esc(it._id || '') + '">✏️ Sửa</button>' : ''; }
  function tagHTML(s) {
    if (!s.checked) return '<span class="ol-tag"></span>';
    if (s.pend) return '<span class="ol-tag ol-wait">⏳ Chờ cô chấm</span>';
    if (s.pts >= 0.999) return '<span class="ol-tag ol-ok">✓ Đúng</span>';
    if (s.pts > 0) return '<span class="ol-tag ol-wait">◐ Đúng một phần (' + fmt(s.pts) + '/1)</span>';
    return '<span class="ol-tag ol-no">✗ Chưa đúng</span>';
  }
  function fbHTML(T, it, s, mode) {
    var pth = T.parts[it._p] && T.parts[it._p].th && T.parts[it._p].th[0], th = (it.th && T.theory[it.th]) || (pth && T.theory[pth]), out = '';
    var theory = th ? ruleHTML(th, 'ol-th', 'Lí thuyết cần nhớ — ') : '';
    if (it.t === 'q') {
      out += '<span class="ol-k">Đáp án đúng</span><span class="ol-model"><b>' + LET[it.ans] + '. ' + esc(plain(it.opts[it.ans])) + '</b></span>';
      if (mode !== 'key' && s.pick != null && s.pick !== it.ans) {
        var wy = it.why && (it.why[s.pick] || it.why[String(s.pick)]);
        out += '<div class="ol-err"><b>Em chọn ' + LET[s.pick] + '. ' + esc(plain(it.opts[s.pick])) + ' — sai vì:</b> ' + (wy ? san(wy) : 'phương án này không hợp với câu hỏi; xem lời giải bên dưới.') + '</div>';
      } else if (mode !== 'key' && s.pick == null && s.checked) out += '<div class="ol-err"><b>Em chưa chọn đáp án.</b> Đáp án đúng là ' + LET[it.ans] + ' – xem lời giải bên dưới.</div>';
      if (mode === 'key' && it.why) { var ws = Object.keys(it.why).filter(function (i) { return +i !== it.ans && it.why[i]; }); if (ws.length) out += '<div class="ol-why">' + ws.map(function (i) { return '<div><b>' + LET[+i] + ' sai:</b> ' + san(it.why[i]) + '</div>'; }).join('') + '</div>'; }
    } else {
      if (mode !== 'key') out += '<div class="ol-mine"><span class="ol-k">Em viết</span>' + (norm(s.a) ? esc(s.a) : '<i>(để trống)</i>') + '</div>';
      out += '<span class="ol-k">' + (it.long ? 'Bài mẫu' : 'Đáp án') + '</span><span class="ol-model"><b>' + esc(it.model || '') + '</b></span>';
      if (mode === 'key' && it.accept && it.accept.length > 1) out += '<div class="ol-hint">Cũng chấm đúng: ' + it.accept.filter(function (x) { return x !== it.model; }).map(esc).join(' · ') + '</div>';
      if (mode !== 'key' && s.why && s.pts < 0.999) out += '<div class="ol-err"><b>Lỗi sai của em:</b> ' + san(s.why) + (s.fix ? '<div class="ol-fix"><b>Sửa lại:</b> ' + esc(s.fix) + '</div>' : '') + '</div>';
      else if (mode !== 'key' && s.why) out += '<div class="ol-why">' + san(s.why) + '</div>';
      if (mode !== 'key' && s.pend) out += '<div class="ol-hint">AI chưa chấm được câu này, cô sẽ xem lại và chấm.</div>';
    }
    if (it.exp) out += '<div class="ol-why"><b>Vì sao:</b> ' + san(it.exp) + '</div>';
    return out + theory;
  }
  OL.partHTML = function (T, p, pi, st, mode) {
    return '<section class="ol-part" id="olp' + pi + '"' + (mode === 'edit' ? ' data-olpart="' + pi + '"' : '') + '><div class="ol-part-h"><div class="ol-badge">' + esc(p.ro) + '</div><div style="flex:1"><h2>' + san(p.label) + '</h2><span>' + san(p.sub || '') + (p.range ? ' · ' + p.range : '') + '</span></div>' +
      (mode === 'edit' ? '<button type="button" class="ol-btn ol-sm" data-ol="editpart" data-pi="' + pi + '">✏️ Sửa phần</button>' : '') + '</div>' +
      (p.lead ? '<p class="ol-lead">' + san(p.lead) + '</p>' : '') + (p.th && p.th[0] ? ruleHTML(T.theory[p.th[0]], 'ol-rule', 'Quy tắc nhớ nhanh · ') : '') +
      (p.bank && p.bank.length ? '<div class="ol-bank">' + p.bank.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('') + '</div>' : '') +
      '<div class="ol-qs">' + p.items.map(function (it) { return itemHTML(T, it, st, mode); }).join('') + '</div></section>';
  };
  OL.heroHTML = function (T, extra) {
    return '<header class="ol-hero"><span class="ol-blob ol-b1"></span><span class="ol-blob ol-b2"></span><div class="ol-eyebrow">' + esc(T.kicker || 'Ôn luyện') + '</div><h1>' + esc(T.title || 'Đề ôn luyện') + '</h1>' +
      '<p>' + esc(T.desc || '') + (T.desc ? ' ' : '') + 'Em làm hết bài rồi bấm <b>Nộp bài</b>. Nộp xong mới hiện <b>điểm, đáp án, lời giải</b>, lí do sai và <b>lí thuyết cần nhớ</b> của từng câu.</p>' +
      '<div class="ol-hero-chips">' + T.parts.map(function (p, pi) { return pi < 8 ? '<button type="button" class="ol-hchip" data-ol="jump" data-pi="' + pi + '">' + esc(plain(p.label)) + '</button>' : ''; }).join('') + '</div>' + (extra || '') + '</header>';
  };
  OL.navHTML = function (T, st) {
    return '<nav class="ol-nav"><div class="ol-nav-in">' + T.parts.map(function (p, pi) { return '<button type="button" class="ol-nchip" data-ol="jump" data-pi="' + pi + '">' + esc(p.ro + '. ' + plain(p.label)) + '</button>'; }).join('') + '<span class="ol-tally" id="ol-tally">' + tallyHTML(T, st) + '</span></div></nav>';
  };
  function tally(T, st) {
    var done = 0, right = 0, filled = 0, pend = 0;
    graded(T).forEach(function (it) { var s = st.a[it.k]; if (!s) return; if (ready(it, s)) filled++; if (s.checked) { done++; right += s.pts || 0; if (s.pend) pend++; } });
    return { done: done, right: right, filled: filled, pend: pend, total: T.total, pts: T.total ? right / T.total * 10 : 0 };
  }
  OL.tally = tally;
  function tallyHTML(T, st) { var r = tally(T, st); if (!st.done && st.mode !== 'review') return 'Đã làm <b>' + r.filled + '</b>/' + r.total + ' câu'; return 'Đã chấm <b>' + r.done + '</b>/' + r.total + '<span class="ol-sc">Điểm <b>' + fmt(r.pts) + '</b></span>'; }

  /* ---------- chấm câu viết: khớp đáp án trước, không khớp thì hỏi AI (máy chủ /api/ai) ---------- */
  OL.gradeW = function (it, ans) {
    if (!norm(ans)) return Promise.resolve({ pts: 0, why: 'Em chưa viết câu trả lời.' });
    if (!it.long && (it.accept || []).some(function (x) { return norm(x) === norm(ans); })) return Promise.resolve({ pts: 1 });
    var body = { task: 'olgrade', prompt: plain(it.prompt), model: it.model || '', accept: (it.accept || []).slice(0, 8), answer: String(ans).slice(0, 1500), long: !!it.long, exp: plain(it.exp || '').slice(0, 400), min: it.min || 60, max: it.max || 80 };
    return fetch('api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.error || r.status); return j; }); })
      .then(function (j) {
        var sc = Math.max(0, Math.min(1, +j.score)); if (isNaN(sc)) sc = j.ok ? 1 : 0;
        if (!it.long) sc = sc >= 0.75 || j.ok === true ? (j.ok === false ? 0 : 1) : sc >= 0.4 ? 0.5 : 0;
        return { pts: Math.round(sc * 100) / 100, fix: j.fix ? String(j.fix).slice(0, 1500) : '', why: j.why_vi ? String(j.why_vi).slice(0, 1500) : '' };
      }, function () { return { pts: 0, pend: true }; });
  };

  /* ---------- trang làm đề (học sinh, hoặc cô xem trước) ---------- */
  /* opt: { T, st, mode: 'do'|'preview'|'review'|'key', root: element, onSave(st), onSubmit(st, result), topHTML, extra } */
  OL.mount = function (opt) {
    OL.fonts();
    var T = opt.T, st = opt.st, root = opt.root, mode = opt.mode, PR = {}, SUBM = false;
    if (opt.perCheck) st.perCheck = true;
    Object.keys(st.a || {}).forEach(function (k) { var x = st.a[k]; if (!x) return; x.busy = false; if (!st.done && !st.perCheck && (mode === 'do' || mode === 'preview')) { x.checked = false; x.pts = 0; x.fix = ''; x.why = ''; x.pend = false; } });
    st.mode = mode;
    function full() {
      root.innerHTML = '<div class="olx' + (mode === 'edit' ? ' ol-edit-on' : '') + '"><div class="ol-shell">' + OL.heroHTML(T) + (opt.topHTML || '') + OL.navHTML(T, st) +
        T.parts.map(function (p, pi) { return OL.partHTML(T, p, pi, st, mode); }).join('') + (mode === 'do' || mode === 'preview' ? submitHTML() : '') + (opt.bottomHTML || '') + '</div></div>';
      var tb = document.querySelector('.topbar'), nv = root.querySelector('.ol-nav'); if (nv) nv.style.setProperty('--oltop', (tb && getComputedStyle(tb).position === 'sticky' ? tb.offsetHeight : 0) + 'px');
      if (st.done) summary();
    }
    function submitHTML() {
      return '<section class="ol-submit" id="ol-submit"><h2>Kết quả bài làm</h2><div class="ol-big"><b id="ol-score">' + (st.done ? fmt(tally(T, st).pts) : '?') + '</b><span id="ol-sub"></span></div><div class="ol-bd" id="ol-bd"></div><div class="ol-miss" id="ol-miss"></div>' +
        '<div class="ol-act"><button type="button" class="ol-btn ol-solid" data-ol="submit"' + (st.done ? ' disabled' : '') + '>' + (st.done ? 'Đã nộp bài' : 'Nộp bài') + '</button>' + (opt.afterBtns || '') + '<button type="button" class="ol-btn ol-ghost" data-ol="reset">Làm lại từ đầu</button>' +
        '<button type="button" class="ol-btn ol-ghost" data-ol="sound">' + (sound ? '🔊 Âm thanh' : '🔇 Đã tắt tiếng') + '</button></div><p class="ol-hint" id="ol-note">' + (st.done ? '' : 'Làm hết ' + T.total + ' câu rồi bấm <b>Nộp bài</b>. Nộp xong mới hiện điểm, đáp án, lời giải và lí thuyết của từng câu.') + '</p></section>';
    }
    function refreshTop() {
      var r = tally(T, st), t = root.querySelector('#ol-tally'); if (t) t.innerHTML = tallyHTML(T, st);
      var sc = root.querySelector('#ol-score'), sb = root.querySelector('#ol-sub');
      if (sc) sc.textContent = st.done ? fmt(r.pts) : '?';
      if (sb) sb.textContent = st.done ? 'điểm · ' + fmt(r.right).replace(',0', '') + '/' + r.total + ' câu đúng' + (r.pend ? ' · ' + r.pend + ' câu chờ cô chấm' : '') : 'Đã làm ' + r.filled + '/' + r.total + ' câu – nộp bài xong mới hiện điểm';
    }
    function repaint(it) {
      var el = root.querySelector('#q' + it.k); if (!el) return;
      var tmp = document.createElement('div'); tmp.innerHTML = itemHTML(T, it, st, mode); el.parentNode.replaceChild(tmp.firstChild, el); refreshTop();
    }
    function byK(k) { var r = null; graded(T).some(function (it) { if (it.k === k) { r = it; return true; } return false; }); return r; }
    function check(it) {
      var s = S(st, it.k); if (s.checked || s.busy || !ready(it, s)) return Promise.resolve();
      if (it.t === 'q') { s.checked = true; s.pts = s.pick === it.ans ? 1 : 0; if (!SUBM) (s.pts ? ding : buzz)(); save(); repaint(it); return Promise.resolve(); }
      s.busy = true; repaint(it);
      var ans = s.a;
      return (PR[it.k] = OL.gradeW(it, ans).then(function (g) { delete PR[it.k]; s.a = ans; s.busy = false; s.checked = true; s.pts = g.pts; s.fix = g.fix || ''; s.why = g.why || ''; s.pend = !!g.pend; if (!g.pend && !SUBM) (s.pts >= 0.999 ? ding : buzz)(); save(); repaint(it); }));
    }
    function save() { if (!opt.onSave) return; var c = JSON.parse(JSON.stringify(st, function (k, v) { return k === 'extra' || k === 'mark' ? undefined : v; })); Object.keys(c.a || {}).forEach(function (k) { if (c.a[k]) c.a[k].busy = false; }); opt.onSave(c); }
    function summary() {
      refreshTop();
      var bd = root.querySelector('#ol-bd'), miss = [], rows = '';
      T.parts.forEach(function (p) {
        var tot = 0, ok = 0;
        p.items.forEach(function (it) { if (it.t !== 'q' && it.t !== 'w') return; tot++; var s = st.a[it.k]; if (s && s.checked) { ok += s.pts || 0; if ((s.pts || 0) < 0.999 && !s.pend) miss.push(it); } });
        if (tot) rows += '<div class="ol-bd-r"><span>' + esc(p.ro + '. ' + plain(p.label)) + '</span><b>' + fmt(ok).replace(',0', '') + '/' + tot + '</b><span class="ol-meter"><i style="width:' + (ok / tot * 100) + '%"></i></span></div>';
      });
      if (bd) bd.innerHTML = rows;
      var m = root.querySelector('#ol-miss');
      if (m) m.innerHTML = miss.length ? 'Cần xem lại <b>' + miss.length + ' câu</b>: ' + miss.map(function (it) { return '<button type="button" class="ol-jump" data-ol="jumpq" data-k="' + it.k + '">' + esc(it.n) + '</button>'; }).join('') : 'Không có câu nào sai. Giỏi lắm!';
      var n = root.querySelector('#ol-note'); if (n && opt.doneNote) n.innerHTML = opt.doneNote(st);
    }
    function submit() {
      if (st.done) return;
      var rr = tally(T, st); if (rr.filled < rr.total && !confirm('Em còn ' + (rr.total - rr.filled) + ' câu chưa làm. Vẫn nộp bài? (Nộp rồi không sửa được nữa)')) return;
      if (rr.filled >= rr.total && !confirm('Nộp bài? Nộp rồi sẽ hiện điểm và đáp án, không sửa được nữa.')) return;
      SUBM = true; var b = root.querySelector('[data-ol=submit]'); if (b) { b.disabled = true; b.innerHTML = '<span class="ol-spin"></span>Đang chấm bài…'; }
      var list = null, i = 0;
      function one() {
        if (i >= list.length) return Promise.resolve();
        var it = list[i++], s = S(st, it.k);
        var p = ready(it, s) ? check(it) : (s.checked = true, s.pts = 0, s.blank = true, repaint(it), Promise.resolve());
        return p.then(one);
      }
      var waitAll = function () { var ps = Object.keys(PR).map(function (k) { return PR[k]; }); return ps.length ? Promise.all(ps).then(waitAll) : Promise.resolve(); };
      return waitAll().then(function () { list = graded(T).filter(function (it) { var s = S(st, it.k); return !s.checked; }); return Promise.all([one(), one(), one()]); }).then(waitAll).then(function () {
        st.done = Date.now(); save(); var r = tally(T, st);
        if (b) { b.textContent = 'Đã nộp bài'; }
        if (opt.onSubmit) opt.onSubmit(st, r);
        summary(); (r.pts >= 8 ? ding : function () {})();
        var sm = root.querySelector('#ol-submit'); if (sm) sm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
    root.onclick = function (ev) {
      var t = ev.target.closest('[data-ol]'); if (!t || !root.contains(t)) return;
      var a = t.getAttribute('data-ol'), k = t.getAttribute('data-k');
      if (a === 'jump') { var el = root.querySelector('#olp' + t.getAttribute('data-pi')); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); [].forEach.call(root.querySelectorAll('.ol-nchip'), function (c) { c.removeAttribute('aria-current'); }); if (t.classList.contains('ol-nchip')) t.setAttribute('aria-current', 'true'); return; }
      if (a === 'jumpq') { var q = root.querySelector('#q' + k); if (q) q.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      if (a === 'pick' && (mode === 'do' || mode === 'preview')) { var it = byK(k), s = S(st, k); if (!it || s.checked) return; s.pick = +t.getAttribute('data-i'); save(); repaint(it); return; }
      if (a === 'chk') { var it2 = byK(k); if (it2) check(it2); return; }
      if (a === 'submit') { submit(); return; }
      if (a === 'reset') { if (opt.onReset) opt.onReset(); return; }
      if (a === 'sound') { sound = !sound; t.textContent = sound ? '🔊 Âm thanh' : '🔇 Đã tắt tiếng'; if (sound) ding(); return; }
      if (opt.onAction) opt.onAction(a, t, ev);
    };
    root.oninput = function (ev) {
      var t = ev.target; if (t.getAttribute('data-ol') !== 'in') return;
      var k = t.getAttribute('data-k'), it = byK(k), s = S(st, k); if (!it || s.checked || s.busy) return;
      s.a = t.value; save();
      var wc = root.querySelector('#wc' + k); if (wc) wc.textContent = words(t.value) + ' từ';
      var c = root.querySelector('#q' + k + ' [data-ol=chk]'); if (c) c.disabled = !ready(it, s);
      refreshTop();
    };
    root.onkeydown = function (ev) { var t = ev.target; if (ev.key === 'Enter' && t.tagName === 'INPUT' && t.getAttribute('data-ol') === 'in') { ev.preventDefault(); if (st.perCheck) { var itp = byK(t.getAttribute('data-k')); if (itp) check(itp); return; } var ins = [].slice.call(root.querySelectorAll('[data-ol=in]:not([disabled])')), ix = ins.indexOf(t); if (ins[ix + 1]) ins[ix + 1].focus(); } };
    full(); refreshTop();
    return { redraw: full, submit: submit };
  };

  /* ---------- âm thanh đúng / sai ---------- */
  var sound = true, ac0 = null;
  function tone(fs, type, dur) {
    if (!sound) return;
    try {
      ac0 = ac0 || new (window.AudioContext || window.webkitAudioContext)(); if (ac0.state === 'suspended') ac0.resume();
      var t0 = ac0.currentTime;
      fs.forEach(function (f, i) { var o = ac0.createOscillator(), g = ac0.createGain(); o.type = type; o.frequency.setValueAtTime(f, t0 + i * dur); g.gain.setValueAtTime(0.0001, t0 + i * dur); g.gain.exponentialRampToValueAtTime(0.17, t0 + i * dur + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * dur + dur * 1.5); o.connect(g); g.connect(ac0.destination); o.start(t0 + i * dur); o.stop(t0 + i * dur + dur * 1.6); });
    } catch (e) {}
  }
  function ding() { tone([784, 1174.7], 'sine', 0.11); }
  function buzz() { tone([208, 155], 'triangle', 0.15); }

  /* ================= HỌC SINH ================= */
  function index() { var x = store.get('ln_ol', null); return x && x.tests ? x : { tests: {} }; }
  OL.index = index;
  function mine(u) {
    var ix = index(), out = [];
    Object.keys(ix.tests).forEach(function (id) {
      var m = ix.tests[id]; if (!m || m.del || m.status !== 'giao') return;
      if (u.gv || (m.uh || []).indexOf(LN.hash('ol:' + u.username)) >= 0 || (m.grades || []).indexOf(+u.grade) >= 0) out.push(Object.assign({ id: id }, m));
    });
    return out.sort(function (a, b) { return (b.pubAt || 0) - (a.pubAt || 0); });
  }
  OL.mine = mine;
  OL.hasAny = function () { var u = LN.me(); return !!(u && mine(u).length); };
  function attempts(un, id) { var p = LN.progOf(un), o = (p.ol || {})[id] || {}; return Object.keys(o).filter(function (t) { return /^\d{10,14}$/.test(t) && o[t] && typeof o[t] === 'object'; }).map(function (t) { return Object.assign({}, o[t], { t: +t }); }).sort(function (a, b) { return a.t - b.t; }); }
  OL.attempts = attempts;
  function loadTest(id) {
    var u = LN.me(), loc = store.get('ln_olt_' + id, null), meta = index().tests[id] || {};
    if (loc && (u && u.gv || !(LN.cloud && LN.cloud.on))) return Promise.resolve(OL.normalize(JSON.parse(JSON.stringify(loc))));
    var c = store.get('ln_oltc_' + id, null);
    if (c && c.v === meta.updated && c.T) return Promise.resolve(OL.normalize(c.T));
    if (!(LN.cloud && LN.cloud.api)) return Promise.reject(new Error('offline'));
    return LN.cloud.api('olget', { id: id }).then(function (j) {
      if (!j.test) throw new Error('empty');
      try { store.set('ln_oltc_' + id, { v: meta.updated, T: j.test }); } catch (e) {}
      return OL.normalize(j.test);
    }, function (e) { if (c && c.T) return OL.normalize(c.T); throw e; });
  }
  OL.loadTest = loadTest;
  /* điểm cô chấm lại (chỉ của chính em) */
  var MK = null;
  function myMarks() {
    var t = store.get('ln_cloud_tok', null);
    if (!t || !(LN.cloud && LN.cloud.on && LN.cloud.api)) return Promise.resolve(MK || {});
    return LN.cloud.api('olmarks', { token: t }).then(function (j) { MK = j.marks || {}; return MK; }, function () { return MK || {}; });
  }
  OL.scoreWith = function (at, mk) {   // điểm tính lại từ từng câu (có điểm cô chấm lại nếu có)
    mk = mk || {}; var c = 0, pend = 0, R = at.r && typeof at.r === 'object' ? at.r : {}, keys = Object.keys(R), n = +at.n || keys.length;
    keys.forEach(function (k) { var r = +R[k]; if (mk[k] != null) c += Math.max(0, Math.min(1, +mk[k] || 0)); else if (r === -1) pend++; else c += Math.max(0, Math.min(1, r || 0)); });
    return { s: n ? Math.min(10, c / n * 10) : 0, c: c, pend: pend, mk: Object.keys(mk).length > 0 };
  };
  function refreshIndex() {
    if (!(LN.cloud && LN.cloud.on && LN.cloud.api) || store.get('ln_admin_session', null)) return Promise.resolve(false);
    return LN.cloud.api('public').then(function (pub) { if (pub.ln_ol) { var old = JSON.stringify(store.get('ln_ol', null)); if (old !== JSON.stringify(pub.ln_ol)) { store.set('ln_ol', pub.ln_ol); return true; } } return false; }, function () { return false; });
  }
  function page(body) { LN.render(LN.header('ol') + '<main class="olx" style="padding:0"><div class="ol-shell">' + body + '</div></main>' + LN.footer()); }
  OL.viewList = function (again) {
    var u = LN.me(); OL.fonts();
    var L = mine(u), MKs = MK || {};
    page('<header class="ol-hero"><span class="ol-blob ol-b1"></span><span class="ol-blob ol-b2"></span><div class="ol-eyebrow">Ôn luyện</div><h1>Đề ôn luyện của em</h1><p>Cô giao đề nào sẽ hiện ở đây. Em làm hết bài rồi bấm <b>Nộp bài</b> mới xem được đáp án và lời giải. Em được làm lại nhiều lần, cô xem được tất cả các lần em làm.</p></header>' +
      (L.length ? '<div class="ol-list">' + L.map(function (m) {
        var at = attempts(u.username, m.id).map(function (x) { var sc = OL.scoreWith(x, (MKs[m.id] || {})[x.t]); return Object.assign(x, { s: sc.s, mk: sc.mk }); }), wip = store.get('ln_olwip_' + u.username + '_' + m.id, null), best = at.reduce(function (b, x) { return Math.max(b, +x.s || 0); }, 0);
        return '<div class="ol-card"><span class="ol-k2">' + esc(m.kicker || 'Đề ôn luyện') + '</span><h3>' + esc(m.title) + '</h3><p>' + (m.n || 0) + ' câu' + (at.length ? ' · Đã làm ' + at.length + ' lần · Điểm cao nhất <b>' + fmt(best) + '</b>' : ' · Chưa làm') + '</p>' +
          (at.length ? '<div class="ol-hist">' + at.slice(-6).map(function (x) { return '<a href="#/ol/' + esc(m.id) + '/r/' + x.t + '" title="Xem lại bài làm">' + dateVN(x.t) + ': <b>' + fmt(+x.s || 0) + '</b>' + (x.mk ? ' ✎' : '') + '</a>'; }).join('') + '</div>' : '') +
          '<div class="ol-act"><a class="ol-btn ol-solid" style="text-decoration:none" href="#/ol/' + m.id + '">' + (wip && Object.keys(wip.a || {}).length && !wip.done ? 'Làm tiếp' : at.length ? 'Làm lại' : 'Bắt đầu làm') + '</a></div></div>';
      }).join('') + '</div>' : '<div class="ol-empty">' + LN.chick(110, 'wow') + '<p>Hiện chưa có đề ôn luyện nào cô giao cho em.</p></div>'));
    if (!again) Promise.all([refreshIndex(), myMarks()]).then(function () { if (location.hash === '#/ol') OL.viewList(true); });
    try { var keep = {}; L.forEach(function (m) { keep['ln_oltc_' + m.id] = 1; }); store.keys().forEach(function (k) { if (/^ln_oltc_/.test(k) && !keep[k]) store.del(k); }); } catch (e) {}
  };
  OL.viewTest = function (id, sub, ts) {
    var u = LN.me(); OL.fonts();
    page('<div class="ol-empty"><span class="ol-spin"></span> Đang tải đề…</div>');
    var go = function () {
      loadTest(id).then(function (T) {
        var root = document.querySelector('main.olx'), wk = 'ln_olwip_' + u.username + '_' + id;
        if (sub === 'r') {   // xem lại một lần đã nộp
          var at = attempts(u.username, id).filter(function (x) { return x.t === +ts; })[0];
          if (!at) { root.innerHTML = '<div class="ol-shell"><div class="ol-empty">Không tìm thấy lần làm này.</div></div>'; return; }
          myMarks().then(function (M) {
            var mk = (M[id] || {})[at.t] || null, sc = OL.scoreWith(at, mk);
            OL.mount({ T: T, st: OL.stFromAttempt(T, at, mk), mode: 'review', root: root, topHTML: reviewTop(T, Object.assign({}, at, { s: sc.s, c: sc.c, mk: sc.mk }), id) });
          });
          return;
        }
        var st = store.get(wk, null); if (!st || !st.a || st.v !== (index().tests[id] || {}).updated) st = { a: {}, v: (index().tests[id] || {}).updated };
        OL.mount({ T: T, st: st, mode: 'do', root: root, perCheck: !!u.gv,
          topHTML: '<div class="ol-info"><b>Học sinh:</b> ' + esc(u.name) + (u.gv ? ' <span class="ol-pill ol-y">Cô đang xem như học sinh – kết quả không lưu</span>' : '') + '<ul class="ol-rules"><li>Em làm lần lượt các câu, <b>chưa nộp thì vẫn sửa được</b>. Bài đang làm được lưu trên máy, tắt máy mở lại vẫn còn.</li><li>Làm xong bấm <b>Nộp bài</b> ở cuối trang. <b>Nộp rồi mới hiện điểm và đáp án</b>, và không sửa được nữa. Kết quả <b>tự gửi cho cô</b>.</li><li>Chữa bài: câu nào sai có <b>lí do sai</b>, <b>đáp án đúng</b>, lời giải và <b>lí thuyết cần nhớ</b> ngay bên dưới. Em chép câu sai và đáp án đúng vào vở.</li><li>Câu viết được chấm theo nghĩa: viết cách khác mà vẫn đúng thì vẫn được điểm. Cô có thể chấm lại.</li></ul></div>',
          onSave: function (s) { if (!u.gv) store.set(wk, s); },
          onSubmit: function (s, r) {
            if (u.gv) return;
            var rec = OL.attemptFrom(T, s, r), p = LN.progOf(u.username); p.ol = p.ol || {}; p.ol[id] = p.ol[id] || {}; p.ol[id][s.done] = rec;
            // tiến độ giới hạn ~900KB khi lưu lên mạng: quá lớn thì bỏ bớt lời giải thích của các lần làm cũ nhất (điểm & câu trả lời vẫn giữ)
            try { var all2 = []; Object.keys(p.ol).forEach(function (tid) { Object.keys(p.ol[tid] || {}).forEach(function (t2) { all2.push([+t2, p.ol[tid][t2]]); }); }); all2.sort(function (a, b) { return a[0] - b[0]; });
              for (var q = 0; JSON.stringify(p).length > 650000 && q < all2.length - 1; q++) { all2[q][1].f = {}; } } catch (e) {}
            p.updated = Date.now(); LN.saveProgOf(u.username, p);
          },
          doneNote: function () { return u.gv ? 'Cô đang xem thử nên kết quả không lưu.' : 'Đã chốt điểm và <b>gửi kết quả cho cô</b>. Bấm số câu sai để nhảy tới phần chữa. Muốn làm lại thì bấm <b>Làm lại từ đầu</b>.'; },
          onReset: function () { if (!confirm('Làm lại từ đầu? Bài đang làm sẽ được xoá (các lần đã nộp vẫn được giữ).')) return; store.del ? store.del(wk) : store.set(wk, null); OL.viewTest(id); }
        });
      }, function (e) { var r = document.querySelector('main.olx'); if (r) r.innerHTML = '<div class="ol-shell"><div class="ol-empty">Chưa tải được đề (' + esc(e.message || e) + '). Kiểm tra mạng rồi tải lại trang nhé.</div></div>'; });
    };
    if (!index().tests[id]) refreshIndex().then(go); else go();
  };
  function reviewTop(T, at, id) {
    return '<div class="ol-info"><b>Xem lại bài làm lúc ' + dateVN(at.t) + '</b> · Điểm <b>' + fmt(+at.s || 0) + '</b> · ' + fmt(+at.c || 0).replace(',0', '') + '/' + (+at.n || T.total) + ' câu đúng' + (at.mk ? ' <span class="ol-pill ol-g">Cô đã chấm lại</span>' : '') + ' <a class="ol-btn ol-sm" style="text-decoration:none;margin-left:8px" href="#/ol">← Danh sách đề</a></div>';
  }
  /* bản ghi gọn để lưu vào tiến độ (đồng bộ lên mạng) */
  OL.attemptFrom = function (T, st, r) {
    var a = {}, rr = {}, f = {};
    graded(T).forEach(function (it) {
      var s = st.a[it.k] || {}; a[it.k] = it.t === 'q' ? (s.pick == null ? '' : 'o' + s.pick) : String(s.a || '').slice(0, 1500);
      rr[it.k] = s.pend ? -1 : Math.round((s.pts || 0) * 100) / 100;
      if (s.fix || s.why) f[it.k] = { x: String(s.fix || '').slice(0, 800), w: String(s.why || '').slice(0, 800) };
    });
    return { s: Math.round(r.pts * 10) / 10, c: Math.round(r.right * 100) / 100, n: r.total, p: r.pend, a: a, r: rr, f: f, v: T.v || 0 };
  };
  OL.stFromAttempt = function (T, at, marks) {
    var st = { a: {}, done: at.t, mark: marks || null };
    graded(T).forEach(function (it) {
      var v = (at.a || {})[it.k], r = (at.r || {})[it.k], f = (at.f || {})[it.k] || {};
      r = +r; var s = { checked: true, pts: r > 0 ? Math.min(1, r) : 0, pend: r === -1, fix: String(f.x || ''), why: String(f.w || '') };
      if (marks && marks[it.k] != null) { s.pts = Math.max(0, Math.min(1, +marks[it.k] || 0)); s.pend = false; s.marked = true; }
      if (it.t === 'q') s.pick = typeof v === 'string' && /^o\d$/.test(v) ? +v.slice(1) : null; else s.a = typeof v === 'string' ? v : '';
      st.a[it.k] = s;
    });
    return st;
  };
})();
;
(window.LN_V=window.LN_V||{})["onluyen.js"]="403ed0a1";
