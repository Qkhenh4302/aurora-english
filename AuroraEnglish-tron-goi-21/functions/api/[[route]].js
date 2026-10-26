/* Aurora English — chạy 3 máy chủ cũ (api/data, api/ai, api/tts viết cho Vercel) trên Cloudflare Pages Functions.
   Lớp chuyển đổi này giả lập req/res kiểu Vercel nên mã máy chủ (dữ liệu lớp, học phí…) giữ nguyên, không sửa. */
const LOAD = { data: () => import('../../api/data.js'), ai: () => import('../../api/ai.js'), tts: () => import('../../api/tts.js') };
const CACHE = {};

export async function onRequest(ctx) {
  const { request, env } = ctx;
  const url = new URL(request.url);
  const name = url.pathname.replace(/^\/api\//, '').replace(/\.js$/, '').split('/')[0];
  if (!LOAD[name]) return new Response('{"error":"notfound"}', { status: 404, headers: { 'Content-Type': 'application/json' } });
  // biến môi trường Cloudflare → process.env (các máy chủ cũ đọc khoá từ đây)
  if (!globalThis.process) globalThis.process = { env: {} };
  if (!process.env) process.env = {};
  for (const k in env) if (typeof env[k] === 'string') process.env[k] = env[k];
  let mod;
  try { mod = CACHE[name] || (CACHE[name] = await LOAD[name]()); }
  catch (e) { return new Response(JSON.stringify({ error: 'load', detail: String(e && e.message || e).slice(0, 300) }), { status: 500, headers: { 'Content-Type': 'application/json' } }); }
  const handler = typeof mod === 'function' ? mod : (typeof mod.default === 'function' ? mod.default : mod.default && mod.default.default);
  const headers = {};
  request.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
  headers['x-forwarded-for'] = request.headers.get('cf-connecting-ip') || headers['x-forwarded-for'] || '';
  headers['x-forwarded-host'] = url.host; headers.host = url.host;
  if (+(request.headers.get('content-length') || 0) > 4500000) return new Response('{"error":"big"}', { status: 413, headers: { 'Content-Type': 'application/json' } });   // giống giới hạn của Vercel
  let body;
  if (request.method !== 'GET' && request.method !== 'HEAD') { const t = await request.text(); try { body = t ? JSON.parse(t) : undefined; } catch (e) { body = t; } }
  const req = { method: request.method, url: url.pathname + url.search, headers, query: Object.fromEntries(url.searchParams), body, on() {} };
  return await new Promise((resolve) => {
    const out = new Headers(); let done = false;
    const finish = (b) => { if (done) return; done = true; resolve(new Response(b == null || request.method === 'HEAD' ? null : b, { status: res.statusCode || 200, headers: out })); };
    const res = {
      statusCode: 200,
      status(c) { res.statusCode = c; return res; },
      setHeader(k, v) { out.set(k, String(v)); return res; },
      getHeader(k) { return out.get(k); },
      json(o) { if (!out.has('Content-Type')) out.set('Content-Type', 'application/json; charset=utf-8'); finish(JSON.stringify(o)); return res; },
      send(b) { if (b != null && typeof b === 'object' && !(b instanceof Uint8Array) && !(b instanceof ArrayBuffer)) return res.json(b); finish(b); return res; },
      end(b) { finish(b); return res; },
      write() { return true; }
    };
    Promise.resolve().then(() => handler(req, res)).then(() => { if (!done) finish(null); }, (e) => {
      if (done) return; res.statusCode = 500; out.set('Content-Type', 'application/json'); finish(JSON.stringify({ error: 'server', detail: String(e && e.message || e).slice(0, 200) }));
    });
  });
}
