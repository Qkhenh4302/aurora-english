/* Aurora English — giọng đọc tiếng Anh, MỘT giọng duy nhất cho mọi máy (Windows, Mac, iPad, điện thoại).
   Ưu tiên Google Cloud Text-to-Speech (nhanh ~1 giây, miễn phí 1 triệu ký tự/tháng, file MP3 nhỏ):
     GOOGLE_TTS_KEY   = khoá API của Google Cloud đã bật "Cloud Text-to-Speech API"
     GOOGLE_TTS_VOICE = en-US-Chirp3-HD-Puck (mặc định — cùng giọng Puck với Gemini)
   Không có GOOGLE_TTS_KEY → dùng Gemini TTS (chậm hơn, giới hạn lượt rất thấp).
   GET /api/tts?t=<câu>&m=w|p  → audio/wav. Mỗi câu chỉ tạo một lần: lưu trong Upstash Redis + bộ nhớ đệm Vercel,
   lần sau mọi học sinh nghe ngay, không tốn lượt AI. Lỗi / hết lượt → 503, trình duyệt tự dùng giọng có sẵn. */
const crypto = require('crypto');
const KEY = process.env.GEMINI_API_KEY || '';
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const VOICE = process.env.TTS_VOICE || 'Puck';   // Puck: giọng nam trẻ, tươi vui (thử thêm: Fenrir – hào hứng)
const MODELS = (process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts,gemini-2.5-flash-tts').split(',').map((s) => s.trim()).filter(Boolean);
const STYLE = {
  /* Mô tả giọng mẫu cô gửi (video AdaptedMind / Monster Math): nhân vật quái vật hoạt hình dạy toán */
  w: 'Voice a goofy, lovable cartoon monster teacher in a kids\' math game (like the purple monster in AdaptedMind / Monster Math). Bright, fairly high, slightly nasal cartoon voice, General American accent. Very bouncy, sing-song intonation that jumps up and down, huge friendly smile, playful and super encouraging, crisp clear words, lively medium-fast pace with little playful pauses. Say exactly this:',
  p: 'Voice the same goofy, lovable cartoon monster teacher from a kids\' learning game, now reading a short story to young children. Bright, warm, fairly high cartoon voice, General American accent, expressive storytelling, a bit slower and very clear, short pause at commas and a longer pause at each full stop. Read exactly this:',
  c: 'Voice the same goofy cartoon monster teacher cheering a child who just answered. Burst with excitement and joy, bouncy sing-song, big smile, bright fairly high cartoon voice, General American accent. Say exactly this:'
};
const SV = process.env.TTS_STYLE_V || '4';   // đổi số này để tạo lại toàn bộ giọng
let BAD = 0;   // hết lượt: tạm dừng gọi AI một lúc
const GKEY = process.env.GOOGLE_TTS_KEY || (process.env.TTS_ENGINE === 'google' ? KEY : '');
/* Các giọng cô có thể chọn (trang quản trị → AI → Chọn giọng). Giọng "bé trai hoạt hình": giọng nam trẻ của Google nâng cao tông. */
const PRESETS = {
  /* "am": khớp giọng mẫu cô gửi (nhân vật quái vật tím dạy toán): tông trung bình ~270 Hz, lên xuống rất nhiều, nói nhanh vừa, rất hào hứng */
  am1:   { v: 'en-US-Neural2-H', pitch: 5, rate: { w: 1.0, p: 0.9, c: 1.1 }, name: '★ Giống video mẫu 1 – nhân vật hoạt hình vui (khuyên dùng)' },
  am2:   { v: 'en-US-Neural2-I', pitch: 13, rate: { w: 1.02, p: 0.92, c: 1.1 }, name: '★ Giống video mẫu 2 – quái vật ngộ nghĩnh (từ giọng nam)' },
  am3:   { v: 'en-US-Neural2-G', pitch: 5, rate: { w: 1.0, p: 0.9, c: 1.1 }, name: '★ Giống video mẫu 3 – tông sáng, tròn tiếng' },
  boy:   { v: 'en-US-Neural2-I', pitch: 5.5, rate: { w: 0.95, p: 0.86, c: 1.06 }, name: 'Bé trai hoạt hình (vui, rõ)' },
  boy2:  { v: 'en-US-Neural2-J', pitch: 7, rate: { w: 0.97, p: 0.88, c: 1.08 }, name: 'Bé trai tinh nghịch (tông cao hơn)' },
  boy3:  { v: 'en-US-Wavenet-I', pitch: 6, rate: { w: 0.95, p: 0.86, c: 1.06 }, name: 'Bé trai nhẹ nhàng' },
  boy4:  { v: 'en-US-Neural2-D', pitch: 8, rate: { w: 0.97, p: 0.88, c: 1.08 }, name: 'Nhân vật hoạt hình (tông rất cao)' },
  puck:  { v: 'en-US-Chirp3-HD-Puck', rate: { w: 0.92, p: 0.84, c: 1.04 }, name: 'Anh trai trẻ, vui (tự nhiên nhất)' },
  fenrir:{ v: 'en-US-Chirp3-HD-Fenrir', rate: { w: 0.92, p: 0.84, c: 1.04 }, name: 'Anh trai hào hứng' },
  gem:   { gem: 1, name: '★ Gemini – diễn y kiểu nhân vật trong video mẫu (biểu cảm nhất, nhưng chậm, ít lượt)' }
};
const DEF = process.env.TTS_PRESET && PRESETS[process.env.TTS_PRESET] ? process.env.TTS_PRESET : 'gem';
function presetOf(v) { const p = PRESETS[v] ? v : DEF; return (PRESETS[p].gem || !GKEY) ? ((KEY || GKEY) ? 'gem' : '') : p; }
const ENGINE = GKEY ? 'g' : KEY ? 'm' : '';
async function ggen(text, mode, pre) {
  const P = PRESETS[pre], url = 'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + encodeURIComponent(GKEY);
  const body = (full) => JSON.stringify({ input: { text }, voice: { languageCode: P.v.slice(0, 5), name: P.v }, audioConfig: Object.assign({ audioEncoding: 'MP3', sampleRateHertz: 24000 }, full ? { speakingRate: P.rate[mode] } : {}, full && P.pitch ? { pitch: P.pitch } : {}) });
  let r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body(1) });
  if (r.status === 400) r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body(0) });
  for (let k = 0; k < 2 && (r.status === 429 || r.status >= 500); k++) { await new Promise((ok) => setTimeout(ok, 900 * (k + 1))); r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body(1) }); }
  if (!r.ok) { const e = new Error('google ' + r.status + ' ' + (await r.text()).slice(0, 160)); e.status = r.status; throw e; }
  const j = await r.json(); if (!j.audioContent) throw new Error('google noaudio');
  return Buffer.from(j.audioContent, 'base64');
}
function idOf(text, mode, pre, gv) { return crypto.createHash('md5').update((pre === 'gem' ? SV + '|' + (gv || VOICE) : 'g2|' + pre + '|' + PRESETS[pre].v + '|' + (PRESETS[pre].pitch || 0)) + '|' + mode + '|' + String(text).replace(/\s+/g, ' ').trim().toLowerCase()).digest('hex'); }
function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
  if (typeof req.body === 'string') { try { return Promise.resolve(JSON.parse(req.body)); } catch (e) { return Promise.resolve({}); } }
  return new Promise((ok) => { let d = ''; req.on('data', (c) => { d += c; }); req.on('end', () => { try { ok(JSON.parse(d || '{}')); } catch (e) { ok({}); } }); });
}

