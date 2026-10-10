/* Aurora English — lưu dữ liệu chung trên mạng (Vercel Serverless + Upstash Redis miễn phí).
   Cần biến môi trường do Vercel tự thêm khi bật Upstash Redis: KV_REST_API_URL + KV_REST_API_TOKEN
   (hoặc UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN). */
const crypto = require('crypto');
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const P = 'ae:';
const OWNER = 'quyenntnna', OWNER_DEF_HASH = '2f121mm50j6';
// Khoá dữ liệu chung của lớp (giáo viên ghi), dữ liệu công khai cho học sinh đọc
const SHARED = /^ln_(users|admin|teachers|class|att|fees|imports|grammar|grammar_del|grammar_v|note_[a-z0-9_]{1,40})$/;
const PUBLIC = ['ln_imports', 'ln_grammar', 'ln_grammar_del', 'ln_grammar_v'];

async function redis(cmds) {
  const r = await fetch(URL_.replace(/\/$/, '') + '/pipeline', { method: 'POST', headers: { Authorization: 'Bearer ' + TOK, 'Content-Type': 'application/json' }, body: JSON.stringify(cmds) });
  if (!r.ok) throw new Error('redis ' + r.status + ' ' + (await r.text()).slice(0, 200));
  const j = await r.json();
  return j.map((x) => { if (x.error) throw new Error(x.error); return x.result; });
}
const J = (s, d) => { if (s == null) return d; try { return JSON.parse(s); } catch (e) { return d; } };
const tokenNew = () => crypto.randomBytes(24).toString('hex');
async function session(tok) { if (!tok || !/^[a-f0-9]{48}$/.test(tok)) return null; const [s] = await redis([['GET', P + 's:' + tok]]); return J(s, null); }
async function newSession(data, days) { const t = tokenNew(); await redis([['SET', P + 's:' + t, JSON.stringify(data), 'EX', String(Math.round(days * 86400))]]); return t; }
function strip(rec) { const r = Object.assign({}, rec); delete r.pass; return r; }

const FAILS = new Map();
function tooMany(ip) { const now = Date.now(), w = (FAILS.get(ip) || []).filter((t) => now - t < 600000); FAILS.set(ip, w); return w.length >= 12; }
function fail(ip) { const w = FAILS.get(ip) || []; w.push(Date.now()); FAILS.set(ip, w); if (FAILS.size > 5000) FAILS.clear(); }

async function adminRec(user) {
  const [a, t] = await redis([['GET', P + 'k:ln_admin'], ['GET', P + 'k:ln_teachers']]);
  if (user === OWNER) { const o = J(a, null); return o && o.v === 3 && o.user === OWNER ? Object.assign({ role: 'owner' }, o) : { role: 'owner', user: OWNER, pass: OWNER_DEF_HASH }; }
  const tl = J(t, []) || []; const x = tl.filter((r) => r && r.user === user)[0];
  return x ? Object.assign({ role: 'teacher' }, x) : null;
}
async function dump() {
  const [keys, plist] = await redis([['SMEMBERS', P + 'keys'], ['SMEMBERS', P + 'plist']]);
  const out = { keys: {}, progs: {} };
  const cmds = keys.map((k) => ['GET', P + 'k:' + k]).concat(plist.map((u) => ['GET', P + 'p:' + u]));
  if (!cmds.length) return out;
  const vals = await redis(cmds);
  keys.forEach((k, i) => { out.keys[k] = J(vals[i], null); });
  plist.forEach((u, i) => { const v = J(vals[keys.length + i], null); if (v) out.progs[u] = v; });
  return out;
}

