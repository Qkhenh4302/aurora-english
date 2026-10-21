/* Aurora English – Tạo giọng Gemini cho toàn bộ app (chạy trên máy của cô, trang Giọng đọc & AI)
   - Gửi máy chủ từng lượt ~12 câu, Gemini đọc liền và nghỉ 2 giây giữa các câu
   - Máy cô tự cắt từng câu, kiểm tra số câu + độ dài; sai thì tạo lại nhỏ hơn (tới từng câu một)
   - Nén MP3, lưu tiến độ trong trình duyệt (IndexedDB): tắt máy / hết lượt hôm sau bấm Tiếp tục
   - Xong: đóng gói thành các file zip < 25MB để tải lên GitHub (thư mục voice) */
(function () {
  'use strict';
  var LN = window.LN, store = LN.store;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var VOICE = 'Puck';
  var VOICES = [['Puck', 'Puck – nam trẻ, vui (đã nghe mẫu)'], ['Leda', 'Leda – nữ trẻ, trong trẻo'], ['Kore', 'Kore – nữ, rõ ràng'], ['Aoede', 'Aoede – nữ, nhẹ nhàng'], ['Zephyr', 'Zephyr – nữ, tươi sáng'], ['Fenrir', 'Fenrir – nam, hào hứng'], ['Charon', 'Charon – nam, ấm'], ['Orus', 'Orus – nam, chắc giọng']];
  /* Giọng Puck trên các mẫu Gemini Flash TTS (mỗi mẫu 100 lượt/ngày riêng) – dùng song song cho nhanh.
     Mỗi câu ghi lại đã thu bằng mẫu nào: nếu nghe thấy khác giọng, bấm «Chỉ giữ 1 mẫu» để thu lại phần của mẫu kia. */
  var ALLM = ['gemini-2.5-flash-preview-tts', 'gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts', 'gemini-2.5-flash-tts'];
  var MODELS = (function () { try { var k = localStorage.getItem('ln_gem_only'); if (k) return ALLM.filter(function (m) { return m === k || (k === 'gemini-2.5-flash-preview-tts' && m === 'gemini-2.5-flash-tts'); }); } catch (e) {} return ALLM.slice(); })();
  function clipB(v) { return v && v.b ? v.b : v; }
  function short(m) { return String(m || '?').replace(/^gemini-/, '').replace(/-tts$/, '').replace('-preview', ''); }
  var RR = 0;
  var BATCH = 40, MAXCH = 1400, PAR = 2, KBPS = 48;   // 48 kbps: giữ nguyên 24 kHz. (32 kbps làm lamejs tự đổi sang 22 kHz và bộ đổi bị lỗi → file câm)
  var KEYP = null;
  function apiKey() { if (!KEYP) KEYP = fetch('api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'key', token: token() }) }).then(function (r) { if (r.status === 401) throw { stop: 'Phiên đăng nhập của cô đã hết hạn. Đăng xuất, đăng nhập lại rồi bấm «Tiếp tục».' }; if (!r.ok) throw { stop: 'Máy chủ chưa có khoá GEMINI_API_KEY.' }; return r.json(); }).then(function (j) { return j.key; }, function (e) { KEYP = null; throw e; }); return KEYP; }
  var BSTYLE = {
    w: 'Voice: a warm, friendly, cheerful young American English teacher talking to young children. Clear standard American pronunciation, natural expressive intonation that rises for questions and falls for statements, relaxed medium-slow pace, never rushed.',
    p: 'Voice: a warm, friendly young American English teacher reading a short story aloud to young children. Gentle expressive storytelling, clear standard American pronunciation, slow calm pace, short pause at commas and a clear pause at each full stop.',
    c: 'Voice: a warm, friendly young American English teacher cheering a child who just answered. Bright, happy and encouraging, natural, not shouting.'
  };
  function b64pcm(b64) { var bin = atob(b64), n = bin.length >> 1, out = new Int16Array(n); for (var i = 0; i < n; i++) { var v = bin.charCodeAt(2 * i) | (bin.charCodeAt(2 * i + 1) << 8); out[i] = v > 32767 ? v - 65536 : v; } return out; }
  var EXTRA = [{ t: 'Her name is Anna.', m: 'w' }, { t: 'Do you have a brother? (Answer as the writer.)', m: 'w' }];
  var G = { run: false, stop: false, total: 0, done: 0, err: 0, req: 0, model: null, msg: '', list: null, failed: {} };

  /* ---------- lưu trữ trong trình duyệt ---------- */
  var DBP = null;
  function db() {
    if (DBP) return DBP;
    DBP = new Promise(function (ok, no) {
      var r = indexedDB.open('aurora-gemini-voice', 1);
      r.onupgradeneeded = function () { var d = r.result; if (!d.objectStoreNames.contains('clips')) d.createObjectStore('clips'); if (!d.objectStoreNames.contains('meta')) d.createObjectStore('meta'); };
      r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); };
    });
    return DBP;
  }
  function tx(st, mode, fn) { return db().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction(st, mode), s = t.objectStore(st), out = fn(s); t.oncomplete = function () { ok(out && typeof IDBRequest !== 'undefined' && out instanceof IDBRequest ? out.result : out); }; t.onerror = function () { no(t.error); }; }); }); }
  function put(st, k, v) { return tx(st, 'readwrite', function (s) { s.put(v, k); }); }
  function get(st, k) { return tx(st, 'readonly', function (s) { return s.get(k); }); }
  function keys(st) { return tx(st, 'readonly', function (s) { return s.getAllKeys(); }); }
  function clear(st) { return tx(st, 'readwrite', function (s) { s.clear(); }); }

  function token() { var s = store.get('ln_admin_session', null); return s && s.tok; }
  function loadLib(src, test) { return test() ? Promise.resolve() : new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = function () { no(new Error('Không tải được ' + src)); }; document.head.appendChild(s); }); }
  function libs() { return Promise.all([loadLib('js/lame.min.js', function () { return !!window.lamejs; }), loadLib('js/jszip.min.js', function () { return !!window.JSZip; })]); }

  /* ---------- danh sách câu ---------- */
  function corpus() {
    return LN.loadAll().then(function () {
      var seen = {}, out = [];
      LN.ttsCorpus().filter(function (x) { return !/\S\/\S/.test(x.t); }).concat(EXTRA).forEach(function (x) {
        var k = LN.vpKey(x.m, x.t); if (seen[k]) return; seen[k] = 1; out.push({ t: x.t, m: x.m, k: k });
      });
      return out;
    });
  }

  /* ---------- WAV -> mẫu âm thanh ---------- */
  function parseWav(buf) {
    var dv = new DataView(buf), p = 12, rate = 24000;
    while (p + 8 <= dv.byteLength) {
      var id = String.fromCharCode(dv.getUint8(p), dv.getUint8(p + 1), dv.getUint8(p + 2), dv.getUint8(p + 3)), sz = dv.getUint32(p + 4, true);
      if (id === 'fmt ') rate = dv.getUint32(p + 12, true);
      if (id === 'data') return { rate: rate, pcm: new Int16Array(buf.slice(p + 8, p + 8 + Math.min(sz, dv.byteLength - p - 8) - ((Math.min(sz, dv.byteLength - p - 8)) % 2))) };
      p += 8 + sz + (sz % 2);
    }
    throw new Error('wav');
  }
  /* Cắt N câu: lấy N-1 khoảng lặng dài nhất; phải tách bạch rõ với các khoảng nghỉ trong câu */
  function split(pcm, rate, lines) {
    var n = lines.length, fr = Math.round(rate * 0.02), nf = Math.floor(pcm.length / fr), rms = new Float32Array(nf), i, j;
    for (i = 0; i < nf; i++) { var s = 0; for (j = i * fr; j < (i + 1) * fr; j++) s += pcm[j] * pcm[j]; rms[i] = Math.sqrt(s / fr); }
    var voiced = [].slice.call(rms).filter(function (x) { return x > 300; }).sort(function (a, b) { return a - b; });
    var thr = Math.max(180, (voiced.length ? voiced[Math.floor(voiced.length / 2)] : 1000) * 0.06);
    var first = 0, last = nf - 1; while (first < nf && rms[first] < thr) first++; while (last > 0 && rms[last] < thr) last--;
    if (first >= last) return null;
    var gaps = [], st = -1;
    for (i = first; i <= last; i++) { if (rms[i] < thr) { if (st < 0) st = i; } else if (st >= 0) { gaps.push([st, i, i - st]); st = -1; } }
    var segs = [];
    if (n === 1) segs = [[first, last + 1]];
    else {
      var sorted = gaps.slice().sort(function (a, b) { return b[2] - a[2]; });
      if (sorted.length < n - 1) return null;
      var cut = sorted.slice(0, n - 1), rest = sorted[n - 1];
      var minCut = cut[n - 2][2] * 0.02;
      if (minCut < 0.9) return null;                                   // khoảng nghỉ giữa câu phải ≥ 0.9 giây (yêu cầu 2 giây)
      if (rest && rest[2] * 0.02 > minCut * 0.75) return null;           // không phân biệt rõ khoảng nghỉ giữa câu với nghỉ trong câu
      cut.sort(function (a, b) { return a[0] - b[0]; });
      var a0 = first; cut.forEach(function (g) { segs.push([a0, g[0]]); a0 = g[1]; }); segs.push([a0, last + 1]);
    }
    /* kiểm tra độ dài hợp lý so với số chữ */
    var ratios = segs.map(function (sg, k) { return ((sg[1] - sg[0]) * 0.02) / (lines[k].length + 6); }).slice().sort(function (a, b) { return a - b; });
    var med = ratios[Math.floor(ratios.length / 2)], bad = false;
    segs.forEach(function (sg, k) { var d = (sg[1] - sg[0]) * 0.02, r = d / (lines[k].length + 6); if (d < 0.2 || (n > 2 && (r > med * 3.2 || r < med / 3.2))) bad = true; });
    if (bad) return null;
    return segs.map(function (sg) { var a = Math.max(0, sg[0] * fr - Math.round(rate * 0.05)), b = Math.min(pcm.length, sg[1] * fr + Math.round(rate * 0.12)); return pcm.subarray(a, b); });
  }
  LN._gemSplit = split; LN._gemParseWav = parseWav;
  /* Kiểm tra file mp3 vừa tạo có tiếng thật (giải mã lại và đo âm lượng lớn nhất 0..1) */
  function loud(b) {
    var C = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!C) return Promise.resolve(1);
    return new Promise(function (ok) {
      try {
        var ac = new C(1, 1, 24000), done = function (buf) { var d = buf.getChannelData(0), m = 0; for (var i = 0; i < d.length; i += 3) { var a = d[i] < 0 ? -d[i] : d[i]; if (a > m) m = a; } ok(m); };
        var pr = ac.decodeAudioData(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength), done, function () { ok(0); });
        if (pr && pr.then) pr.then(done, function () { ok(0); });
      } catch (e) { ok(1); }
    });
  }
  LN._gemLoud = loud;
  function mp3(pcm, rate) {
    var enc = new window.lamejs.Mp3Encoder(1, rate, KBPS), out = [], blk = 1152, i, b;
    var pad = new Int16Array(Math.round(rate * 0.03));
    var all = new Int16Array(pad.length + pcm.length + Math.round(rate * 0.08)); all.set(pad, 0); all.set(pcm, pad.length);
    for (i = 0; i < all.length; i += blk) { b = enc.encodeBuffer(all.subarray(i, i + blk)); if (b.length) out.push(new Uint8Array(b)); }
    b = enc.flush(); if (b.length) out.push(new Uint8Array(b));
    var len = out.reduce(function (s, x) { return s + x.length; }, 0), res = new Uint8Array(len), p = 0; out.forEach(function (x) { res.set(x, p); p += x.length; });
    return res;
  }

  /* ---------- gọi máy chủ ---------- */
  function today() { return new Date().toISOString().slice(0, 10); }
  function perModel(m) { var o = {}; try { o = JSON.parse(localStorage.getItem('ln_gem_pm') || '{}'); } catch (e) {} if (o.d !== today()) o = { d: today(), c: {} }; if (m) { o.c[m] = (o.c[m] || 0) + 1; try { localStorage.setItem('ln_gem_pm', JSON.stringify(o)); } catch (e) {} } return o.c; }
  function reqToday(add) { var o = {}; try { o = JSON.parse(localStorage.getItem('ln_gem_req') || '{}'); } catch (e) {} if (o.d !== today()) o = { d: today(), n: 0 }; if (add) { o.n += add; try { localStorage.setItem('ln_gem_req', JSON.stringify(o)); } catch (e) {} } return o.n; }
  function exhausted() { var e = store.get('ln_note_gemq', null) || {}; return e.d === today() ? e.m || {} : {}; }
  function markExhausted(m) { var e = { d: today(), m: exhausted() }; e.m[m] = 1; store.set('ln_note_gemq', e); }
  function liveModels() { var ex = exhausted(), bad = G.badModel || {}; return MODELS.filter(function (m) { return !ex[m] && !bad[m]; }); }
  function pickModel() { var L = liveModels(); if (!L.length) return null; RR = (RR + 1) % L.length; return L[RR]; }   // xoay vòng các mẫu còn lượt
  function callBatch(items, voice) {
    var model = pickModel(); if (!model) return Promise.reject({ stop: 'Hôm nay đã dùng hết lượt của Gemini. Ngày mai mở trang này và bấm «Tiếp tục».' });
    G.model = model; G.req++; reqToday(1); perModel(model);
    var lines = items.map(function (x) { return x.t; }), mode = items[0].m;
    var prompt = BSTYLE[mode] + '\n\nRead the ' + lines.length + ' lines below for an English lesson. Read every line exactly as written, in order, exactly once. Do not read line numbers, do not add or skip any words. ' +
      'After EACH line stay completely silent for two full seconds before starting the next line. Inside a line, " — " means a second person answers: make a short natural pause (about half a second) there.\n\n' + lines.join('\n');
    return apiKey().then(function (key) {
      return fetch((LN._gemBase || 'https://generativelanguage.googleapis.com') + '/v1beta/models/' + model + ':generateContent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } }) });
    }).then(function (r) {
      if (r.ok) return r.json().then(function (j) {
        var part = ((((j.candidates || [])[0] || {}).content || {}).parts || []).filter(function (x) { return x.inlineData; })[0];
        if (!part) throw { retry: true, msg: 'Gemini không trả âm thanh' };
        var m = /rate=(\d+)/.exec(part.inlineData.mimeType || '');
        return { rate: m ? +m[1] : 24000, pcm: b64pcm(part.inlineData.data), model: model };
      });
      return r.text().then(function (d) {
        d = String(d || '');
        if (r.status === 401 || r.status === 403) throw { stop: 'Google từ chối khoá Gemini (' + r.status + '): ' + d.slice(0, 200) };
        if (r.status === 429) {
          if (/per.?day|PerDay|daily|RequestsPerDay/i.test(d)) { markExhausted(model); return callBatch(items, voice); }
          throw { wait: 65000, msg: 'Gemini đang giới hạn số lượt mỗi phút – chờ 1 phút rồi chạy tiếp…' };
        }
        if (r.status === 404 || (r.status === 400 && /model|not found|not supported/i.test(d))) { G.badModel = G.badModel || {}; G.badModel[model] = 1; return callBatch(items, voice); }
        throw { retry: true, msg: 'Lỗi ' + r.status + ': ' + d.slice(0, 160) };
      });
    });
  }
  function doBatch(items, voice, depth) {
    return callBatch(items, voice).then(function (w) {
      var segs = split(w.pcm, w.rate, items.map(function (x) { return x.t; }));
      if (!segs) {
        if (items.length === 1) throw { retry: true, msg: 'Không cắt được câu: ' + items[0].t.slice(0, 60) };
        var h = Math.ceil(items.length / 2);
        return doBatch(items.slice(0, h), voice, depth + 1).then(function () { return doBatch(items.slice(h), voice, depth + 1); });
      }
      var ok = 0;
      return Promise.all(segs.map(function (pcm, k) {
        var pk = 0; for (var i = 0; i < pcm.length; i += 3) { var a = pcm[i] < 0 ? -pcm[i] : pcm[i]; if (a > pk) pk = a; }
        if (pk < 300) { G.failed[items[k].k] = items[k].t; return; }   // câu Gemini trả về gần như im lặng
        var b = mp3(pcm, w.rate);
        return loud(b).then(function (lv) {
          if (lv < 0.01) { G.failed[items[k].k] = items[k].t; G.msg = '⚠ Một câu ra file câm, sẽ thu lại: ' + items[k].t.slice(0, 50); return; }
          ok++; return put('clips', items[k].k, { b: b, m: w.model, q: 2 });
        });
      })).then(function () { G.done += ok; draw(); });
    }, function (e) {
      if (e && e.retry && (depth || 0) < 3) { G.err++; G.msg = e.msg; draw(); return new Promise(function (ok) { setTimeout(ok, 3000); }).then(function () { return doBatch(items, voice, (depth || 0) + 1); }); }
      if (e && e.retry) { items.forEach(function (x) { G.failed[x.k] = x.t; }); G.err++; G.msg = e.msg; draw(); return; }
      throw e;
    });
  }

  /* ---------- chạy ---------- */
  function start() {
    if (G.run) return;
    var voice = VOICE;
    G.run = true; G.stop = false; G.pub = ''; G.msg = 'Đang chuẩn bị…'; draw();
    libs().then(function () { return get('meta', 'voice'); }).then(function (v) {
      if (v && v !== voice) return clear('clips').then(function () { return put('meta', 'published', null); });
    }).then(function () { return put('meta', 'voice', voice); }).then(corpus).then(function (list) {
      G.list = list; G.total = list.length; return keys('clips');
    }).then(function (have) {
      var hv = {}; have.forEach(function (k) { hv[k] = 1; }); G.done = have.length;
      var todo = G.list.filter(function (x) { return !hv[x.k] && !G.failed[x.k]; });
      var queue = [];
      ['c', 'p', 'w'].forEach(function (m) { var arr = todo.filter(function (x) { return x.m === m; }); for (var i = 0; i < arr.length;) { var b = [], chars = 0; while (i < arr.length && b.length < BATCH && (!b.length || chars + arr[i].t.length < MAXCH)) { chars += arr[i].t.length; b.push(arr[i++]); } queue.push(b); } });
      G.msg = queue.length ? '🎙 Đang thu giọng ' + voice + '… (để trang mở, không cho máy ngủ)' : 'Đã thu xong tất cả câu.'; draw();
      var worker = function () {
        if (G.stop || !queue.length) return Promise.resolve();
        var b = queue.shift();
        return doBatch(b, voice, 0).then(worker, function (e) {
          if (e && e.wait) { queue.unshift(b); G.msg = e.msg; draw(); return new Promise(function (ok) { setTimeout(ok, e.wait); }).then(worker); }
          G.stop = true; queue.unshift(b); G.msg = (e && e.stop) || ('Dừng vì lỗi: ' + (e && e.message || e)); draw();
        });
      };
      var ws = [], np = Math.min(6, Math.max(PAR, liveModels().length * 2)); for (var i = 0; i < np; i++) ws.push(worker());
      return Promise.all(ws);
    }).then(function () {
      G.run = false;
      if (!G.stop && G.done >= G.total - Object.keys(G.failed).length) G.msg = '✅ Đã thu xong ' + G.done + ' câu' + (Object.keys(G.failed).length ? ' (' + Object.keys(G.failed).length + ' câu lỗi, bấm Tiếp tục để thử lại)' : '') + '.';
      G.failed = G.stop ? G.failed : {};
      draw(); autoPublish();
    }, function (e) { G.run = false; G.msg = 'Lỗi: ' + (e && (e.stop || e.message) || e); draw(); autoPublish(); });
  }

  /* ---------- nghe thử ---------- */
  var SAMPLE = ["Hello! My name is Chip. What's your name?", 'apple', 'pencil case', 'What do you do on Mondays? — I go to school.', "Tony is seven years old. He's from Britain.", 'Great job!'];
  function playPcmList(list, rate) {
    var C = window.AudioContext || window.webkitAudioContext, ac = new C(), t = ac.currentTime + 0.1;
    list.forEach(function (pcm) { var b = ac.createBuffer(1, pcm.length, rate), d = b.getChannelData(0); for (var i = 0; i < pcm.length; i++) d[i] = pcm[i] / 32768; var s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(t); t += b.duration + 0.7; });
  }
  function sample() {
    var voice = VOICE, items = SAMPLE.map(function (t) { return { t: t, m: 'w' }; });
    G.msg = '⏳ Đang tạo câu mẫu giọng ' + voice + '…'; draw();
    callBatch(items, voice).then(function (w) {
      var segs = split(w.pcm, w.rate, SAMPLE);
      if (!segs) { G.msg = '⚠️ Gemini đọc mẫu nhưng chưa cắt đúng ' + SAMPLE.length + ' câu – đang phát nguyên đoạn.'; playPcmList([w.pcm], w.rate); }
      else { G.msg = '▶ Đang phát ' + segs.length + ' câu mẫu giọng ' + voice + ' (đã cắt đúng từng câu).'; playPcmList(segs, w.rate); }
      draw();
    }, function (e) { G.msg = '❌ ' + (e.stop || e.msg || e.message || e); draw(); });
  }
  /* Nghe so sánh: cùng câu mẫu, đọc lần lượt bằng từng mẫu (mỗi mẫu tốn 1 lượt) */
  function compare() {
    var items = SAMPLE.map(function (x) { return { t: x, m: 'w' }; }), L = ALLM.filter(function (m) { return m !== 'gemini-2.5-flash-tts'; }), out = [], save = MODELS;
    G.msg = '⏳ Đang đọc mẫu bằng ' + L.length + ' mẫu Gemini để so sánh…'; draw();
    L.reduce(function (p, m) { return p.then(function () { MODELS = [m]; return callBatch(items, VOICE).then(function (w) { out.push([m, w]); }, function () { out.push([m, null]); }); }); }, Promise.resolve()).then(function () {
      MODELS = save;
      var C = window.AudioContext || window.webkitAudioContext, ac = new C(), t0 = ac.currentTime + 0.2, order = [];
      out.forEach(function (o) {
        if (!o[1]) { order.push(short(o[0]) + ': không dùng được'); return; }
        var w = o[1], segs = split(w.pcm, w.rate, SAMPLE) || [w.pcm];
        order.push(short(o[0]) + ' (giây ' + Math.round(t0 - ac.currentTime) + ')');
        segs.slice(0, 3).forEach(function (pcm) { var b = ac.createBuffer(1, pcm.length, w.rate), d = b.getChannelData(0); for (var i = 0; i < pcm.length; i++) d[i] = pcm[i] / 32768; var s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(t0); t0 += b.duration + 0.5; });
        t0 += 1.5;
      });
      G.msg = '▶ Phát lần lượt 3 câu của từng mẫu: ' + order.join(' → '); draw();
    });
  }
  /* Chỉ giữ giọng của 1 mẫu: xoá câu thu bằng mẫu khác để thu lại */
  function keepOne() {
    var pm = {};
    keys('clips').then(function (ks) { return ks.reduce(function (p, k) { return p.then(function () { return get('clips', k); }).then(function (v) { var m = (v && v.m) || 'gemini-2.5-flash-preview-tts'; if (m === 'gemini-2.5-flash-tts') m = 'gemini-2.5-flash-preview-tts'; pm[m] = (pm[m] || 0) + 1; }); }, Promise.resolve()); }).then(function () {
      var opts = ALLM.filter(function (m) { return m !== 'gemini-2.5-flash-tts'; });
      var pickN = prompt('Chỉ giữ giọng của 1 mẫu (câu thu bằng mẫu khác sẽ xoá để thu lại):\n' + opts.map(function (m, i) { return (i + 1) + '. ' + short(m) + ' – đã thu ' + (pm[m] || 0) + ' câu'; }).join('\n') + '\n\nGõ số 1-' + opts.length + ' (hoặc 0 để dùng lại tất cả mẫu):');
      if (pickN == null) return;
      var n = parseInt(pickN, 10);
      if (n === 0) { try { localStorage.removeItem('ln_gem_only'); } catch (e) {} MODELS = ALLM.slice(); G.msg = 'Dùng lại tất cả mẫu.'; draw(); return; }
      var keep = opts[n - 1]; if (!keep) return;
      try { localStorage.setItem('ln_gem_only', keep); } catch (e) {}
      var same = function (m) { m = m || 'gemini-2.5-flash-preview-tts'; return m === keep || (keep === 'gemini-2.5-flash-preview-tts' && m === 'gemini-2.5-flash-tts'); };
      MODELS = ALLM.filter(same);
      var del = 0;
      return keys('clips').then(function (ks) { return ks.reduce(function (p, k) { return p.then(function () { return get('clips', k); }).then(function (v) { if (!same(v && v.m)) { del++; return tx('clips', 'readwrite', function (s) { s.delete(k); }); } }); }, Promise.resolve()); })
        .then(function () { return put('meta', 'published', null); })
        .then(function () { G.done -= del; G.msg = '✅ Từ giờ chỉ dùng mẫu ' + short(keep) + '. Đã xoá ' + del + ' câu của mẫu khác – bấm «Thu tiếp» để thu lại; lần đưa lên app tới sẽ gửi lại toàn bộ.'; draw(); });
    });
  }
  function listenDone() {
    libs().then(function () { return keys('clips'); }).then(function (ks) {
      if (!ks.length) { G.msg = 'Chưa có câu nào.'; draw(); return; }
      var pick = []; for (var i = 0; i < 5; i++) pick.push(ks[Math.floor(Math.random() * ks.length)]);
      var byK = {}; (G.list || []).forEach(function (x) { byK[x.k] = x.t; });
      var C = window.AudioContext || window.webkitAudioContext, ac = new C(), t = ac.currentTime + 0.1;
      var lab = [];
      return pick.reduce(function (p, k) { return p.then(function () { return get('clips', k); }).then(function (v) { lab.push('«' + (byK[k] || k) + '» (' + short(v && v.m) + ')'); G.msg = '▶ ' + lab.join(' · '); draw(); var u8 = clipB(v); return ac.decodeAudioData(u8.buffer.slice(0)); }).then(function (b) { var s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(t); t += b.duration + 0.6; }); }, Promise.resolve());
    }).catch(function (e) { G.msg = 'Lỗi: ' + (e.message || e); draw(); });
  }

  /* ---------- đóng gói ---------- */
  function exportZips() {
    var voice;
    G.msg = '⏳ Đang đóng gói…'; draw();
    libs().then(function () { return get('meta', 'voice'); }).then(function (v) { voice = v || 'Puck'; return corpus(); }).then(function (list) {
      G.list = list;
      var packs = [], cur = null, miss = 0;
      return list.reduce(function (p, x) {
        return p.then(function () { return get('clips', x.k); }).then(function (v) { var u8 = clipB(v);
          if (!u8) { miss++; return; }
          if (!cur || cur.size + u8.length > 2000000) { cur = { f: 'g' + ('0' + packs.length).slice(-2) + '.bin', parts: [], items: [], size: 0 }; packs.push(cur); }
          cur.parts.push(u8); cur.items.push([x.k, u8.length]); cur.size += u8.length;
        });
      }, Promise.resolve()).then(function () {
        var index = JSON.stringify({ voice: 'Gemini ' + voice, packs: packs.map(function (pk) { return { f: pk.f, items: pk.items }; }) });
        var zips = [], z = null, zsize = 0;
        packs.forEach(function (pk) { if (!z || zsize + pk.size > 24000000) { z = new window.JSZip(); zips.push(z); zsize = 0; } z.file('voice/' + pk.f, new Blob(pk.parts)); zsize += pk.size; });
        var last = new window.JSZip(); last.file('voice/index.json', index); zips.push(last);
        return zips.reduce(function (p, zz, i) {
          return p.then(function () { return zz.generateAsync({ type: 'blob', compression: 'STORE' }); }).then(function (blob) {
            var a = document.createElement('a'), name = 'giong-gemini-' + (i + 1) + '-tren-' + zips.length + (i === zips.length - 1 ? '-CUOI-index' : '') + '.zip';
            a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
            return new Promise(function (ok) { setTimeout(ok, 900); });
          });
        }, Promise.resolve()).then(function () { G.msg = '✅ Đã tải ' + zips.length + ' file zip (' + packs.length + ' gói giọng, ' + (list.length - miss) + ' câu' + (miss ? ', còn ' + miss + ' câu chưa tạo' : '') + '). Đưa lên GitHub theo thứ tự 1 → ' + zips.length + ' (file CUỐI có index.json, tải lên sau cùng).'; draw(); });
      });
    }).catch(function (e) { G.msg = 'Lỗi đóng gói: ' + (e.message || e); draw(); });
  }

  /* ---------- đưa lên app (GitHub) ---------- */
  var GHS = { ok: null, why: '' };
  function ghPost(body) { body.token = token(); return fetch('api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.detail || j.error || ('HTTP ' + r.status)); return j; }); }); }
  function ghCheck() { return ghPost({ action: 'ghcheck' }).then(function (j) { GHS.ok = !!j.ok; GHS.why = j.why || ''; draw(); return GHS.ok; }, function (e) { GHS.ok = false; GHS.why = e.message; draw(); return false; }); }
  function toB64(u8) { return new Promise(function (ok) { var fr = new FileReader(); fr.onload = function () { ok(String(fr.result).split(',')[1]); }; fr.readAsDataURL(new Blob([u8])); }); }
  function utf8b64(s) { return toB64(new TextEncoder().encode(s)); }
  var PUB = false;
  function autoPublish() { var on = true; try { on = localStorage.getItem('ln_gem_auto') !== '0'; } catch (e) {} if (on && GHS.ok) publish(); }
  function publish() {
    if (PUB || G.run) { if (G.run) { G.msg = 'Đang thu giọng – bấm Dừng trước, hoặc đợi tự đưa lên khi dừng.'; draw(); } return; }
    PUB = true; G.pub = '⏳ Đang chuẩn bị đưa lên app…'; draw();
    var list, pubd, base, newPacks = [], files = [];
    corpus().then(function (l) { list = l; return get('meta', 'published'); }).then(function (p) {
      pubd = p || { packs: [] };
      return get('meta', 'baseIndex').then(function (b) {
        if (b) return b;
        return fetch('voice/index.json?v=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { j = j && !/^Gemini/.test(j.voice || '') ? j : null; if (j) return put('meta', 'baseIndex', j).then(function () { return j; }); return null; });
      });
    }).then(function (b) {
      base = b;
      var done = {}; pubd.packs.forEach(function (pk) { pk.items.forEach(function (it) { done[it[0]] = 1; }); });
      var cur = null, num = pubd.packs.length;
      return list.reduce(function (pr, x) {
        return pr.then(function () { if (done[x.k]) return; return get('clips', x.k).then(function (v) { var u8 = clipB(v);
          if (!u8) return;
          if (!cur || cur.size + u8.length > 1500000) { cur = { f: 'g' + ('00' + (num + newPacks.length)).slice(-3) + '.bin', parts: [], items: [], size: 0 }; newPacks.push(cur); }
          cur.parts.push(u8); cur.items.push([x.k, u8.length]); cur.size += u8.length;
        }); });
      }, Promise.resolve());
    }).then(function () {
      if (!newPacks.length) { G.pub = 'Không có câu mới cần đưa lên.'; return null; }
      return newPacks.reduce(function (pr, pk, i) {
        return pr.then(function () { G.pub = '⬆ Đang gửi gói ' + (i + 1) + '/' + newPacks.length + '…'; draw(); var all = new Uint8Array(pk.size), o = 0; pk.parts.forEach(function (u) { all.set(u, o); o += u.length; }); return toB64(all); }).then(function (b64) { return ghPost({ action: 'ghblob', data: b64 }); }).then(function (j) { files.push({ path: 'voice/' + pk.f, sha: j.sha }); });
      }, Promise.resolve()).then(function () {
        var gpacks = pubd.packs.concat(newPacks.map(function (pk) { return { f: pk.f, items: pk.items }; }));
        var have = {}; gpacks.forEach(function (pk) { pk.items.forEach(function (it) { have[it[0]] = 1; }); });
        var packs = gpacks.map(function (pk) { return { f: pk.f, items: pk.items }; });
        if (base && base.packs) base.packs.forEach(function (pk) {   // câu chưa thu giọng Puck: tạm dùng giọng cũ
          var off = 0, keep = []; pk.items.forEach(function (it) { if (!have[it[0]]) keep.push([it[0], it[1], off]); off += it[1]; });
          if (keep.length) packs.push({ f: pk.f, items: keep });
        });
        var n = gpacks.reduce(function (s, pk) { return s + pk.items.length; }, 0);
        return utf8b64(JSON.stringify({ voice: 'Gemini ' + VOICE, gemini: n, packs: packs })).then(function (b64) { G.pub = '⬆ Đang gửi danh mục giọng…'; draw(); return ghPost({ action: 'ghblob', data: b64 }); }).then(function (j) {
          files.push({ path: 'voice/index.json', sha: j.sha });
          return ghPost({ action: 'ghcommit', files: files, message: 'Giọng Puck: ' + n + ' câu' });
        }).then(function () { return put('meta', 'published', { packs: gpacks, at: Date.now() }); }).then(function () { G.pub = '✅ Đã đưa lên app ' + n + ' câu giọng Puck. Khoảng 1–2 phút nữa Vercel cập nhật xong, các bé tải lại trang là nghe giọng mới.'; G.pubN = n; });
      });
    }).catch(function (e) { G.pub = '❌ Chưa đưa lên được: ' + (e.message || e); }).then(function () { PUB = false; draw(); });
  }

  /* ---------- giao diện (gọn) ---------- */
  function draw() {
    var el = document.getElementById('gm-st'); if (!el) return;
    var pct = G.total ? Math.floor(G.done * 100 / G.total) : 0, used = reqToday(0);
    el.innerHTML = (G.total ? '<div class="tk-bar" style="height:12px;margin:8px 0"><i style="width:' + pct + '%"></i></div><b style="font-size:16px">Đã thu ' + G.done + ' / ' + G.total + ' câu (' + pct + '%)</b>' : '<b>Đã thu ' + G.done + ' câu</b>') +
      ' · hôm nay đã dùng <b>' + used + '</b> lượt Gemini' + (G.err ? ' · thử lại: ' + G.err : '') +
      (function () { var pm = perModel(), ex = exhausted(), bad = G.badModel || {}; var ks = Object.keys(pm); return ks.length ? '<div class="tiny muted" style="margin-top:4px">' + ks.map(function (m) { return esc(m.replace(/^gemini-/, '').replace(/-tts$/, '')) + ': ' + pm[m] + (ex[m] ? ' (hết lượt hôm nay)' : bad[m] ? ' (không dùng được)' : ''); }).join(' · ') + '</div>' : ''; })() +
      '<div style="margin-top:6px">' + esc(G.msg) + '</div>' + (G.pub ? '<div style="margin-top:6px">' + esc(G.pub) + '</div>' : '');
    var b1 = document.getElementById('gm-start'); if (b1) { b1.disabled = G.run; b1.textContent = G.run ? '🎙 Đang thu…' : (G.done ? '🎙 Thu tiếp giọng Puck' : '🎙 Bắt đầu thu giọng Puck'); }
    var gb = document.getElementById('gm-gh');
    if (gb) gb.innerHTML = GHS.ok === null ? '' : GHS.ok ? '✅ Đã nối với GitHub: giọng mới tự đưa lên app.' :
      '<div class="note" style="margin-top:8px"><b>Chưa nối được GitHub</b> nên chưa tự đưa giọng lên app' + (GHS.why && GHS.why !== 'notoken' ? ' (' + esc(GHS.why) + ')' : '') + '. Làm 1 lần: tạo khoá GitHub rồi thêm vào Vercel tên <code>GITHUB_TOKEN</code> (xem hướng dẫn em gửi). Trong lúc chờ có thể bấm «Tải file zip» để tự đưa lên.</div>';
  }
  LN.gemCard = function () {
    var auto = true; try { auto = localStorage.getItem('ln_gem_auto') !== '0'; } catch (e) {}
    return '<div class="card" style="margin-bottom:16px;border:2px solid var(--pink,#FF5C9A)"><h2>🔊 Giọng đọc của app: Puck (Gemini)</h2>' +
      '<p class="small muted" style="margin:4px 0 10px">Bấm <b>Thu giọng</b> rồi để trang mở (không tắt máy, không cho máy ngủ). Mỗi mẫu Gemini cho 100 lượt/ngày; máy dùng song song các mẫu còn lượt, tất cả đều giọng Puck; hết lượt máy tự dừng và tự đưa phần đã thu lên app. Hôm sau mở trang này bấm <b>Thu tiếp</b>. Câu nào chưa thu xong, app tạm đọc bằng giọng cũ.</p>' +
      '<p style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><button class="btn btn-lg btn-pink" id="gm-start" data-act="gm-start">🎙 Thu giọng Puck</button><button class="btn" data-act="gm-stop">⏸ Dừng</button><button class="btn btn-mint" data-act="gm-pub">⬆ Đưa lên app ngay</button>' +
      '<label class="small" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="gm-auto"' + (auto ? ' checked' : '') + '> Tự đưa lên app khi dừng</label></p>' +
      '<div id="gm-st" class="small"></div><div id="gm-gh" class="small"></div>' +
      '<p class="small" style="margin-top:10px"><a href="#" data-act="gm-sample">▶ Nghe thử 6 câu</a> · <a href="#" data-act="gm-listen">🔊 Nghe 5 câu vừa thu</a> · <a href="#" data-act="gm-compare">🎧 So sánh giọng các mẫu</a> · <a href="#" data-act="gm-one">🎯 Chỉ giữ 1 mẫu</a> · <a href="#" data-act="gm-export">⬇ Tải file zip (dự phòng)</a></p></div>';
  };
  /* Các câu thu trước bản 36 (không có q:2) đều bị câm do lỗi đổi tần số của lamejs → xoá để thu lại */
  function purgeOld() {
    var del = 0;
    return keys('clips').then(function (ks) { return ks.reduce(function (p, k) { return p.then(function () { return get('clips', k); }).then(function (v) { if (!v || v.q !== 2) { del++; return tx('clips', 'readwrite', function (s) { s.delete(k); }); } }); }, Promise.resolve()); })
      .then(function () { return del ? put('meta', 'published', null) : null; }).then(function () { return del; }, function () { return 0; });
  }
  LN.gemInit = function () {
    var cb = document.getElementById('gm-auto'); if (cb) cb.addEventListener('change', function () { try { localStorage.setItem('ln_gem_auto', cb.checked ? '1' : '0'); } catch (e) {} });
    if (!G.total) purgeOld().then(function (nDel) { if (nDel) G.msg = '🔧 Đã xoá ' + nDel + ' câu thu trước đây bị lỗi câm (không có tiếng). Bấm «Thu tiếp giọng Puck» để thu lại – đã sửa lỗi.'; return Promise.all([keys('clips'), corpus()]); }).then(function (r) { G.done = r[0].length; G.total = r[1].length; G.list = r[1]; if (!G.msg) G.msg = G.done ? 'Bấm «Thu tiếp giọng Puck» để làm tiếp.' : 'Chưa thu câu nào. Bấm «Bắt đầu thu giọng Puck».'; draw(); }).catch(function () {});
    ghCheck(); draw();
  };
  LN.gemClick = function (a, ev) {
    if (ev && ev.preventDefault && /gm-(sample|listen|export|compare|one)/.test(a)) ev.preventDefault();
    if (a === 'gm-start') start();
    else if (a === 'gm-stop') { G.stop = true; G.msg = 'Đang dừng sau lượt hiện tại…'; draw(); }
    else if (a === 'gm-sample') libs().then(sample);
    else if (a === 'gm-listen') listenDone();
    else if (a === 'gm-export') exportZips();
    else if (a === 'gm-pub') publish();
    else if (a === 'gm-compare') libs().then(compare);
    else if (a === 'gm-one') keepOne();
    else return false;
    return true;
  };
})();
;
(window.LN_V=window.LN_V||{})["gemgen.js"]="27e9d305";
