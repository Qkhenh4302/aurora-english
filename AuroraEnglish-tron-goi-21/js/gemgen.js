/* Aurora English – Tạo giọng Gemini cho toàn bộ app (chạy trên máy của cô, trang Giọng đọc & AI)
   - Gửi máy chủ từng lượt ~12 câu, Gemini đọc liền và nghỉ 2 giây giữa các câu
   - Máy cô tự cắt từng câu, kiểm tra số câu + độ dài; sai thì tạo lại nhỏ hơn (tới từng câu một)
   - Nén MP3, lưu tiến độ trong trình duyệt (IndexedDB): tắt máy / hết lượt hôm sau bấm Tiếp tục
   - Xong: đóng gói thành các file zip < 25MB để tải lên GitHub (thư mục voice) */
(function () {
  'use strict';
  var LN = window.LN, store = LN.store;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var VOICES = [['Puck', 'Puck – nam trẻ, vui (đã nghe mẫu)'], ['Leda', 'Leda – nữ trẻ, trong trẻo'], ['Kore', 'Kore – nữ, rõ ràng'], ['Aoede', 'Aoede – nữ, nhẹ nhàng'], ['Zephyr', 'Zephyr – nữ, tươi sáng'], ['Fenrir', 'Fenrir – nam, hào hứng'], ['Charon', 'Charon – nam, ấm'], ['Orus', 'Orus – nam, chắc giọng']];
  var MODELS = ['gemini-2.5-flash-preview-tts', 'gemini-3.8-flash-tts', 'gemini-2.5-flash-tts', 'gemini-3.8-flash-lite-tts'];
  var BATCH = 40, MAXCH = 1400, PAR = 2, KBPS = 32;
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
  function tx(st, mode, fn) { return db().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction(st, mode), s = t.objectStore(st), out = fn(s); t.oncomplete = function () { ok(out && out.result !== undefined ? out.result : out); }; t.onerror = function () { no(t.error); }; }); }); }
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
  function exhausted() { var e = store.get('ln_note_gemq', null) || {}; return e.d === today() ? e.m || {} : {}; }
  function markExhausted(m) { var e = { d: today(), m: exhausted() }; e.m[m] = 1; store.set('ln_note_gemq', e); }
  function pickModel() { var ex = exhausted(), bad = G.badModel || {}; for (var i = 0; i < MODELS.length; i++) if (!ex[MODELS[i]] && !bad[MODELS[i]]) return MODELS[i]; return null; }
  function callBatch(items, voice) {
    var model = pickModel(); if (!model) return Promise.reject({ stop: 'Hôm nay đã dùng hết lượt của Gemini. Ngày mai mở trang này và bấm «Tiếp tục».' });
    G.model = model; G.req++;
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
        return { rate: m ? +m[1] : 24000, pcm: b64pcm(part.inlineData.data) };
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
      return Promise.all(segs.map(function (pcm, k) { return put('clips', items[k].k, mp3(pcm, w.rate)); })).then(function () { G.done += items.length; draw(); });
    }, function (e) {
      if (e && e.retry && (depth || 0) < 3) { G.err++; G.msg = e.msg; draw(); return new Promise(function (ok) { setTimeout(ok, 3000); }).then(function () { return doBatch(items, voice, (depth || 0) + 1); }); }
      if (e && e.retry) { items.forEach(function (x) { G.failed[x.k] = x.t; }); G.err++; G.msg = e.msg; draw(); return; }
      throw e;
    });
  }

  /* ---------- chạy ---------- */
  function start() {
    if (G.run) return;
    var voice = document.getElementById('gm-voice').value;
    G.run = true; G.stop = false; G.msg = 'Đang chuẩn bị…'; draw();
    libs().then(function () { return get('meta', 'voice'); }).then(function (v) {
      if (v && v !== voice) {
        if (!confirm('Máy này đang tạo dở giọng ' + v + '. Đổi sang ' + voice + ' sẽ xoá phần đã tạo và làm lại từ đầu. Đồng ý?')) { voice = v; document.getElementById('gm-voice').value = v; return; }
        return clear('clips');
      }
    }).then(function () { return put('meta', 'voice', voice); }).then(corpus).then(function (list) {
      G.list = list; G.total = list.length; return keys('clips');
    }).then(function (have) {
      var hv = {}; have.forEach(function (k) { hv[k] = 1; }); G.done = have.length;
      var todo = G.list.filter(function (x) { return !hv[x.k] && !G.failed[x.k]; });
      var queue = [];
      ['c', 'p', 'w'].forEach(function (m) { var arr = todo.filter(function (x) { return x.m === m; }); for (var i = 0; i < arr.length;) { var b = [], chars = 0; while (i < arr.length && b.length < BATCH && (!b.length || chars + arr[i].t.length < MAXCH)) { chars += arr[i].t.length; b.push(arr[i++]); } queue.push(b); } });
      G.msg = queue.length ? 'Đang tạo giọng ' + voice + '…' : 'Đã tạo xong tất cả câu.'; draw();
      var worker = function () {
        if (G.stop || !queue.length) return Promise.resolve();
        var b = queue.shift();
        return doBatch(b, voice, 0).then(worker, function (e) {
          if (e && e.wait) { queue.unshift(b); G.msg = e.msg; draw(); return new Promise(function (ok) { setTimeout(ok, e.wait); }).then(worker); }
          G.stop = true; queue.unshift(b); G.msg = (e && e.stop) || ('Dừng vì lỗi: ' + (e && e.message || e)); draw();
        });
      };
      var ws = []; for (var i = 0; i < PAR; i++) ws.push(worker());
      return Promise.all(ws);
    }).then(function () {
      G.run = false;
      if (!G.stop && G.done >= G.total - Object.keys(G.failed).length) G.msg = '✅ Đã tạo xong ' + G.done + ' câu' + (Object.keys(G.failed).length ? ' (' + Object.keys(G.failed).length + ' câu lỗi, bấm Tiếp tục để thử lại)' : '') + '. Bấm «Tải gói giọng» để lấy file đưa lên GitHub.';
      G.failed = G.stop ? G.failed : {};
      draw();
    }, function (e) { G.run = false; G.msg = 'Lỗi: ' + (e && (e.stop || e.message) || e); draw(); });
  }

  /* ---------- nghe thử ---------- */
  var SAMPLE = ["Hello! My name is Chip. What's your name?", 'apple', 'pencil case', 'What do you do on Mondays? — I go to school.', "Tony is seven years old. He's from Britain.", 'Great job!'];
  function playPcmList(list, rate) {
    var C = window.AudioContext || window.webkitAudioContext, ac = new C(), t = ac.currentTime + 0.1;
    list.forEach(function (pcm) { var b = ac.createBuffer(1, pcm.length, rate), d = b.getChannelData(0); for (var i = 0; i < pcm.length; i++) d[i] = pcm[i] / 32768; var s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(t); t += b.duration + 0.7; });
  }
  function sample() {
    var voice = document.getElementById('gm-voice').value, items = SAMPLE.map(function (t) { return { t: t, m: 'w' }; });
    G.msg = '⏳ Đang tạo câu mẫu giọng ' + voice + '…'; draw();
    callBatch(items, voice).then(function (w) {
      var segs = split(w.pcm, w.rate, SAMPLE);
      if (!segs) { G.msg = '⚠️ Gemini đọc mẫu nhưng chưa cắt đúng ' + SAMPLE.length + ' câu – đang phát nguyên đoạn.'; playPcmList([w.pcm], w.rate); }
      else { G.msg = '▶ Đang phát ' + segs.length + ' câu mẫu giọng ' + voice + ' (đã cắt đúng từng câu).'; playPcmList(segs, w.rate); }
      draw();
    }, function (e) { G.msg = '❌ ' + (e.stop || e.msg || e.message || e); draw(); });
  }
  function listenDone() {
    libs().then(function () { return keys('clips'); }).then(function (ks) {
      if (!ks.length) { G.msg = 'Chưa có câu nào.'; draw(); return; }
      var pick = []; for (var i = 0; i < 5; i++) pick.push(ks[Math.floor(Math.random() * ks.length)]);
      var byK = {}; (G.list || []).forEach(function (x) { byK[x.k] = x.t; });
      var C = window.AudioContext || window.webkitAudioContext, ac = new C(), t = ac.currentTime + 0.1;
      G.msg = '▶ ' + pick.map(function (k) { return '«' + (byK[k] || k) + '»'; }).join(' · '); draw();
      return pick.reduce(function (p, k) { return p.then(function () { return get('clips', k); }).then(function (u8) { return ac.decodeAudioData(u8.buffer.slice(0)); }).then(function (b) { var s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start(t); t += b.duration + 0.6; }); }, Promise.resolve());
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
        return p.then(function () { return get('clips', x.k); }).then(function (u8) {
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

  /* ---------- giao diện ---------- */
  function draw() {
    var el = document.getElementById('gm-st'); if (!el) return;
    var pct = G.total ? Math.floor(G.done * 100 / G.total) : 0;
    el.innerHTML = (G.total ? '<div class="tk-bar" style="height:10px;margin:6px 0"><i style="width:' + pct + '%"></i></div><b>' + G.done + ' / ' + G.total + ' câu (' + pct + '%)</b> · lượt gọi Gemini: ' + G.req + (G.model ? ' · mẫu: ' + esc(G.model) : '') + (G.err ? ' · lỗi tạm: ' + G.err : '') + '<br>' : '') + esc(G.msg);
    var b1 = document.getElementById('gm-start'); if (b1) b1.disabled = G.run;
  }
  LN.gemCard = function () {
    return '<div class="card" style="margin-top:16px"><h2>🎙 Tạo giọng Gemini cho cả app</h2>' +
      '<p class="small muted">Chạy trên máy này. Mỗi lượt Gemini đọc tới ' + BATCH + ' câu, máy tự cắt và kiểm tra từng câu. Tắt máy hoặc hết lượt trong ngày thì lần sau bấm <b>Tiếp tục</b>. Nên dùng Chrome hoặc Edge, để trang mở và không cho máy ngủ.</p>' +
      '<div class="two" style="align-items:end;margin:8px 0"><div class="field"><label for="gm-voice">Giọng</label><select class="sel" id="gm-voice">' + VOICES.map(function (v) { return '<option value="' + v[0] + '">' + esc(v[1]) + '</option>'; }).join('') + '</select></div>' +
      '<div><button class="btn" data-act="gm-sample">▶ Nghe thử 6 câu</button></div></div>' +
      '<p style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-pink" id="gm-start" data-act="gm-start">🎙 Bắt đầu / Tiếp tục</button><button class="btn" data-act="gm-stop">⏸ Dừng</button><button class="btn" data-act="gm-listen">🔊 Nghe 5 câu đã tạo</button><button class="btn btn-mint" data-act="gm-export">⬇ Tải gói giọng</button></p>' +
      '<div id="gm-st" class="small"></div></div>';
  };
  LN.gemInit = function () {
    get('meta', 'voice').then(function (v) { var s = document.getElementById('gm-voice'); if (s && v) s.value = v; }).catch(function () {});
    if (!G.total) keys('clips').then(function (ks) { if (ks.length) { G.done = ks.length; G.msg = 'Máy này đã tạo ' + ks.length + ' câu. Bấm «Bắt đầu / Tiếp tục» để làm tiếp.'; draw(); } }).catch(function () {});
    draw();
  };
  LN.gemClick = function (a) {
    if (a === 'gm-start') start();
    else if (a === 'gm-stop') { G.stop = true; G.msg = 'Đang dừng sau lượt hiện tại…'; draw(); }
    else if (a === 'gm-sample') libs().then(sample);
    else if (a === 'gm-listen') listenDone();
    else if (a === 'gm-export') exportZips();
    else return false;
    return true;
  };
})();
;
(window.LN_V=window.LN_V||{})["gemgen.js"]="20b160d2";