const OPS = {
  // Học sinh đăng nhập: so mã băm mật khẩu (trình duyệt tự tính), trả về hồ sơ + tiến độ
  async login(b, ip) {
    if (tooMany(ip)) return [429, { error: 'Sai nhiều lần quá, đợi 10 phút rồi thử lại nhé.' }];
    const u = String(b.user || ''), [us] = await redis([['GET', P + 'k:ln_users']]); const all = J(us, {}) || {};
    const rec = all[u];
    if (!rec) { fail(ip); return [404, { error: 'notfound' }]; }
    if (!b.hash || (rec.pass !== b.hash && rec.pass !== b.hash2)) { fail(ip); return [401, { error: 'badpass' }]; }
    const token = await newSession({ u, role: 'student' }, 120);
    const [pv] = await redis([['GET', P + 'p:' + u]]);
    return [200, { token, user: strip(rec), prog: J(pv, null) }];
  },
  async register(b, ip) {
    if (tooMany(ip)) return [429, { error: 'Thử lại sau ít phút nhé.' }];
    const [us, cl] = await redis([['GET', P + 'k:ln_users'], ['GET', P + 'k:ln_class']]);
    const all = J(us, {}) || {}, klass = J(cl, {}) || {}, u = String(b.user || ''), r = b.rec || {};
    if (!klass.allowReg) return [403, { error: 'Lớp chưa mở đăng ký. Tài khoản do giáo viên cấp.' }];
    if (!/^[a-z0-9_]{3,20}$/.test(u) || !r.pass || !r.name) return [400, { error: 'Thiếu thông tin.' }];
    if (all[u]) return [409, { error: 'taken' }];
    all[u] = { name: String(r.name).slice(0, 60), grade: +r.grade || 4, pass: String(r.pass).slice(0, 40), mail: String(r.mail || '').slice(0, 80), created: Date.now(), last: Date.now() };
    await redis([['SET', P + 'k:ln_users', JSON.stringify(all)], ['SADD', P + 'keys', 'ln_users']]);
    const token = await newSession({ u, role: 'student' }, 120);
    return [200, { token, user: strip(all[u]) }];
  },
  // Dữ liệu công khai: bài tập giáo viên nạp thêm, cài đặt đăng ký
  async public() {
    const vals = await redis(PUBLIC.map((k) => ['GET', P + 'k:' + k]).concat([['GET', P + 'k:ln_class']]));
    const out = {}; PUBLIC.forEach((k, i) => { if (vals[i] != null) out[k] = J(vals[i], null); });
    const kl = J(vals[PUBLIC.length], null); out.ln_class = kl ? { allowReg: !!kl.allowReg, name: kl.name || '' } : null;
    return [200, out];
  },
  async me(b) {
    const s = await session(b.token); if (!s || s.role !== 'student') return [401, { error: 'session' }];
    const [us, pv] = await redis([['GET', P + 'k:ln_users'], ['GET', P + 'p:' + s.u]]); const rec = (J(us, {}) || {})[s.u];
    if (!rec) return [401, { error: 'gone' }];
    return [200, { user: strip(rec), prog: J(pv, null) }];
  },
  // Lưu tiến độ của học sinh (bản mới hơn thắng), kèm tóm tắt cho bảng xếp hạng
  async prog(b) {
    const s = await session(b.token); if (!s || s.role !== 'student') return [401, { error: 'session' }];
    const body = JSON.stringify({ updated: +b.updated || Date.now(), data: b.data || {} });
    if (body.length > 900000) return [413, { error: 'big' }];
    const [old] = await redis([['GET', P + 'p:' + s.u]]); const o = J(old, null);
    if (o && o.updated > (+b.updated || 0)) return [200, { stale: true, prog: o }];
    const sum = b.sum || {};
    await redis([['SET', P + 'p:' + s.u, body], ['SADD', P + 'plist', s.u], ['HSET', P + 'sum', s.u, JSON.stringify({ stars: +sum.stars || 0, streak: +sum.streak || 0, prog: +sum.prog || 0, t: Date.now() })]]);
    return [200, { ok: true }];
  },
  async profile(b) {
    const s = await session(b.token); if (!s || s.role !== 'student') return [401, { error: 'session' }];
    const [us] = await redis([['GET', P + 'k:ln_users']]); const all = J(us, {}) || {}; if (!all[s.u]) return [404, { error: 'gone' }];
    if (b.name) all[s.u].name = String(b.name).slice(0, 60); if (b.mail != null) all[s.u].mail = String(b.mail).slice(0, 80);
    await redis([['SET', P + 'k:ln_users', JSON.stringify(all)]]); return [200, { ok: true }];
  },
  // Bảng xếp hạng: chỉ tên và số sao các bạn cùng lớp, không lộ thông tin khác
  async board(b) {
    const s = await session(b.token); if (!s) return [401, { error: 'session' }];
    const [us, sums] = await redis([['GET', P + 'k:ln_users'], ['HGETALL', P + 'sum']]); const all = J(us, {}) || {}, me = all[s.u] || {};
    const sm = {}; for (let i = 0; i < (sums || []).length; i += 2) sm[sums[i]] = J(sums[i + 1], {});
    const list = Object.keys(all).filter((u) => all[u].status !== 'stopped' && +all[u].grade === +me.grade).map((u) => ({ un: u, name: all[u].name || u, stars: (sm[u] || {}).stars || 0, streak: (sm[u] || {}).streak || 0, prog: (sm[u] || {}).prog || 0 }));
    return [200, { list }];
  },
  // Giáo viên đăng nhập: trả về toàn bộ dữ liệu lớp
  async alogin(b, ip) {
    if (tooMany(ip)) return [429, { error: 'Sai nhiều lần, đợi 10 phút.' }];
    const u = String(b.user || '').toLowerCase(), rec = await adminRec(u);
    if (!rec || rec.pass !== b.hash) { fail(ip); return [401, { error: 'badpass' }]; }
    const token = await newSession({ u, role: rec.role }, 0.5);
    return [200, { token, role: rec.role, data: await dump() }];
  },
  async adump(b) { const s = await session(b.token); if (!s || s.role === 'student') return [401, { error: 'session' }]; return [200, { data: await dump() }]; },
  // Giáo viên lưu một mục dữ liệu (tài khoản, điểm danh, học phí, nhận xét, tiến độ học sinh…)
  async aput(b) {
    const s = await session(b.token); if (!s || s.role === 'student') return [401, { error: 'session' }];
    const items = Array.isArray(b.items) ? b.items.slice(0, 200) : [], cmds = [];
    for (const it of items) {
      const k = String(it.k || ''), del = it.v == null, v = del ? null : JSON.stringify(it.v);
      if (v && v.length > 900000) continue;
      if ((k === 'ln_admin' || k === 'ln_teachers') && s.role !== 'owner') continue;
      if (SHARED.test(k)) { cmds.push(del ? ['DEL', P + 'k:' + k] : ['SET', P + 'k:' + k, v]); cmds.push(del ? ['SREM', P + 'keys', k] : ['SADD', P + 'keys', k]); }
      else { const m = k.match(/^ln_prog_([a-z0-9_]{1,40})$/); if (!m) continue;
        if (del) cmds.push(['DEL', P + 'p:' + m[1]], ['SREM', P + 'plist', m[1]], ['HDEL', P + 'sum', m[1]]);
        else cmds.push(['SET', P + 'p:' + m[1], JSON.stringify({ updated: +((it.v || {}).updated) || Date.now(), data: it.v })], ['SADD', P + 'plist', m[1]]); }
    }
    if (cmds.length) await redis(cmds);
    return [200, { ok: true, n: cmds.length }];
  }
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') { res.status(200).json({ ok: !!(URL_ && TOK) }); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }
  if (!URL_ || !TOK) { res.status(503).json({ error: 'nostore' }); return; }
  const origin = req.headers.origin || '', host = req.headers['x-forwarded-host'] || req.headers.host || '';
  if (origin && host && origin.replace(/^https?:\/\//, '') !== host) { res.status(403).json({ error: 'origin' }); return; }
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  const op = b && OPS[b.op]; if (!op) { res.status(400).json({ error: 'op' }); return; }
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  try { const [st, out] = await op(b, ip); res.status(st).json(out); }
  catch (e) { res.status(500).json({ error: 'server', detail: String(e && e.message || e).slice(0, 200) }); }
};
