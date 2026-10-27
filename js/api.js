/* =========================================================
   CanastaClara — capa de datos (PRODUCCIÓN)
   Pull: Open Food Facts v3/v2 + Socrata (INVIMA) vía proxy
         serverless en Vercel (Node.js) con User-Agent:
         canastaclara/1.0 (juan.gutierreztor@cun.edu.co)
   Fallback: modo "direct" llama las APIs desde el navegador
   (Chrome ignora el User-Agent personalizado; por eso el
   proxy es la vía recomendada en producción).
   Post: reportes ciudadanos (localStorage, solo este navegador)
   ========================================================= */
"use strict";

/* ---------------- Configuración ---------------- */
const API_CONFIG = {
  mode: "auto",      // "auto": proxy y si falla, directo | "proxy": solo /api/* | "direct": solo OFF/Socrata
  proxyBase: "",     // "" = mismo origen (ideal en Vercel). Si el backend vive en otro dominio: "https://x.vercel.app"
  appName: "canastaclara",
  appVersion: "1.0",
  contactEmail: "juan.gutierreztor@cun.edu.co",
  timeoutMs: 15000,
  retryDirectOnce: true,
};

const APP_UA = API_CONFIG.appName + "/" + API_CONFIG.appVersion + " (" + API_CONFIG.contactEmail + ")";

/* ---------------- Fetch base ---------------- */
class ApiError extends Error {
  constructor(message, o = {}) {
    super(message);
    this.name = "ApiError";
    this.status = o.status || 0;
    this.code = o.code || "";
    this.via = o.via || "";
  }
}

async function fetchJSON(url, { timeout = API_CONFIG.timeoutMs, headers = {} } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: Object.assign({ "Accept": "application/json" }, headers),
    });
    if (!res.ok) {
      let info = null;
      try { info = await res.json(); } catch { /* noop */ }
      throw new ApiError((info && info.error && info.error.message) || ("HTTP " + res.status), {
        status: res.status,
        code: (info && info.error && info.error.code) || "",
      });
    }
    return await res.json();
  } finally { clearTimeout(t); }
}

function proxyUrl(path, params) {
  const base = API_CONFIG.proxyBase.replace(/\/+$/, "");
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return base + path + (qs ? "?" + qs : "");
}

async function apiGet(path, params, directUrl) {
  const mode = API_CONFIG.mode;
  if (mode === "proxy") return await fetchJSON(proxyUrl(path, params));
  if (mode === "direct") return await fetchJSON(directUrl(), { headers: { "User-Agent": APP_UA } });
  // auto: intenta proxy, si falla reintenta directo
  try {
    return await fetchJSON(proxyUrl(path, params));
  } catch (e) {
    if (!API_CONFIG.retryDirectOnce) throw e;
    try {
      return await fetchJSON(directUrl(), { headers: { "User-Agent": APP_UA } });
    } catch (e2) {
      throw new ApiError("Falló el proxy (" + (e.message || e) + ") y la vía directa (" + (e2.message || e2) + ")", { via: "both" });
    }
  }
}

/* ---------------- Open Food Facts ---------------- */
const OFF_FIELDS_LIST = "code,product_name,product_name_es,brands,image_front_small_url,image_front_url,nutriscore_grade,nutriscore_score,nova_group,categories,quantity,countries_tags,ingredients_text,additives_n";
const OFF_FIELDS_FULL = OFF_FIELDS_LIST + ",nutriments,allergens_tags,additives_tags,ingredients,ingredients_text_es,ingredients_analysis_tags,ecoscore_grade,labels_tags,serving_size,completeness";

const OFF_DIRECT = {
  searchUrl(query, page, pageSize, colombiaOnly) {
    let url = "https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1"
      + "&search_terms=" + encodeURIComponent(query)
      + "&page=" + page + "&page_size=" + pageSize
      + "&fields=" + OFF_FIELDS_LIST
      + "&sort_by=unique_scans_n";
    if (colombiaOnly) url += "&tagtype_0=countries&tag_contains_0=contains&tag_0=colombia";
    return url;
  },
  categoryUrl(tag, page, pageSize, colombiaOnly) {
    let url = "https://world.openfoodfacts.org/api/v2/search"
      + "?categories_tags=" + encodeURIComponent(tag)
      + "&fields=" + OFF_FIELDS_LIST
      + "&page=" + page + "&page_size=" + pageSize
      + "&sort_by=unique_scans_n";
    if (colombiaOnly) url += "&countries_tags=en:colombia";
    return url;
  },
  productUrl(code) {
    return "https://world.openfoodfacts.org/api/v2/product/" + encodeURIComponent(code) + ".json?fields=" + OFF_FIELDS_FULL;
  },
};