async function redis(cmds) {
  if (!URL_ || !TOK) return cmds.map(() => null);
  const r = await fetch(URL_.replace(/\/$/, '') + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOK, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) return cmds.map(() => null);
  return (await r.json()).map((x) => (x && x.result) || null);
}
function wav(pcm, rate) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8); h.write('fmt ', 12);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
/* Giọng Gemini chạy qua Google Cloud Text-to-Speech (cùng giọng + lời mô tả, nhưng dùng khoá GOOGLE_TTS_KEY: nhiều lượt hơn hẳn) */
let CGBAD = 0;
async function cgem(text, mode) {
  const url = 'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + encodeURIComponent(GKEY);
  const prompt = STYLE[mode].replace(/\s*(Say|Read) exactly this:\s*$/, '');
  const body = JSON.stringify({ input: { prompt, text }, voice: { languageCode: 'en-US', name: VOICE, modelName: process.env.GEMINI_CLOUD_MODEL || 'gemini-2.5-flash-tts' }, audioConfig: { audioEncoding: 'MP3', sampleRateHertz: 24000 } });
  let r;
  for (let k = 0; k < 3; k++) {
    r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    if (r.ok || (r.status !== 429 && r.status < 500)) break;
    await new Promise((ok) => setTimeout(ok, 800 * (k + 1)));
  }
  if (!r.ok) { const e = new Error('cloud-gemini ' + r.status + ' ' + (await r.text()).slice(0, 160)); e.status = r.status; throw e; }
  const j = await r.json(); if (!j.audioContent) throw new Error('cloud-gemini noaudio');
  return Buffer.from(j.audioContent, 'base64');
}
async function gen(text, mode, gv) {
  let last = null;
  for (const model of MODELS) {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: STYLE[mode] + '\n' + text }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: gv || VOICE } } } } })
    });
    if (r.status === 404 || r.status === 400) { last = new Error(model + ' ' + r.status); continue; }
    if (!r.ok) { const e = new Error('tts ' + r.status); e.status = r.status; throw e; }
    const j = await r.json(), part = ((((j.candidates || [])[0] || {}).content || {}).parts || []).filter((p) => p.inlineData)[0];
    if (!part) { last = new Error('noaudio'); continue; }
    const m = /rate=(\d+)/.exec(part.inlineData.mimeType || ''), rate = m ? +m[1] : 24000;
    return wav(Buffer.from(part.inlineData.data, 'base64'), rate);
  }
  throw last || new Error('tts');
}

