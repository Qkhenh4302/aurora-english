/* Aurora English — lưu dữ liệu chung trên mạng (Vercel Serverless + Upstash Redis miễn phí).
   Cần biến môi trường do Vercel tự thêm khi bật Upstash Redis: KV_REST_API_URL + KV_REST_API_TOKEN
   (hoặc UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN). */
const crypto = require('crypto');
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '';
const TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const P = 'ae:';
const OWNER = 'quyenntnna', OWNER_DEF_HASH = '2f121mm50j6';
// Khoá dữ liệu chung của lớp (giáo viên ghi), dữ liệu công khai cho học sinh đọc
const SHARED = /^ln_(users|admin|teachers|class|att|fees|imports|grammar|grammar_del|grammar_v|classes|pay|charge|bank|exedit|ttsv|seed_done|seed_v|note_[a-z0-9_]{1,40}|cl_[a-z0-9_-]{1,40}|ol|olm|olt_[a-z0-9_-]{1,40})$/;
const PUBLIC = ['ln_imports', 'ln_grammar', 'ln_grammar_del', 'ln_grammar_v', 'ln_exedit', 'ln_ttsv', 'ln_ol'];

/* Gộp 3 chiều: base = bản máy đã lấy về lần trước, local = bản máy gửi lên, remote = bản đang có trên mạng.
   Hai máy sửa chỗ khác nhau thì giữ cả hai; cùng sửa một chỗ thì bản mới gửi lên thắng.
   Mảng các mục có id (ví dụ các lần đóng tiền, học sinh) được gộp theo id, xoá ở một máy vẫn được giữ là xoá. */
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const kid = (x) => (x.id != null ? 'i:' + x.id : 'u:' + x.user);
const idArr = (a) => Array.isArray(a) && a.every((x) => isObj(x) && (x.id != null || x.user != null));
function merge3(b, l, r) {
  if (same(l, b)) return r;
  if (same(r, b) || same(l, r)) return l;
  if (isObj(l) && isObj(r)) {
    const bb = isObj(b) ? b : {}, out = {}, keys = Object.keys(r).concat(Object.keys(l).filter((k) => !(k in r)));
    for (const k of keys) { const v = merge3(bb[k], l[k], r[k]); if (v !== undefined) out[k] = v; }
    return out;
  }
  if (idArr(l) && idArr(r) && (l.length || r.length) && (b == null || idArr(b))) {
    const m = (a) => { const o = {}; (a || []).forEach((x) => { o[kid(x)] = x; }); return o; };
    const B = m(b), L = m(l), R = m(r), ids = r.map(kid).concat(l.map(kid).filter((id) => !(id in R))), out = [];
    for (const id of ids) { const v = merge3(B[id], L[id], R[id]); if (v !== undefined) out.push(v); }
    return out;
  }
  return l;
}
// Chưa có bản gốc (máy cũ chưa đồng bộ theo cách mới): chỉ thêm mục chỉ máy này có, còn lại giữ bản trên mạng
function merge2(l, r) {
  if (isObj(l) && isObj(r)) { const out = Object.assign({}, r); for (const k of Object.keys(l)) out[k] = k in r ? merge2(l[k], r[k]) : l[k]; return out; }
  return r === undefined ? l : r;   // danh sách và giá trị trùng: giữ bản trên mạng   // trùng nhau: giữ bản trên mạng (máy cũ chưa có bản gốc không được ghi đè)
}

  /* Gộp tiến độ học của 2 bản (2 máy / máy và mạng): không bao giờ làm mất kết quả đã làm */