const OFF = {
  /* Búsqueda de texto completo */
  async search(query, { page = 1, colombiaOnly = false, pageSize = 24 } = {}) {
    const d = await apiGet("/api/search",
      { q: query, page, pageSize, colombiaOnly: colombiaOnly ? 1 : 0 },
      () => OFF_DIRECT.searchUrl(query, page, pageSize, colombiaOnly));
    return { products: d.products || [], count: d.count || 0, page: d.page || page, pageSize: d.page_size || pageSize };
  },

  /* Explorar por categoría */
  async byCategory(tag, { page = 1, colombiaOnly = true, pageSize = 24 } = {}) {
    const d = await apiGet("/api/category",
      { tag, page, pageSize, colombiaOnly: colombiaOnly ? 1 : 0 },
      () => OFF_DIRECT.categoryUrl(tag, page, pageSize, colombiaOnly));
    return { products: d.products || [], count: d.count || 0, page, pageSize };
  },

  /* Producto por código de barras */
  async product(code) {
    const d = await apiGet("/api/product", { code }, () => OFF_DIRECT.productUrl(code));
    if (!d.product || d.status === 0) return null;
    return d.product;
  },
};

/* ---------------- Socrata / datos.gov.co (INVIMA) ---------------- */
const DS = {
  REGISTROS: "ui32-p9f2",        // RS y NSO vigentes y vencidas (Dirección de Alimentos y Bebidas)
  ESTABLECIMIENTOS: "uhs6-qp53"  // Establecimientos vigilados (concepto sanitario)
};