/* giới hạn tạo mới khi học sinh nghe câu chưa có sẵn: tối đa 60 câu / giờ / máy (tránh tốn tiền nếu bị gọi bừa) */
const HITS = new Map();
function tooMany(ip) { const now = Date.now(), w = (HITS.get(ip) || []).filter((t) => now - t < 3600000); w.push(now); HITS.set(ip, w); if (HITS.size > 5000) HITS.clear(); return w.length > 60; }
/* ===== Tạo giọng Gemini hàng loạt (chỉ cô / quản trị dùng): mỗi lượt đọc nhiều câu, nghỉ 2 giây giữa các câu ===== */
const GVOICES = ['Zephyr','Puck','Charon','Kore','Fenrir','Leda','Orus','Aoede','Callirrhoe','Autonoe','Enceladus','Iapetus','Umbriel','Algieba','Despina','Erinome','Algenib','Rasalgethi','Laomedeia','Achernar','Alnilam','Schedar','Gacrux','Pulcherrima','Achird','Zubenelgenubi','Vindemiatrix','Sadachbia','Sadaltager','Sulafat'];
const GMODELS = ['gemini-2.5-flash-preview-tts','gemini-2.5-flash-tts','gemini-3.8-flash-tts','gemini-3.8-flash-lite-tts','gemini-2.5-pro-preview-tts','gemini-2.5-pro-tts'];
const BSTYLE = {
  w: 'Voice: a warm, friendly, cheerful young American English teacher talking to young children. Clear standard American pronunciation, natural expressive intonation that rises for questions and falls for statements, relaxed medium-slow pace, never rushed.',
  p: 'Voice: a warm, friendly young American English teacher reading a short story aloud to young children. Gentle expressive storytelling, clear standard American pronunciation, slow calm pace, short pause at commas and a clear pause at each full stop.',
  c: 'Voice: a warm, friendly young American English teacher cheering a child who just answered. Bright, happy and encouraging, natural, not shouting.'
};
async function isAdmin(tok) {
  if (!tok || !/^[a-f0-9]{48}$/.test(tok)) return false;
  const [s] = await redis([['GET', 'ae:s:' + tok]]); if (!s) return false;
  try { return JSON.parse(s).role !== 'student'; } catch (e) { return false; }
}
async function gbatch(lines, mode, voice, model) {
  const n = lines.length;
  const prompt = BSTYLE[mode] + '\n\nRead the ' + n + ' lines below for an English lesson. Read every line exactly as written, in order, exactly once. Do not read line numbers, do not add or skip any words. ' +
    'After EACH line stay completely silent for two full seconds before starting the next line. Inside a line, " — " means a second person answers: make a short natural pause (about half a second) there.' +
    (n === 1 ? '' : '') + '\n\n' + lines.join('\n');
  const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } })
  });
  if (!r.ok) { const e = new Error((await r.text()).slice(0, 600)); e.status = r.status; throw e; }
  const j = await r.json(), part = ((((j.candidates || [])[0] || {}).content || {}).parts || []).filter((x) => x.inlineData)[0];
  if (!part) { const e = new Error('noaudio ' + JSON.stringify(j).slice(0, 300)); e.status = 502; throw e; }
  const m = /rate=(\d+)/.exec(part.inlineData.mimeType || ''), rate = m ? +m[1] : 24000;
  return wav(Buffer.from(part.inlineData.data, 'base64'), rate);
}
async function batchHandler(b, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (!KEY) { res.status(503).json({ error: 'nokey' }); return; }
  if (!(await isAdmin(b.token))) { res.status(401).json({ error: 'login' }); return; }
  const lines = (Array.isArray(b.lines) ? b.lines : []).map((x) => String(x || '').replace(/\s+/g, ' ').trim().slice(0, 400)).filter(Boolean).slice(0, 40);
  const mode = b.m === 'p' ? 'p' : b.m === 'c' ? 'c' : 'w', voice = GVOICES.indexOf(b.voice) >= 0 ? b.voice : 'Puck', model = GMODELS.indexOf(b.model) >= 0 ? b.model : GMODELS[0];
  if (!lines.length) { res.status(400).json({ error: 'lines' }); return; }
  try {
    const buf = await gbatch(lines, mode, voice, model);
    res.setHeader('Content-Type', 'audio/wav'); res.setHeader('X-Model', model); res.status(200).send(buf);
  } catch (e) {
    res.status(e.status === 429 ? 429 : e.status === 404 ? 404 : e.status === 400 ? 400 : 502).json({ error: e.status === 429 ? 'quota' : 'gen', status: e.status || 0, detail: String(e.message || e).slice(0, 600) });
  }
}

