/* ================= Trợ lý AI Chíp (Gemini – Google AI Studio) =================
   - Trên Vercel: gọi /api/ai, khoá AI nằm an toàn trên máy chủ (giáo viên cài 1 lần, học sinh không cần làm gì).
   - Mở file trực tiếp (không có máy chủ): giáo viên có thể dán khoá ở Khu giáo viên → Trợ lý AI; khoá chỉ lưu trên máy đó. */
(function () {
  var LN = window.LN, store = LN.store, esc = LN.esc, P = window.AIPROMPTS;
  var AI = LN.ai = {}, ST = { server: null, model: '', p: null };
  function cfg() { return Object.assign({ enabled: true, key: '', model: '' }, store.get('ln_ai_cfg', {})); }
  AI.cfg = cfg;
  AI.saveCfg = function (c) { store.set('ln_ai_cfg', Object.assign(cfg(), c)); };
  AI.status = ST;
  AI.check = function (force) {
    if (ST.p && !force) return ST.p;
    if (location.protocol === 'file:') { ST.server = false; ST.p = Promise.resolve(false); return ST.p; }
    ST.p = fetch('api/ai', { method: 'GET', cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { ST.server = !!(j && j.ok); ST.model = (j && j.model) || ''; return ST.server; })
      .catch(function () { ST.server = false; return false; });
    return ST.p;
  };
  AI.ready = function () { var c = cfg(); return c.enabled !== false && (ST.server === true || !!c.key); };
  AI.call = function (task, payload) {
    var body = Object.assign({ task: task }, payload || {}), c = cfg();
    function local() { if (!c.key || !P) return Promise.reject(new Error('Chưa cài khoá AI.')); return P.call(c.key, task, body, c.model ? [c.model].concat(P.defaultModels) : null); }
    if (ST.server === true) {
      return fetch('api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) { var e = new Error(j.error || ('Lỗi ' + r.status)); e.status = r.status; throw e; } return j; });
      });
    }
    return local();
  };
  /* Ghi âm (webm/mp4) → WAV 16 kHz mono để Gemini nghe được trên mọi trình duyệt */
  AI.toWav = function (blob) {
    return blob.arrayBuffer().then(function (buf) {
      var Ctx = window.AudioContext || window.webkitAudioContext, ctx = new Ctx();
      return new Promise(function (ok, bad) { ctx.decodeAudioData(buf, ok, bad); }).then(function (ab) {
        try { ctx.close(); } catch (e) {}
        var rate = 16000, len = Math.min(Math.floor(ab.duration * rate), rate * 30), out = new Float32Array(len), ch = ab.numberOfChannels, src = ab.sampleRate;
        for (var i = 0; i < len; i++) { var s = 0, k = Math.min(ab.length - 1, Math.floor(i * src / rate)); for (var c = 0; c < ch; c++) s += ab.getChannelData(c)[k]; out[i] = s / ch; }
        var dv = new DataView(new ArrayBuffer(44 + len * 2)), w = function (o, s) { for (var j = 0; j < s.length; j++) dv.setUint8(o + j, s.charCodeAt(j)); };
        w(0, 'RIFF'); dv.setUint32(4, 36 + len * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
        dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, len * 2, true);
        for (var q = 0; q < len; q++) { var v = Math.max(-1, Math.min(1, out[q])); dv.setInt16(44 + q * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true); }
        var bytes = new Uint8Array(dv.buffer), bin = '', step = 0x8000;
        for (var b = 0; b < bytes.length; b += step) bin += String.fromCharCode.apply(null, bytes.subarray(b, b + step));
        return { mime: 'audio/wav', data: btoa(bin) };
      });
    });
  };
  /* Chấm phát âm một từ/cụm từ */
  AI.pron = function (blob, target, vi) { return AI.toWav(blob).then(function (a) { return AI.call('pron', { target: target, vi: vi || '', audio: a }); }); };
  /* Chấm câu trả lời nói */
  AI.answer = function (blob, card) { return AI.toWav(blob).then(function (a) { return AI.call('answer', { question: card.q, models: card.a, open: !!card.open, audio: a }); }); };
  AI.check();

  /* Kết quả AI hiển thị trong trò chơi nói */
  AI.feedbackHtml = function (r) {
    if (!r || !r.ai) return '';
    var x = r.ai, words = Array.isArray(x.words) ? x.words : [];
    return '<div class="ai-fb">' + LN.art('chip-mic', 40, 'ai-ava', '') + '<div><p class="ai-h">Chíp AI nhận xét' + (x.praise ? ' · <i>' + esc(x.praise) + '</i>' : '') + '</p>' +
      (words.length ? '<p class="ai-words">' + words.map(function (w) { return '<span class="ai-w ' + (w.ok ? 'ok' : 'no') + '" title="' + esc(w.tip || '') + '">' + esc(w.w) + '</span>'; }).join('') + '</p>' : '') +
      (x.tip_vi ? '<p class="ai-tip">' + esc(x.tip_vi) + '</p>' : '') +
      words.filter(function (w) { return !w.ok && w.tip; }).slice(0, 3).map(function (w) { return '<p class="ai-tip sm">• <b>' + esc(w.w) + '</b>: ' + esc(w.tip) + '</p>'; }).join('') +
      (x.better ? '<p class="ai-tip">Em có thể nói: <b>' + esc(x.better) + '</b> ' + LN.sayBtn(x.better, 'sm') + '</p>' : '') + '</div></div>';
  };

  /* ---------- Trang "Hỏi Chíp": trò chuyện tiếng Anh bằng chữ hoặc giọng nói ---------- */
  var CH = { msgs: [], busy: false, rec: null };
  function unitCtx() {
    var p = LN.UNITS, u = null, cur = store.get('ln_ai_unit', 0);
    if (cur && LN.unitOf(cur)) u = LN.unitOf(cur); else if (p && p.length) u = p[0];
    if (!u) return {};
    var pats = []; (u.patterns || []).forEach(function (x) { pats.push(x.q + ' → ' + x.a); });
    return { title: 'Unit ' + u.n + ': ' + u.title, vocab: (u.vocab || []).map(function (v) { return v[0]; }), patterns: pats, n: u.n };
  }
  function chatHtml() {
    return CH.msgs.map(function (m) {
      if (m.r === 'u') return '<div class="aic-row mine"><div class="aic-b mine">' + (m.voice ? '🎤 ' : '') + esc(m.t || '…') + '</div></div>';
      return '<div class="aic-row"><span class="aic-ava">' + LN.art('chip-wave', 44, '', '') + '</span><div class="aic-b"><p class="en">' + esc(m.t) + ' ' + LN.sayBtn(m.t, 'sm') + '</p>' + (m.vi ? '<p class="vi">' + esc(m.vi) + '</p>' : '') + (m.tip ? '<p class="tip">💡 ' + esc(m.tip) + '</p>' : '') + '</div></div>';
    }).join('') + (CH.busy ? '<div class="aic-row"><span class="aic-ava">' + LN.art('chip-think', 44, '', '') + '</span><div class="aic-b typing"><i></i><i></i><i></i></div></div>' : '');
  }
  function drawChat() { var box = document.getElementById('aic-log'); if (box) { box.innerHTML = chatHtml(); box.scrollTop = box.scrollHeight; } var mic = document.getElementById('aic-mic'); if (mic) { mic.classList.toggle('on', !!CH.rec); mic.innerHTML = CH.rec ? '⏹ Dừng' : '🎤 Nói'; } }
  function send(text, audio) {
    if (CH.busy) return;
    var hist = CH.msgs.filter(function (m) { return m.t; }).map(function (m) { return { r: m.r, t: m.t }; });
    var mine = { r: 'u', t: text || '', voice: !!audio }; if (text || audio) CH.msgs.push(mine);
    CH.busy = true; drawChat();
    var u = LN.me(), ctx = unitCtx();
    AI.call('chat', { history: hist, text: text || '', audio: audio || null, unit: ctx, level: u && u.grade > 100 ? 'Everybody Up ' + (u.grade - 100) : 'grade ' + (u ? u.grade : 3) })
      .then(function (r) { if (audio) mine.t = r.heard || '(Chíp chưa nghe rõ)'; CH.msgs.push({ r: 'm', t: r.reply || '…', vi: r.vi || '', tip: r.tip_vi || '' }); CH.busy = false; drawChat(); if (r.reply) LN.speak(r.reply); })
      .catch(function (e) { CH.busy = false; CH.msgs.push({ r: 'm', t: 'Oops!', vi: e.message || 'Chíp chưa trả lời được, em thử lại nhé.' }); drawChat(); });
  }
  LN.viewAI = function () {
    var u = LN.me(), ok = AI.ready();
    var units = LN.UNITS || [], cur = store.get('ln_ai_unit', 0) || (units[0] && units[0].n) || 0;
    LN.render(LN.header('ai') + '<main class="wrap page"><div class="aic">' +
      '<div class="aic-top">' + LN.art('chip-mic', 84, 'bob', '') + '<div style="flex:1;min-width:0"><h1 class="title" style="margin:0">Hỏi Chíp AI</h1><p class="muted">Trò chuyện tiếng Anh với Chíp: gõ chữ hoặc bấm <b>🎤 Nói</b>. Chíp đọc to câu trả lời và sửa lỗi cho em.</p></div>' +
      (units.length ? '<label class="small muted">Chủ đề <select class="sel" id="aic-unit">' + units.map(function (x) { return '<option value="' + x.n + '"' + (x.n === cur ? ' selected' : '') + '>Unit ' + x.n + ': ' + esc(x.title) + '</option>'; }).join('') + '</select></label>' : '') + '</div>' +
      (ok ? '' : '<div class="note note-yel">🔌 Chíp AI chưa sẵn sàng: cô/thầy cần cài khoá AI trong <b>Khu giáo viên → Trợ lý AI</b>' + (ST.server === null ? ' (đang kiểm tra máy chủ…)' : '') + '.</div>') +
      '<div class="aic-log" id="aic-log"></div>' +
      '<form class="aic-in" id="aic-form"><button type="button" class="btn btn-yel" id="aic-mic"' + (ok ? '' : ' disabled') + '>🎤 Nói</button><input class="inp" id="aic-text" placeholder="Gõ tiếng Anh (hoặc tiếng Việt) rồi bấm Gửi…" autocomplete="off"' + (ok ? '' : ' disabled') + '><button class="btn btn-pink" type="submit"' + (ok ? '' : ' disabled') + '>Gửi</button></form>' +
      '<div class="aic-sugg">' + ['Hello, Chip!', 'Can you help me?', 'Ask me a question!', 'How do I say "con mèo"?'].map(function (s) { return '<button type="button" class="chipbtn" data-aisugg="' + esc(s) + '"' + (ok ? '' : ' disabled') + '>' + esc(s) + '</button>'; }).join('') + '</div>' +
      '</div></main>' + LN.footer());
    if (!CH.msgs.length) CH.msgs.push({ r: 'm', t: 'Hi' + (u ? ' ' + u.name.trim().split(/\s+/).pop() : '') + '! I\'m Chip. Let\'s talk in English!', vi: 'Chào em! Mình là Chíp. Mình cùng nói tiếng Anh nhé!' });
    drawChat();
    if (ST.server === null) AI.check().then(function () { if (location.hash === '#/ai' && AI.ready()) LN.viewAI(); });
    var f = document.getElementById('aic-form');
    f.addEventListener('submit', function (ev) { ev.preventDefault(); var i = document.getElementById('aic-text'), v = i.value.trim(); if (!v) return; i.value = ''; send(v); });
    var sel = document.getElementById('aic-unit'); if (sel) sel.addEventListener('change', function () { store.set('ln_ai_unit', +sel.value); });
    document.getElementById('aic-mic').addEventListener('click', function () {
      if (CH.rec) { try { CH.rec.stop(); } catch (e) {} return; }
      if (!navigator.mediaDevices || !window.MediaRecorder) { LN.toast('Trình duyệt này chưa ghi âm được, em gõ chữ nhé.'); return; }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
        var chunks = [], mr = new MediaRecorder(s); CH.rec = mr; if (window.speechSynthesis) speechSynthesis.cancel(); drawChat();
        mr.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        mr.onstop = function () { s.getTracks().forEach(function (t) { t.stop(); }); CH.rec = null; drawChat(); clearTimeout(CH.t); if (!chunks.length) return; AI.toWav(new Blob(chunks, { type: mr.mimeType || 'audio/webm' })).then(function (a) { send('', a); }).catch(function () { LN.toast('Không đọc được đoạn ghi âm.'); }); };
        mr.start(); CH.t = setTimeout(function () { try { mr.stop(); } catch (e) {} }, 15000);
      }).catch(function () { LN.toast('Em cho phép dùng micro (biểu tượng 🔒 trên thanh địa chỉ) rồi thử lại nhé.'); });
    });
  };
  document.addEventListener('click', function (ev) {
    var s = ev.target.closest('[data-aisugg]'); if (s) { send(s.getAttribute('data-aisugg')); return; }
    var x = ev.target.closest('[data-aiexp]'); if (!x) return;
    var c = LN.curItem && LN.curItem(); if (!c) return;
    var it = c.it, res = c.res || {}, box = document.getElementById('ai-exp'); x.disabled = true; x.textContent = '🤖 Chíp đang nghĩ…';
    var ans = it.type === 'fill' || it.type === 'fix' ? (it.a && it.a[0]) : it.type === 'order' ? it.a[0] : it.o[it.a];
    var picked = res.given != null ? res.given : res.pick != null && it.o ? it.o[res.pick] : '';
    var ex = LN.explainOf ? LN.explainOf(it) : null;
    AI.call('explain', { q: it.q || it.hintq || it.listen || '', options: it.o || [], correct: ans, picked: picked, why: ex && ex.why || '' }).then(function (r) {
      x.remove(); if (box) box.innerHTML = '<div class="ai-fb">' + LN.art('chip-teacher', 40, 'ai-ava', '') + '<div><p class="ai-h">Chíp giải thích</p><p class="ai-tip">' + LN.mdb(r.vi || '') + '</p>' + (r.example ? '<p class="ai-tip">Ví dụ: <b>' + esc(r.example) + '</b> ' + LN.sayBtn(r.example, 'sm') + (r.example_vi ? '<br><span class="muted">' + esc(r.example_vi) + '</span>' : '') + '</p>' : '') + '</div></div>';
    }).catch(function (e) { x.disabled = false; x.textContent = '🤖 Hỏi Chíp vì sao?'; LN.toast(e.message || 'Chíp chưa trả lời được.'); });
  }, true);
})();