function mergeProg(a, b) {
    if (!a) return b; if (!b) return a;
    function isO(x) { return x && typeof x === 'object' && !Array.isArray(x); }
    function deep(x, y) {
      if (x === undefined) return y; if (y === undefined) return x;
      if (typeof x === 'number' && typeof y === 'number') return Math.max(x, y);
      if (typeof x === 'boolean' || typeof y === 'boolean') return !!(x || y);
      if (Array.isArray(x) && Array.isArray(y)) { if (x.length === y.length && x.length <= 4 && x.concat(y).every(function (v) { return typeof v === 'number'; })) return x.map(function (v, i) { return Math.max(v, y[i]); }); var seen = {}, out = []; x.concat(y).forEach(function (v) { var k = JSON.stringify(v); if (!seen[k]) { seen[k] = 1; out.push(v); } }); return out; }
      if (isO(x) && isO(y)) { var o = {}; Object.keys(x).concat(Object.keys(y)).forEach(function (k) { if (!(k in o)) o[k] = deep(x[k], y[k]); }); return o; }
      return y;
    }
    var m = deep(a, b);
    var lg = {}; m.log = (Array.isArray(a.log) ? a.log : []).concat(Array.isArray(b.log) ? b.log : []).filter(function (l) { var k = (l && l.t) + '|' + (l && (l.id || l.title)); if (lg[k]) return false; lg[k] = 1; return true; }).sort(function (x, y) { return (x.t || 0) - (y.t || 0); }).slice(-400);
    m.updated = Math.max(+a.updated || 0, +b.updated || 0);
    return m;
  }
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
function lhash(str) {   // giống LN.hash ở trình duyệt
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0, ch; i < str.length; i++) { ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
function strip(rec) { const r = Object.assign({}, rec); delete r.pass; return r; }

const FAILS = new Map();
function tooMany(ip, user) { const now = Date.now(), k = ip + '|' + String(user || ''), w = (FAILS.get(k) || []).filter((t) => now - t < 600000), wi = (FAILS.get(ip) || []).filter((t) => now - t < 600000); FAILS.set(k, w); FAILS.set(ip, wi); return w.length >= 8 || wi.length >= 80; }
function fail(ip, user) { const k = ip + '|' + String(user || ''); [k, ip].forEach((x) => { const w = FAILS.get(x) || []; w.push(Date.now()); FAILS.set(x, w); }); if (FAILS.size > 5000) FAILS.clear(); }

async function adminRec(user) {
  const [a, t] = await redis([['GET', P + 'k:ln_admin'], ['GET', P + 'k:ln_teachers']]);
  if (user === OWNER) { const o = J(a, null); return o && o.v === 3 && o.user === OWNER ? Object.assign({ role: 'owner' }, o) : { role: 'owner', user: OWNER, pass: OWNER_DEF_HASH, def: true }; }
  const tl = J(t, []) || []; const x = tl.filter((r) => r && r.user === user)[0];
  return x ? Object.assign({ role: 'teacher' }, x) : null;
}
async function dump() {
  const [keys, plist] = await redis([['SMEMBERS', P + 'keys'], ['SMEMBERS', P + 'plist']]);
  const out = { keys: {}, progs: {} };
  const cmds = keys.map((k) => ['GET', P + 'k:' + k]).concat(plist.map((u) => ['GET', P + 'p:' + u]));
  if (!cmds.length) return out;
  const vals = await redis(cmds);
  keys.forEach((k, i) => { out.keys[k] = noPass(k, J(vals[i], null)); });
  plist.forEach((u, i) => { const v = J(vals[keys.length + i], null); if (v) out.progs[u] = v; });
  return out;
}

// Chỉ nhận tài khoản thật (không lấy nhầm thuộc tính có sẵn của Object như __proto__, constructor…)
const own = (o, k) => !!o && typeof o === 'object' && Object.prototype.hasOwnProperty.call(o, k) && /^[a-z0-9_]{1,40}$/.test(k);
// Không gửi mã mật khẩu của chủ và giáo viên xuống trình duyệt (giáo viên khác đọc được sẽ đăng nhập thay chủ)
function noPass(k, v) {
  if (k === 'ln_admin' && v && typeof v === 'object') { const o = Object.assign({}, v); delete o.pass; return o; }
  if (k === 'ln_teachers' && Array.isArray(v)) return v.map((t) => { if (!t || typeof t !== 'object') return t; const o = Object.assign({}, t); delete o.pass; return o; });
  return v;
}
const OPS = {
  // Học sinh đăng nhập: so mã băm mật khẩu (trình duyệt tự tính), trả về hồ sơ + tiến độ
  async login(b, ip) {
    if (tooMany(ip, String(b.user||'').toLowerCase())) return [429, { error: 'Sai nhiều lần quá, đợi 10 phút rồi thử lại nhé.' }];
    const u = String(b.user || ''), [us] = await redis([['GET', P + 'k:ln_users']]); const all = J(us, {}) || {};
    const rec = own(all, u) ? all[u] : null;
    if (!rec || typeof rec !== 'object') { fail(ip, String(b.user||'').toLowerCase()); return [404, { error: 'notfound' }]; }
    if (typeof b.hash !== 'string' || !b.hash || typeof rec.pass !== 'string' || !rec.pass || (rec.pass !== b.hash && !(typeof b.hash2 === 'string' && b.hash2 && rec.pass === b.hash2))) { fail(ip, String(b.user||'').toLowerCase()); return [401, { error: 'badpass' }]; }
    const token = await newSession({ u, role: 'student' }, 120);
    const [pv] = await redis([['GET', P + 'p:' + u]]);
    return [200, { token, user: strip(rec), prog: J(pv, null) }];
  },
  async register(b, ip) {
    if (tooMany(ip, String(b.user||'').toLowerCase())) return [429, { error: 'Thử lại sau ít phút nhé.' }];
    const [us, cl] = await redis([['GET', P + 'k:ln_users'], ['GET', P + 'k:ln_class']]);
    const all = J(us, {}) || {}, klass = J(cl, {}) || {}, u = String(b.user || ''), r = b.rec || {};
    if (!klass.allowReg) return [403, { error: 'Lớp chưa mở đăng ký. Tài khoản do giáo viên cấp.' }];
    if (!/^[a-z0-9_]{3,20}$/.test(u) || !r.pass || !r.name) return [400, { error: 'Thiếu thông tin.' }];
    if (Object.prototype.hasOwnProperty.call(all, u)) return [409, { error: 'taken' }];
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
  // Đề ôn luyện: học sinh tải nội dung một đề đã giao (đề nháp không cho tải)
  async olget(b) {
    const id = String(b.id || ''); if (!/^[a-z0-9_-]{1,40}$/.test(id)) return [400, { error: 'id' }];
    const [ix, t] = await redis([['GET', P + 'k:ln_ol'], ['GET', P + 'k:ln_olt_' + id]]);
    const meta = ((J(ix, {}) || {}).tests || {})[id];
    if (!meta || meta.status !== 'giao' || meta.del) return [404, { error: 'notfound' }];
    // chỉ học sinh được giao đề (hoặc giáo viên) mới tải được đề
    const s = await session(b.token); if (!s) return [401, { error: 'session' }];
    if (s.role === 'student') {
      const [us] = await redis([['GET', P + 'k:ln_users']]); const all = J(us, {}) || {}, rec = own(all, s.u) ? all[s.u] : null;
      const ok = rec && (((meta.uh || []).indexOf(lhash('ol:' + s.u)) >= 0) || ((meta.grades || []).map(Number).indexOf(+rec.grade) >= 0));
      if (!ok) return [403, { error: 'notassigned' }];
    }
    return [200, { test: J(t, null) }];
  },
  // Học sinh xem điểm cô chấm lại (chỉ bài của chính mình)
  async olmarks(b) {
    const s = await session(b.token); if (!s || s.role !== 'student') return [401, { error: 'session' }];
    const [m] = await redis([['GET', P + 'k:ln_olm']]); const all = J(m, {}) || {}, out = {};
    Object.keys(all).forEach((id) => { if (all[id] && all[id][s.u]) out[id] = all[id][s.u]; });
    return [200, { marks: out }];
  },
  // Cô tải hình của đề lên (lưu riêng, không nằm trong nội dung đề)
  async aolimg(b) {
    const s = await session(b.token); if (!s || s.role === 'student') return [401, { error: 'session' }];
    const d = String(b.data || ''); const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+\/=]+)$/.exec(d);
    if (!m || d.length > 880000) return [400, { error: 'image' }];
    const h = crypto.createHash('sha1').update(d).digest('hex');
    await redis([['SET', P + 'oli:' + h, d]]);
    return [200, { h }];
  },
  async me(b) {
    const s = await session(b.token); if (!s || s.role !== 'student') return [401, { error: 'session' }];
    const [us, pv] = await redis([['GET', P + 'k:ln_users'], ['GET', P + 'p:' + s.u]]); const allU = J(us, {}) || {}, rec = own(allU, s.u) ? allU[s.u] : null;
    if (!rec) return [401, { error: 'gone' }];
    return [200, { user: strip(rec), prog: J(pv, null) }];
  },
  // Lưu tiến độ của học sinh (bản mới hơn thắng), kèm tóm tắt cho bảng xếp hạng
  async prog(b) {
    const s = await session(b.token); if (!s || s.role !== 'student') return [401, { error: 'session' }];
    const body = JSON.stringify({ updated: +b.updated || Date.now(), data: b.data || {} });
    if (body.length > 900000) return [413, { error: 'big' }];
    const [old, us] = await redis([['GET', P + 'p:' + s.u], ['GET', P + 'k:ln_users']]); const o = J(old, null);
    if (!own(J(us, {}) || {}, s.u)) return [404, { error: 'gone' }];   // tài khoản đã bị xoá: không ghi lại tiến độ
    const merged = mergeProg(o && o.data, b.data || {});   // gộp, không ghi đè: kết quả ở máy nào cũng được giữ
    const out = JSON.stringify({ updated: Math.max(+b.updated || 0, (o && +o.updated) || 0, Date.now()), data: merged });
    if (out.length > 900000) return [413, { error: 'big' }];
    if (o && old) await redis([['SET', P + 'pbak:' + s.u, old]]);   // giữ bản trước đó phòng khi cần khôi phục
    const sum = b.sum || {};
    await redis([['SET', P + 'p:' + s.u, out], ['SADD', P + 'plist', s.u], ['HSET', P + 'sum', s.u, JSON.stringify({ stars: Math.max(+sum.stars || 0, +(merged.stars) || 0), streak: +sum.streak || 0, prog: +sum.prog || 0, t: Date.now() })]]);
    return [200, { ok: true, prog: { data: merged } }];
  },
  async profile(b) {
    const s = await session(b.token); if (!s || s.role !== 'student') return [401, { error: 'session' }];
    const [us] = await redis([['GET', P + 'k:ln_users']]); const all = J(us, {}) || {}; if (!own(all, s.u)) return [404, { error: 'gone' }];
    if (b.name) all[s.u].name = String(b.name).slice(0, 60); if (b.mail != null) all[s.u].mail = String(b.mail).slice(0, 80);
    await redis([['SET', P + 'k:ln_users', JSON.stringify(all)]]); return [200, { ok: true }];
  },
  // Bảng xếp hạng: chỉ tên và số sao các bạn cùng lớp, không lộ thông tin khác
  async board(b) {
    const s = await session(b.token); if (!s) return [401, { error: 'session' }];
    const [us, sums] = await redis([['GET', P + 'k:ln_users'], ['HGETALL', P + 'sum']]); const all = J(us, {}) || {}, me = own(all, s.u) ? all[s.u] : {};
    const sm = {}; for (let i = 0; i < (sums || []).length; i += 2) sm[sums[i]] = J(sums[i + 1], {});
    const list = Object.keys(all).filter((u) => own(all, u) && all[u] && all[u].status !== 'stopped' && +all[u].grade === +me.grade).map((u) => ({ un: u, name: all[u].name || u, stars: (sm[u] || {}).stars || 0, streak: (sm[u] || {}).streak || 0, prog: (sm[u] || {}).prog || 0 }));
    return [200, { list }];
  },
  // Giáo viên đăng nhập: trả về toàn bộ dữ liệu lớp
  async alogin(b, ip) {
    if (tooMany(ip, String(b.user||'').toLowerCase())) return [429, { error: 'Sai nhiều lần, đợi 10 phút.' }];
    const u = String(b.user || '').toLowerCase(), rec = await adminRec(u);
    if (!rec || rec.pass !== b.hash) { fail(ip, String(b.user||'').toLowerCase()); return [401, { error: 'badpass' }]; }
    // Mật khẩu mặc định (chưa đặt riêng): chỉ được đặt mật khẩu mới, chưa xem/ghi được dữ liệu lớp
    if (rec.def) { const token = await newSession({ u, role: rec.role, boot: 1 }, 0.5); return [200, { token, role: rec.role, boot: 1, data: { keys: {}, progs: {} } }]; }
    const token = await newSession({ u, role: rec.role }, 0.5);
    return [200, { token, role: rec.role, data: await dump() }];
  },
  // Giáo viên tự đổi mật khẩu/tên của mình (không ghi được cả danh sách giáo viên)
  async apass(b, ip) {
    const s = await session(b.token); if (!s || s.role !== 'teacher') return [401, { error: 'session' }];
    if (tooMany(ip, s.u)) return [429, { error: 'Sai nhiều lần, đợi 10 phút.' }];
    const [t] = await redis([['GET', P + 'k:ln_teachers']]); const tl = J(t, []) || [];
    const x = Array.isArray(tl) ? tl.filter((r) => r && r.user === s.u)[0] : null; if (!x) return [404, { error: 'gone' }];
    if (!x.must && (typeof b.old !== 'string' || b.old !== x.pass)) { fail(ip, s.u); return [401, { error: 'badpass' }]; }
    if (typeof b.pass === 'string' && b.pass.length >= 8 && b.pass.length <= 40) x.pass = b.pass;
    if (b.name) x.name = String(b.name).slice(0, 60); x.must = false;
    await redis([['SET', P + 'k:ln_teachers', JSON.stringify(tl)], ['SADD', P + 'keys', 'ln_teachers']]);
    return [200, { ok: true }];
  },
  async adump(b) { const s = await session(b.token); if (!s || s.role === 'student') return [401, { error: 'session' }]; if (s.boot) return [200, { data: { keys: {}, progs: {} } }]; return [200, { data: await dump() }]; },
  // Giáo viên lưu một mục dữ liệu (tài khoản, điểm danh, học phí, nhận xét, tiến độ học sinh…)
  async aput(b) {
    const s = await session(b.token); if (!s || s.role === 'student') return [401, { error: 'session' }];
    const items = (Array.isArray(b.items) ? b.items.slice(0, 200) : []).filter((it) => {
      const k = String(it.k || '');
      if ((k === 'ln_admin' || k === 'ln_teachers') && s.role !== 'owner') return false;
      if (s.boot) return k === 'ln_admin' && it.v && typeof it.v === 'object' && typeof it.v.pass === 'string' && it.v.pass.length >= 8 && it.v.pass !== OWNER_DEF_HASH;
      return SHARED.test(k) || /^ln_prog_[a-z0-9_]{1,40}$/.test(k);
    });
    if (!items.length) return [200, { ok: true, n: 0, final: {} }];
    const lockKeys = items.map((it) => P + 'lock:' + it.k), lockId = tokenNew();
    for (let tries = 0; tries < 40; tries++) {   // giữ khoá các mục đang ghi (tối đa 5 giây) để 2 máy lưu cùng lúc không đè nhau
      const got = await redis(lockKeys.map((k) => ['SET', k, lockId, 'NX', 'PX', '5000']));
      const failed = lockKeys.filter((k, i) => got[i] !== 'OK');
      if (!failed.length) break;
      await redis(lockKeys.filter((k, i) => got[i] === 'OK').map((k) => ['DEL', k]));
      if (tries === 39) return [503, { error: 'busy' }];
      await new Promise((ok) => setTimeout(ok, 120 + Math.random() * 150));
    }
    try {
    const cur = await redis(items.map((it) => ['GET', SHARED.test(it.k) ? P + 'k:' + it.k : P + 'p:' + it.k.slice(8)]));
    const cmds = [], final = {};
    items.forEach((it, i) => {
      const k = String(it.k), del = it.v == null;
      if (SHARED.test(k)) {
        const remote = J(cur[i], undefined);
        if (del) { cmds.push(['DEL', P + 'k:' + k], ['SREM', P + 'keys', k]); final[k] = null; return; }
        let v = it.v;
        if (remote !== undefined && remote !== null && k !== 'ln_admin') v = ('b' in it) && it.b != null ? merge3(it.b, it.v, remote) : merge2(it.v, remote);
        if (k === 'ln_admin' && v && typeof v === 'object' && !v.pass && remote && remote.pass) v = Object.assign({}, v, { pass: remote.pass });
        if (k === 'ln_teachers' && Array.isArray(v) && Array.isArray(remote)) { const rp = {}; remote.forEach((t) => { if (t && t.user && t.pass) rp[t.user] = t.pass; }); v = v.map((t) => (t && t.user && !t.pass && rp[t.user] ? Object.assign({}, t, { pass: rp[t.user] }) : t)); }
        const str = JSON.stringify(v); if (str.length > 900000) return;
        cmds.push(['SET', P + 'k:' + k, str], ['SADD', P + 'keys', k]); final[k] = noPass(k, v);
      } else {
        const u = k.slice(8), old = J(cur[i], null);
        if (del) { cmds.push(['DEL', P + 'p:' + u], ['SREM', P + 'plist', u], ['HDEL', P + 'sum', u]); return; }
        const up = +((it.v || {}).updated) || 0, mg = mergeProg(old && old.data, it.v);   // gộp với tiến độ đang có, không làm mất
        cmds.push(['SET', P + 'p:' + u, JSON.stringify({ updated: Math.max(up, (old && +old.updated) || 0) || Date.now(), data: mg })], ['SADD', P + 'plist', u]);
      }
    });
    if (cmds.length) await redis(cmds);
    if (s.boot && final.ln_admin) await redis([['SET', P + 's:' + b.token, JSON.stringify({ u: s.u, role: s.role }), 'EX', '43200']]);   // đã đặt mật khẩu riêng → mở đầy đủ quyền
    return [200, { ok: true, n: cmds.length, final }];
    } finally { await redis(lockKeys.map((k) => ['DEL', k])).catch(() => {}); }
  }
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    const q = req.query || Object.fromEntries(new URL(req.url || '/', 'http://x').searchParams);
    if (q.olimg && /^[a-f0-9]{40}$/.test(q.olimg) && URL_ && TOK) {   // hình của đề ôn luyện
      const [d] = await redis([['GET', P + 'oli:' + q.olimg]]); const m = /^data:(image\/[a-z]+);base64,(.*)$/.exec(d || '');
      if (!m) { res.status(404).json({ error: 'notfound' }); return; }
      res.setHeader('Content-Type', m[1]); res.setHeader('Cache-Control', 'public, max-age=31536000, immutable'); res.statusCode = 200; res.end(Buffer.from(m[2], 'base64')); return;
    }
    res.status(200).json({ ok: !!(URL_ && TOK) }); return;
  }
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
