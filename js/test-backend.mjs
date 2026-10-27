// Pruebas del backend serverless.
// Uso local:   npm i -g vercel && vercel dev   →   node test-backend.mjs
// Producción:  BASE_URL=https://tu-app.vercel.app node test-backend.mjs
const BASE = (process.env.BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

let pass = 0, fail = 0;
const ok = (name, detail = "") => { pass++; console.log(`  \x1b[32mPASS\x1b[0m ${name} ${detail}`); };
const bad = (name, err) => { fail++; console.log(`  \x1b[31mFAIL\x1b[0m ${name} → ${err.message || err}`); };

async function get(path) {
  const t0 = Date.now();
  const r = await fetch(BASE + path, { signal: AbortSignal.timeout(20000) });
  return { status: r.status, ms: Date.now() - t0, data: await r.json().catch(() => null) };
}
const assert = (c, m) => { if (!c) throw new Error(m); };

const tests = [
  ["GET /api/product?code=3017620422003 → 200 con product_name", async () => {
    const r = await get("/api/product?code=3017620422003");
    assert(r.status === 200, "HTTP " + r.status);
    assert(r.data?.product?.product_name, "sin product_name");
    return `(${r.ms} ms)`;
  }],
  ["GET /api/product?code=0000000000000 → status:0", async () => {
    const r = await get("/api/product?code=0000000000000");
    assert(r.data?.status === 0, "sin status:0");
  }],
  ["GET /api/product?code=abc → 400 bad_code", async () => {
    const r = await get("/api/product?code=abc");
    assert(r.status === 400 && r.data?.error?.code === "bad_code", "HTTP " + r.status);
  }],
  ["GET /api/search?q=yogur&colombiaOnly=1 → products[]", async () => {
    const r = await get("/api/search?q=yogur&colombiaOnly=1&pageSize=12");
    assert(r.status === 200 && Array.isArray(r.data?.products), "HTTP " + r.status);
    return `(${r.data.products.length} de ${r.data.count})`;
  }],
  ["GET /api/category?tag=en:chocolates → products[]", async () => {
    const r = await get("/api/category?tag=en:chocolates&pageSize=12");
    assert(Array.isArray(r.data?.products), "sin products");
  }],
  ["GET /api/category?tag=%%bad%% → 400 bad_tag", async () => {
    const r = await get("/api/category?tag=%25%25bad%25%25");
    assert(r.status === 400, "HTTP " + r.status);
  }],
  ["GET /api/invima?$limit=2 → array ≤2", async () => {
    const r = await get("/api/invima?ds=uhs6-qp53&$limit=2");
    assert(r.status === 200 && Array.isArray(r.data) && r.data.length <= 2, "HTTP " + r.status);
  }],
  ["GET /api/invima con WHERE → array", async () => {
    const r = await get("/api/invima?ds=uhs6-qp53&$where=" + encodeURIComponent("upper(razon_social) like '%ALQUERIA%'") + "&$limit=3");
    assert(r.status === 200 && Array.isArray(r.data), "HTTP " + r.status);
  }],
  ["GET /api/invima sin params → 400", async () => {
    const r = await get("/api/invima?ds=uhs6-qp53");
    assert(r.status === 400, "HTTP " + r.status);
  }],
];

console.log(`\nCanastaClara API tests → ${BASE}\n`);
for (const [name, fn] of tests) {
  try { ok(name, await fn() || ""); } catch (e) { bad(name, e); }
}
console.log(`\n${pass} PASS · ${fail} FAIL\n`);
process.exit(fail ? 1 : 0);