/* Aurora English — máy chủ Trợ lý AI Chíp (Vercel Serverless Function).
   Khoá Google AI Studio đặt trong biến môi trường GEMINI_API_KEY (Vercel → Settings → Environment Variables).
   Khoá KHÔNG bao giờ gửi xuống trình duyệt; học sinh không cần nhập gì. */
const P = require('../lib/ai_prompts.js');

const HITS = new Map(); // giới hạn nhẹ theo IP (mỗi máy chủ ấm): 40 lượt / phút
function limited(ip) {
  const now = Date.now(), w = HITS.get(ip) || [];
  const recent = w.filter((t) => now - t < 60000); recent.push(now); HITS.set(ip, recent);
  if (HITS.size > 5000) HITS.clear();
  return recent.length > 40;
}
function models() {
  const m = (process.env.GEMINI_MODEL || '').split(',').map((s) => s.trim()).filter(Boolean);
  return m.length ? m.concat(P.defaultModels.filter((x) => m.indexOf(x) < 0)) : P.defaultModels;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const key = process.env.GEMINI_API_KEY || '';
  if (req.method === 'GET') { res.status(200).json({ ok: !!key, model: models()[0] }); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }
  if (!key) { res.status(503).json({ error: 'Chưa cài khoá AI (GEMINI_API_KEY) trên Vercel.' }); return; }
  // chỉ nhận yêu cầu từ chính trang web này
  const origin = req.headers.origin || '', host = req.headers['x-forwarded-host'] || req.headers.host || '';
  if (origin && host && origin.replace(/^https?:\/\//, '') !== host) { res.status(403).json({ error: 'origin' }); return; }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  if (limited(ip)) { res.status(429).json({ error: 'Chíp đang bận, em đợi một chút rồi thử lại nhé.' }); return; }
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || P.tasks.indexOf(b.task) < 0) { res.status(400).json({ error: 'task' }); return; }
  if (b.audio && (typeof b.audio.data !== 'string' || b.audio.data.length > 2500000)) { res.status(413).json({ error: 'Đoạn ghi âm quá dài.' }); return; }
  try {
    const out = await P.call(key, b.task, b, models());
    res.status(200).json(out);
  } catch (e) {
    const st = e && e.status === 429 ? 429 : 502;
    res.status(st).json({ error: st === 429 ? 'Hết lượt AI miễn phí trong phút này, thử lại sau ít phút nhé.' : 'AI chưa trả lời được.', detail: String(e && e.message || e).slice(0, 300) });
  }
};

module.exports.config = { maxDuration: 30 };
