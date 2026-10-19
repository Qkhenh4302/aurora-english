/* Aurora English — giọng đọc tiếng Anh (Gemini TTS, giọng bạn nam Mỹ vui vẻ).
   GET /api/tts?t=<câu>&m=w|p  → audio/wav. Mỗi câu chỉ tạo một lần: lưu trong Upstash Redis + bộ nhớ đệm Vercel,
   lần sau mọi học sinh nghe ngay, không tốn lượt AI. Lỗi / hết lượt → 503, trình duyệt tự dùng giọng có sẵn. */
const crypto = require('crypto');
const KEY = process.env.GEMINI_API_KEY || '';
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const VOICE = process.env.TTS_VOICE || 'Puck';   // Puck: giọng nam trẻ, tươi vui (thử thêm: Fenrir – hào hứng)
const MODELS = (process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts,gemini-2.5-flash-tts').split(',').map((s) => s.trim()).filter(Boolean);
const STYLE = {
  w: 'You are a lively animated cartoon character in a fun kids\' learning game (like the friendly characters in AdaptedMind). Read aloud in the bright, high, playful voice of an energetic 8-year-old American boy cartoon hero, super enthusiastic and smiling: big smile, bouncy expressive intonation, crisp clear standard American pronunciation, at an easy pace for 6-year-olds:',
  p: 'You are a friendly animated cartoon character in a kids\' learning game, reading a short story to young English learners. Use a bright, warm, cheerful young American boy\'s voice with expressive storytelling intonation. Read slowly and clearly in standard American English, pause briefly at commas and a little longer at the end of each sentence:',
  c: 'You are an excited animated cartoon character in a kids\' learning game cheering for a child. Say this with huge energy, joy and a big smile, in a playful young American boy\'s voice:'
};
const SV = process.env.TTS_STYLE_V || '3';   // đổi số này để tạo lại toàn bộ giọng
let BAD = 0;   // hết lượt: tạm dừng gọi AI một lúc

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
async function gen(text, mode) {
  let last = null;
  for (const model of MODELS) {
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: STYLE[mode] + '\n' + text }] }],
        generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } } } })
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

module.exports = async (req, res) => {
  const q = req.query || {}, text = String(q.t || '').replace(/\s+/g, ' ').trim().slice(0, 400), mode = q.m === 'p' ? 'p' : q.m === 'c' ? 'c' : 'w';
  if (q.check) { res.setHeader('Cache-Control', 'no-store'); res.status(200).json({ ok: !!KEY, voice: VOICE, paused: Date.now() < BAD }); return; }
  if (!text) { res.status(400).json({ error: 'text' }); return; }
  if (!KEY) { res.setHeader('Cache-Control', 'no-store'); res.status(503).json({ error: 'nokey' }); return; }
  const id = crypto.createHash('md5').update(SV + '|' + VOICE + '|' + mode + '|' + text.toLowerCase()).digest('hex'), rk = 'ae:tts:' + id;
  try {
    const [hit] = await redis([['GET', rk]]);
    let buf = hit ? Buffer.from(hit, 'base64') : null;
    if (!buf) {
      if (Date.now() < BAD) { res.setHeader('Cache-Control', 'no-store'); res.status(503).json({ error: 'busy' }); return; }
      buf = await gen(text, mode);
      if (buf.length < 700000) await redis([['SET', rk, buf.toString('base64')]]);
    }
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable');
    res.status(200).send(buf);
  } catch (e) {
    if (e && e.status === 429) BAD = Date.now() + 60000;
    res.setHeader('Cache-Control', 'no-store');
    res.status(503).json({ error: 'tts', detail: String(e && e.message || e).slice(0, 200) });
  }
};

module.exports.config = { maxDuration: 30 };