module.exports = async (req, res) => {
  const q = req.query || {};
  if (req.method === 'POST') {
    const b0 = await readBody(req);
    if (b0 && b0.action === 'batch') { await batchHandler(b0, res); return; }
    if (b0 && b0.action === 'key') {   // chỉ cô / quản trị đã đăng nhập: lấy khoá để máy của cô gọi Gemini trực tiếp (lượt dài, ít tốn lượt/ngày)
      res.setHeader('Cache-Control', 'no-store');
      if (!KEY) { res.status(503).json({ error: 'nokey' }); return; }
      if (!(await isAdmin(b0.token))) { res.status(401).json({ error: 'login' }); return; }
      res.status(200).json({ key: KEY }); return;
    }
    if (b0 && b0.action === 'check') { res.setHeader('Cache-Control', 'no-store'); res.status(200).json({ ok: !!KEY, admin: await isAdmin(b0.token), voices: GVOICES, models: GMODELS }); return; }
    req.body = b0;
  }
  if (req.method === 'POST') {   // tạo sẵn: cho biết câu nào chưa có giọng
    const b = await readBody(req), items = Array.isArray(b.items) ? b.items.slice(0, 200) : [];
    const pre = presetOf(b.v);
    const ids = pre ? items.map((x) => idOf(String(x.t || '').slice(0, 400), x.m === 'p' ? 'p' : x.m === 'c' ? 'c' : 'w', pre)) : [];
    const got = ids.length ? await redis([['MGET'].concat(ids.map((i) => 'ae:tts:' + i))]).then((r) => r[0] || []) : [];
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ missing: items.map((_, k) => k).filter((k) => !got[k]), engine: pre === 'gem' ? (GKEY ? 'g' : 'm') : pre ? 'g' : '', preset: pre });
    return;
  }
  const text = String(q.t || '').replace(/\s+/g, ' ').trim().slice(0, 400), mode = q.m === 'p' ? 'p' : q.m === 'c' ? 'c' : 'w';
  if (q.check) { res.setHeader('Cache-Control', 'no-store'); const pre = presetOf(q.v); res.status(200).json({ ok: !!pre, engine: pre === 'gem' ? (GKEY ? 'g' : 'm') : pre ? 'g' : '', preset: pre, def: DEF, google: !!GKEY, presets: Object.keys(PRESETS).filter((k) => GKEY || PRESETS[k].gem).map((k) => ({ id: k, name: PRESETS[k].name })), paused: Date.now() < BAD }); return; }
  if (!text) { res.status(400).json({ error: 'text' }); return; }
  if (!ENGINE) { res.setHeader('Cache-Control', 'no-store'); res.status(503).json({ error: 'nokey' }); return; }
  const pre = presetOf(q.v), gv = GVOICES.indexOf(q.gv) >= 0 ? q.gv : '';
  const id = idOf(text, mode, pre, gv), rk = 'ae:tts:' + id;
  try {
    const [hit] = await redis([['GET', rk]]);
    let buf = null, type = 'audio/wav';
    if (hit) { if (hit.slice(0, 4) === 'mp3:') { buf = Buffer.from(hit.slice(4), 'base64'); type = 'audio/mpeg'; } else buf = Buffer.from(hit, 'base64'); }
    if (!buf) {
      if (pre !== 'gem') {
        buf = await ggen(text, mode, pre); type = 'audio/mpeg';
        if (buf.length < 700000) await redis([['SET', rk, 'mp3:' + buf.toString('base64')]]);
      } else {
        let done = false;
        const ip = String((req.headers && (req.headers['x-forwarded-for'] || '')) || '').split(',')[0] || 'x';
        if (tooMany(ip)) { res.setHeader('Cache-Control', 'no-store'); res.status(429).json({ error: 'busy' }); return; }
        if (GKEY && !gv && Date.now() > CGBAD) {
          try { buf = await cgem(text, mode); type = 'audio/mpeg'; done = true; if (buf.length < 700000) await redis([['SET', rk, 'mp3:' + buf.toString('base64')]]); }
          catch (e) { if (!KEY) throw e; if (e.status === 403 || e.status === 400 || e.status === 404) CGBAD = Date.now() + 600000; }
        }
        if (!done) {
          if (Date.now() < BAD) { res.setHeader('Cache-Control', 'no-store'); res.status(503).json({ error: 'busy' }); return; }
          buf = await gen(text, mode, gv);
          if (buf.length < 700000) await redis([['SET', rk, buf.toString('base64')]]);
        }
      }
    }
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    res.status(200).send(buf);
  } catch (e) {
    if (e && e.status === 429) BAD = Date.now() + 60000;
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).json({ error: 'tts', detail: String(e && e.message || e).slice(0, 200) });
  }
};

module.exports.config = { maxDuration: 60 };