const INVIMA = {
  async _get(params) {
    return apiGet("/api/invima", params, () => {
      const usp = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (k !== "ds" && v != null && v !== "") usp.set(k, String(v));
      }
      return "https://www.datos.gov.co/resource/" + params.ds + ".json?" + usp.toString();
    });
  },

  async registros(texto, limit = 60) {
    const t = texto.replace(/'/g, "").toUpperCase();
    const where = "upper(nombredireccion) like '%ALIMENTOS%' AND (upper(producto) like '%" + t + "%' OR upper(titular) like '%" + t + "%')";
    return INVIMA._get({ ds: DS.REGISTROS, $where: where, $limit: limit, $order: "fechavencimiento DESC" });
  },

  async registrosPorTitular(titular, limit = 120) {
    const t = titular.replace(/'/g, "").toUpperCase();
    const where = "upper(nombredireccion) like '%ALIMENTOS%' AND upper(titular) like '%" + t + "%'";
    return INVIMA._get({ ds: DS.REGISTROS, $where: where, $limit: limit });
  },

  async establecimientos(razon, limit = 40) {
    const t = razon.replace(/'/g, "").toUpperCase();
    return INVIMA._get({ ds: DS.ESTABLECIMIENTOS, $where: "upper(razon_social) like '%" + t + "%'", $limit: limit });
  },

  async conteoRegistros(titular) {
    const t = titular.replace(/'/g, "").toUpperCase();
    return INVIMA._get({
      ds: DS.REGISTROS,
      $select: "estadoregistro, count(*) as total",
      $where: "upper(nombredireccion) like '%ALIMENTOS%' AND upper(titular) like '%" + t + "%'",
      $group: "estadoregistro",
    });
  }
};

/* ---------------- Utilidades de análisis ---------------- */
function extractAdditives(product) {
  const tags = product.additives_tags || [];
  const out = [];
  const seen = new Set();
  for (const tag of tags) {
    const code = tag.replace(/^en:/, "").toLowerCase();
    const num = code.match(/^e?(\d{3,4}[a-z]?)/);
    if (!num) continue;
    const key = "e" + num[1];
    if (seen.has(key)) continue;
    seen.add(key);
    const info = ADDITIVES[key];
    out.push({
      key,
      codigo: key.toUpperCase(),
      nombre: info ? info.nombre : code.replace(/-/g, " "),
      riesgo: info ? info.riesgo : "desconocido",
      info: info || null
    });
  }
  return out;
}

function extractIngredients(product) {
  if (Array.isArray(product.ingredients) && product.ingredients.length) {
    return product.ingredients
      .map(i => (i.text || "").trim())
      .filter(Boolean)
      .slice(0, 60);
  }
  const txt = product.ingredients_text_es || product.ingredients_text || "";
  return txt.split(/[,;]/).map(s => s.trim().replace(/\.$/, "")).filter(s => s.length > 1).slice(0, 60);
}

function computeSellos(product) {
  const n = product.nutriments || {};
  const isLiquid = /bebida|gaseosa|jugo|leche|líquid|liquid|drink|beverage/i.test(product.categories || "");
  const result = [];
  for (const r of SELLOS_RULES) {
    let val = n[r.nutriente];
    if (val == null) { result.push({ ...r, aplica: null }); continue; }
    if (r.factor) val = val * r.factor;
    const umbral = isLiquid
      ? (r.liquidoMg ?? r.liquidoG ?? r.liquidoKcal)
      : (r.solidoMg ?? r.solidoG ?? r.solidoKcal);
    if (umbral == null) { result.push({ ...r, aplica: null }); continue; }
    let aplica = r.min ? val > umbral : val >= umbral;
    result.push({ ...r, aplica, valor: val, unidad: r.solidoMg ? "mg" : (r.solidoKcal ? "kcal" : "g") });
  }
  const texto = ((product.ingredients_text || "") + " " + (product.ingredients_text_es || "")).toLowerCase();
  const edulc = /aspartam|sucralos|stevia|estevia|acesulfam|ciclamat|sacarin|xilit|sorbit|eritrit|edulcorant/i.test(texto)
    || extractAdditives(product).some(a => ["e950","e951","e952","e954","e955","e960","e967","e420","e421"].includes(a.key));
  const cafeina = /cafe[ií]na|caffeine|café taurina|taurina|guaraná|guarana/i.test(texto) || (n.caffeine_100g || 0) > 0;
  result.push({ id:"edulcorantes", sello:"CONTIENE EDULCORANTES", aplica: edulc, unidad:"", valor:null });
  result.push({ id:"cafeina", sello:"CONTIENE CAFEÍNA", aplica: cafeina, unidad:"", valor:null, extra:"Evitar en niños" });
  return result;
}

function companyScore(establecimientos, conteo) {
  let score = 60;
  const conceptos = [];
  for (const e of establecimientos || []) {
    const c = (e.concepto_sanitario_vigente || "").toUpperCase();
    if (!c) continue;
    conceptos.push(c);
    if (c.includes("DESFAVORABLE")) score -= 35;
    else if (c.includes("CONDICIONAD") || c.includes("REQUERIMIENTO")) score -= 15;
    else if (c.includes("FAVORABLE")) score += 12;
  }
  let vigentes = 0, vencidos = 0, cancelados = 0;
  for (const row of conteo || []) {
    const st = (row.estadoregistro || "").toUpperCase();
    const n = parseInt(row.total, 10) || 0;
    if (st.includes("VIGENTE")) vigentes += n;
    else if (st.includes("VENCIDO")) vencidos += n;
    else if (st.includes("CANCEL") || st.includes("SUSPEND")) cancelados += n;
  }
  if (vigentes > 0) score += Math.min(15, vigentes / 4);
  score -= cancelados * 10;
  if (vencidos > vigentes * 2 && vigentes < 3) score -= 12;
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { score, conceptos, vigentes, vencidos, cancelados };
}

function scoreToRating(score, hasData) {
  if (!hasData) return { cls:"rating-sin-datos", label:"SIN DATOS INVIMA", desc:"No se encontraron establecimientos ni registros asociados en datos abiertos." };
  if (score >= 80) return { cls:"rating-favorable", label:"CONFIABLE", desc:"Conceptos sanitarios favorables y registros vigentes en el INVIMA." };
  if (score >= 55) return { cls:"rating-condicionado", label:"OBSERVACIÓN", desc:"Hallazgos parciales o registros mixtos; conviene revisar el detalle." };
  return { cls:"rating-desfavorable", label:"PRECAUCIÓN", desc:"Conceptos desfavorables o registros cancelados/vencidos predominantes." };
}

/* ---------------- Reportes ciudadanos (localStorage) ---------------- */
const REPORTS_KEY = "canastaclara_reportes_v1";
const Reports = {
  all() {
    try { return JSON.parse(localStorage.getItem(REPORTS_KEY) || "[]"); }
    catch { return []; }
  },
  add(rep) {
    const list = Reports.all();
    rep.id = Date.now().toString(36);
    rep.fecha = new Date().toISOString().slice(0, 10);
    list.unshift(rep);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(list));
    return rep;
  },
  remove(id) {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(Reports.all().filter(r => r.id !== id)));
  },
  forCompany(name) {
    const t = name.toUpperCase();
    return Reports.all().filter(r => (r.empresa || "").toUpperCase().includes(t));
  },
  exportJSON() {
    const blob = new Blob([JSON.stringify(Reports.all(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "canastaclara_reportes.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }
};

/* Comparador en memoria de sesión */
const CompareStore = { a: null, b: null };

/* ---------------- Helpers de formato ---------------- */
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const fmt = (v, d = 1) => (v == null || isNaN(v)) ? "—" : Number(v).toFixed(d).replace(/\.0$/, "");
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("show"), 2600);
}