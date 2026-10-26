// 我的居酒屋：雲端同步存檔站（Cloudflare Worker + KV）
// 需要一個 KV 綁定，變數名稱必須是 SAVES（全大寫）
export default {
  async fetch(req, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (!env.SAVES) return new Response('KV 還沒綁定：請在 Settings → Bindings 加一個名稱為 SAVES 的 KV namespace', { status: 500, headers: cors });
    const url = new URL(req.url);
    const m = url.pathname.match(/^\/save\/([A-Za-z0-9]{16,40})$/);
    if (!m) return new Response('izakaya sync ok', { headers: cors });
    const key = 'save:' + m[1];
    if (req.method === 'GET') {
      const v = await env.SAVES.get(key);
      if (!v) return new Response('not found', { status: 404, headers: cors });
      return new Response(v, { headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    }
    if (req.method === 'PUT') {
      const body = await req.text();
      if (body.length > 2000000) return new Response('too big', { status: 413, headers: cors });
      let o;
      try { o = JSON.parse(body); } catch (e) { return new Response('bad json', { status: 400, headers: cors }); }
      if (!o || !o.save || !o.savedAt) return new Response('bad request', { status: 400, headers: cors });
      await env.SAVES.put(key, body);
      return new Response('ok', { headers: cors });
    }
    return new Response('method not allowed', { status: 405, headers: cors });
  },
};
