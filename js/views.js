/* =========================================================
   CanastaClara — vistas (SPA con hash routing)
   ========================================================= */
"use strict";

const Views = {};

/* ---------- componentes compartidos ---------- */
function nutriscoreBadge(g) {
  if (!g) return '<span class="badge na">Nutri-Score ?</span>';
  return `<span class="badge ${g.toLowerCase()}">Nutri-Score ${g.toUpperCase()}</span>`;
}
function novaBadge(n) {
  if (!n) return '<span class="badge na">NOVA ?</span>';
  const names = { 1:"NOVA 1 · Mínimo", 2:"NOVA 2 · Ingrediente", 3:"NOVA 3 · Procesado", 4:"NOVA 4 · Ultraprocesado" };
  return `<span class="badge nova n${n}">${names[n] || "NOVA " + n}</span>`;
}
function productCard(p) {
  const img = p.image_front_small_url
    ? `<img src="${esc(p.image_front_small_url)}" alt="${esc(p.product_name || "Producto")}" loading="lazy">`
    : `<span class="no-img">SIN<br>FOTO</span>`;
  return `<a class="pcard" href="#/producto/${esc(p.code)}">
    <div class="pcard-img">${img}</div>
    <div class="pcard-name">${esc(p.product_name || "Sin nombre")}</div>
    <div class="pcard-brand">${esc(p.brands || "Marca no registrada")}${p.quantity ? " · " + esc(p.quantity) : ""}</div>
    <div class="pcard-badges">${nutriscoreBadge(p.nutriscore_grade)}${novaBadge(p.nova_group)}</div>
  </a>`;
}
function skeletonCards(n = 8) {
  return `<div class="grid">${Array.from({ length: n }, () => '<div class="skeleton"></div>').join("")}</div>`;
}
function errorBox(msg, hint) {
  return `<div class="error-box"><b>Error de conexión.</b> ${esc(msg)}<br>
    <span class="muted">${esc(hint || "Verifica tu conexión a internet e inténtalo de nuevo.")}</span></div>`;
}
function emptyState(titulo, texto) {
  return `<div class="empty"><div class="ico">◎</div><h4>${esc(titulo)}</h4><p>${esc(texto)}</p></div>`;
}
function riskChip(a) {
  return `<a class="ing" href="#/componentes/${a.key}" title="${esc(RISK_LABEL[a.riesgo] || "")}">
    <span class="risk-dot risk-${a.riesgo}"></span>${esc(a.codigo)} · ${esc(a.nombre)}</a>`;
}

/* ---------- INICIO ---------- */
Views.home = async function (el) {
  el.innerHTML = `
  <section class="hero">
    <div class="hero-kicker"><span class="dot-live"></span>OBSERVATORIO CIUDADANO · COLOMBIA</div>
    <h1>Descubre qué hay <span class="hl">realmente</span> dentro de tu mercado.</h1>
    <p class="lede">Busca cualquier alimento empacado de la canasta familiar — golosinas, papas, leches, gaseosas — y cruza su composición con los registros sanitarios del INVIMA y el concepto de inspección de las empresas.</p>
    <div class="search-shell">
      <form class="search-box" id="homeSearch">
        <input type="search" name="q" placeholder="Nombre del producto, marca o código de barras…" autocomplete="off" aria-label="Buscar producto">
        <button class="btn btn-primary" type="submit">Buscar</button>
      </form>
      <div class="quick-chips" id="quickCats"><span>Explorar →</span></div>
    </div>
  </section>

  <div class="stat-strip">
    <div class="stat"><b class="c-cyan" id="statOff">…</b><span>Productos en Open Food Facts (CO)</span></div>
    <div class="stat"><b class="c-mint">RS · NSO</b><span>Registros sanitarios INVIMA consultables</span></div>
    <div class="stat"><b class="c-amber">${Object.keys(ADDITIVES).length}</b><span>Aditivos con ficha de riesgo</span></div>
    <div class="stat"><b class="c-red" id="statReports">0</b><span>Reportes ciudadanos (este navegador)</span></div>
  </div>

  <div class="section-label">Cómo funciona</div>
  <div class="dossier-grid">
    <div class="panel">
      <h3><span class="k">01 · PULL</span> Datos en vivo de dos fuentes</h3>
      <p class="muted" style="font-size:13.5px">Cada búsqueda consulta la API de <a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a> (composición, Nutri-Score, NOVA, aditivos) y los datos abiertos del <a href="https://www.datos.gov.co/d/ui32-p9f2" target="_blank" rel="noopener">INVIMA en datos.gov.co</a> (registros sanitarios RS/NSO de alimentos y conceptos de inspección de establecimientos).</p>
    </div>
    <div class="panel">
      <h3><span class="k">02 · ANÁLISIS</span> Componentes bajo la lupa</h3>
      <p class="muted" style="font-size:13.5px">Detectamos automáticamente aditivos E/INS, alérgenos y los sellos de advertencia frontal que le corresponderían al producto según la <a href="#/noticias">Resolución 2492 de 2022</a>, con fichas de riesgo basadas en evaluaciones de la EFSA y la OMS.</p>
    </div>
    <div class="panel">
      <h3><span class="k">03 · ANTECEDENTES</span> Empresas vigiladas</h3>
      <p class="muted" style="font-size:13.5px">Cruzamos la marca con los <a href="https://www.datos.gov.co/d/uhs6-qp53" target="_blank" rel="noopener">establecimientos vigilados por el INVIMA</a>: concepto sanitario vigente, registros vigentes/vencidos/cancelados y una calificación de vigilancia, con enlaces a los portales oficiales.</p>
    </div>
    <div class="panel">
      <h3><span class="k">04 · POST</span> Reportes ciudadanos</h3>
      <p class="muted" style="font-size:13.5px">¿Encontraste un producto sin registro, con etiquetado engañoso o en mal estado? <a href="#/reportar">Regístralo</a> — los reportes se guardan en tu navegador y puedes exportarlos en JSON.</p>
    </div>
  </div>`;

  const qc = document.getElementById("quickCats");
  qc.insertAdjacentHTML("beforeend", QUICK_CATEGORIES.map(c =>
    `<button class="chip" data-tag="${esc(c.tag)}">${esc(c.label)}</button>`).join(""));
  qc.addEventListener("click", e => {
    const b = e.target.closest("[data-tag]");
    if (b) location.hash = "#/buscar?cat=" + encodeURIComponent(b.dataset.tag) + "&label=" + encodeURIComponent(b.textContent);
  });
  document.getElementById("homeSearch").addEventListener("submit", e => {
    e.preventDefault();
    const q = e.target.q.value.trim();
    if (!q) return;
    location.hash = "#/buscar?q=" + encodeURIComponent(q);
  });
  document.getElementById("statReports").textContent = Reports.all().length;

  OFF.byCategory("en:snacks", { pageSize: 1 }).then(d => {
    const s = document.getElementById("statOff");
    if (s) s.textContent = d.count ? (d.count > 999 ? (d.count / 1000).toFixed(1) + "k+" : d.count) : "—";
  }).catch(() => { const s = document.getElementById("statOff"); if (s) s.textContent = "en línea"; });
};

/* ---------- BUSCAR ---------- */
Views.buscar = async function (el, params) {
  const q = params.get("q") || "";
  const cat = params.get("cat") || "";
  const label = params.get("label") || "";
  let page = parseInt(params.get("page") || "1", 10);
  const state = { colombiaOnly: params.get("co") !== "0", nutriscore: "", nova: "" };

  el.innerHTML = `
  <div class="section-label">Búsqueda de productos</div>
  <h1 class="page-title">${cat ? esc(label) : (q ? 'Resultados para “' + esc(q) + '”' : "Buscar productos")}</h1>
  <p class="page-sub">Fuente: Open Food Facts (API v2). Escribe nombre, marca o pega un código de barras de 8–13 dígitos.</p>
  <form class="search-box" id="searchForm" style="max-width:680px">
    <input type="search" name="q" value="${esc(q)}" placeholder="Ej: papas limón, leche entera, 7702001…" autocomplete="off">
    <button class="btn btn-primary" type="submit">Buscar</button>
  </form>
  <div class="filters">
    <span class="flabel">Filtros</span>
    <button class="chip ${state.colombiaOnly ? "active" : ""}" data-f="co">Solo Colombia</button>
    ${["a","b","c","d","e"].map(g => `<button class="chip" data-f="ns" data-v="${g}">Nutri ${g.toUpperCase()}</button>`).join("")}
    <button class="chip" data-f="nova" data-v="4">NOVA 4</button>
    <button class="chip" data-f="nova" data-v="1">NOVA 1</button>
  </div>
  <div id="results"><p class="muted mono" style="font-size:12px">Ingresa un término o elige una categoría del inicio.</p></div>
  <div class="pager" id="pager" hidden>
    <button class="btn btn-ghost" id="pgPrev">← Anterior</button>
    <span class="pg-info" id="pgInfo"></span>
    <button class="btn btn-ghost" id="pgNext">Siguiente →</button>
  </div>`;

  const resultsEl = document.getElementById("results");
  const pager = document.getElementById("pager");

  function applyFilters(products) {
    return products.filter(p => {
      if (state.nutriscore && (p.nutriscore_grade || "") !== state.nutriscore) return false;
      if (state.nova && String(p.nova_group || "") !== state.nova) return false;
      return true;
    });
  }

  async function run() {
    resultsEl.innerHTML = skeletonCards(8);
    pager.hidden = true;
    try {
      // Código de barras puro → ficha directa
      if (q && /^\d{8,13}$/.test(q)) {
        const p = await OFF.product(q);
        if (p) { location.hash = "#/producto/" + q; return; }
      }
      const d = cat
        ? await OFF.byCategory(cat, { page, colombiaOnly: state.colombiaOnly })
        : await OFF.search(q, { page, colombiaOnly: state.colombiaOnly });
      const list = applyFilters(d.products);
      if (!list.length) {
        resultsEl.innerHTML = emptyState("Sin resultados", "No se encontraron productos con esos filtros. Prueba quitando 'Solo Colombia' o cambiando el término.");
        return;
      }
      resultsEl.innerHTML = `<p class="mono muted" style="font-size:11.5px;margin-bottom:12px;letter-spacing:.06em">${list.length} resultados en página · ${d.count.toLocaleString("es-CO")} totales</p>
        <div class="grid">${list.map(productCard).join("")}</div>`;
      pager.hidden = d.count <= d.pageSize;
      document.getElementById("pgInfo").textContent = "PÁGINA " + page + " / " + Math.ceil(Math.min(d.count, 2400) / d.pageSize);
    } catch (err) {
      resultsEl.innerHTML = errorBox(err.message, "La API de Open Food Facts no respondió. Inténtalo en unos segundos.");
    }
  }

  document.getElementById("searchForm").addEventListener("submit", e => {
    e.preventDefault();
    const v = e.target.q.value.trim();
    location.hash = "#/buscar?q=" + encodeURIComponent(v) + (state.colombiaOnly ? "" : "&co=0");
  });
  el.querySelector(".filters").addEventListener("click", e => {
    const b = e.target.closest("[data-f]");
    if (!b) return;
    if (b.dataset.f === "co") {
      state.colombiaOnly = !state.colombiaOnly;
      b.classList.toggle("active", state.colombiaOnly);
      if (q || cat) run();
    } else if (b.dataset.f === "ns") {
      state.nutriscore = state.nutriscore === b.dataset.v ? "" : b.dataset.v;
      el.querySelectorAll('[data-f="ns"]').forEach(x => x.classList.toggle("active", x.dataset.v === state.nutriscore));
      if (q || cat) run();
    } else {
      state.nova = state.nova === b.dataset.v ? "" : b.dataset.v;
      el.querySelectorAll('[data-f="nova"]').forEach(x => x.classList.toggle("active", x.dataset.v === state.nova));
      if (q || cat) run();
    }
  });
  document.getElementById("pgPrev").addEventListener("click", () => { if (page > 1) { page--; run(); } });
  document.getElementById("pgNext").addEventListener("click", () => { page++; run(); });

  if (q || cat) await run();
};

/* ---------- FICHA DE PRODUCTO ---------- */
const NUTRI_ROWS = [
  ["energy-kcal_100g", "Energía", "kcal", 400],
  ["fat_100g", "Grasas totales", "g", 20],
  ["saturated-fat_100g", "Grasas saturadas", "g", 5],
  ["trans-fat_100g", "Grasas trans", "g", 1],
  ["carbohydrates_100g", "Carbohidratos", "g", 60],
  ["sugars_100g", "Azúcares", "g", 22.5],
  ["fiber_100g", "Fibra", "g", 6, true],
  ["proteins_100g", "Proteínas", "g", 10, true],
  ["salt_100g", "Sal", "g", 1.25],
  ["sodium_100g", "Sodio", "mg", 500, false, 1000]
];

Views.producto = async function (el, code) {
  el.innerHTML = `<div class="section-label">Ficha de producto</div>` + skeletonCards(1) +
    `<style>.skeleton{min-height:420px}</style>`;
  let p;
  try { p = await OFF.product(code); }
  catch (err) { el.innerHTML = errorBox(err.message); return; }
  if (!p) {
    el.innerHTML = `<div class="section-label">Ficha de producto</div>` +
      emptyState("Producto no encontrado", "El código " + code + " no existe en Open Food Facts. Puedes agregarlo en co.openfoodfacts.org para ayudar a la comunidad.") +
      `<p style="margin-top:16px"><a class="btn btn-ghost" href="#/buscar">← Volver a buscar</a></p>`;
    return;
  }

  const n = p.nutriments || {};
  const additives = extractAdditives(p);
  const ingredients = extractIngredients(p);
  const sellos = computeSellos(p);
  const allergens = (p.allergens_tags || []).map(a => a.replace(/^en:/, "").replace(/-/g, " "));
  const brand = (p.brands || "").split(",")[0].trim();

  const sellosHTML = sellos.map(s => {
    if (s.aplica === null) return "";
    return `<div class="sello ${s.aplica ? "" : "off"}" title="${s.aplica ? "Aplica según umbrales aproximados Res. 2492/2022" : "No aplica con estos nutrientes"}">
      ${s.aplica ? esc(s.sello) : "SIN EXCESO"}
      <small>${s.aplica ? (s.extra || (s.valor != null && s.unidad ? fmt(s.valor) + " " + s.unidad + "/100" : "")) : ""}</small></div>`;
  }).join("");

  const nutriRows = NUTRI_ROWS.map(([key, label, un, ref, good, factor]) => {
    let v = n[key];
    if (v == null) return `<tr><td>${label}</td><td class="num muted">—</td><td></td></tr>`;
    if (factor) v = v * factor;
    const pct = Math.min(100, (v / ref) * 100);
    const over = !good && v >= ref;
    return `<tr class="${over ? "row-flag" : ""}"><td>${label}</td>
      <td class="num">${fmt(v)} ${un}</td>
      <td><div class="nbar"><i style="width:${pct}%;background:${good ? "var(--mint)" : (over ? "var(--red)" : "var(--cyan)")}"></i></div></td></tr>`;
  }).join("");

  el.innerHTML = `
  <div class="section-label">Ficha de producto · OFF ${esc(code)}</div>
  <div class="dossier-head">
    <div class="dossier-img">${p.image_front_url ? `<img src="${esc(p.image_front_url)}" alt="${esc(p.product_name || "")}">` : `<span class="muted mono" style="font-size:11px">SIN IMAGEN DISPONIBLE</span>`}</div>
    <div class="dossier-title">
      <h2>${esc(p.product_name || "Producto sin nombre")}</h2>
      <div class="dossier-meta">
        <span>MARCA · ${esc(brand || "no registrada")}</span>
        <span>PRESENTACIÓN · ${esc(p.quantity || "—")}</span>
        <span>PORCIÓN · ${esc(p.serving_size || "—")}</span>
      </div>
      <div class="pcard-badges" style="margin-top:12px">
        ${nutriscoreBadge(p.nutriscore_grade)}${novaBadge(p.nova_group)}
        <span class="badge src">Fuente: Open Food Facts</span>
        ${(p.countries_tags || []).some(t => t.includes("colombia")) ? '<span class="badge ok">Reportado en Colombia</span>' : ""}
      </div>
      ${allergens.length ? `<p style="margin-top:12px;font-size:13px"><span class="badge danger">Alérgenos</span> <span class="muted">${esc(allergens.join(", "))}</span></p>` : ""}
      <div class="dossier-actions">
        <button class="btn btn-ghost" id="btnCompare">＋ Comparar</button>
        <a class="btn btn-amber" href="#/reportar?producto=${encodeURIComponent(p.product_name || "")}&marca=${encodeURIComponent(brand)}">Reportar hallazgo</a>
        <a class="btn btn-ghost" href="https://world.openfoodfacts.org/product/${esc(code)}" target="_blank" rel="noopener">Ver en OFF ↗</a>
      </div>
    </div>
  </div>

  <div class="dossier-grid">
    <div class="panel span2">
      <h3><span class="k">SELLOS FRONTALES</span> Resolución 2492 de 2022 (aproximación educativa)</h3>
      <div class="sellos">${sellosHTML || '<span class="muted">Sin datos de nutrientes suficientes.</span>'}</div>
      <p class="muted" style="font-size:11.5px;margin-top:12px">Cálculo orientativo a partir de nutrientes por 100 g/ml reportados en Open Food Facts. El sello oficial lo define el fabricante según la norma.</p>
    </div>

    <div class="panel">
      <h3><span class="k">NUTRIENTES</span> por 100 g / 100 ml</h3>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Nutriente</th><th class="num">Valor</th><th style="width:34%">Nivel</th></tr></thead>
        <tbody>${nutriRows}</tbody></table></div>
    </div>

    <div class="panel">
      <h3><span class="k">ADITIVOS</span> ${additives.length} detectados</h3>
      ${additives.length
        ? `<div class="ing-list">${additives.map(riskChip).join("")}</div>
           <p class="muted" style="font-size:11.5px;margin-top:12px">Toca cada aditivo para ver su ficha de riesgo y la fuente científica.</p>`
        : `<p class="muted">Sin aditivos declarados en la ficha (o faltan datos de ingredientes).</p>`}
    </div>

    <div class="panel span2">
      <h3><span class="k">INGREDIENTES</span> ${ingredients.length} componentes</h3>
      ${ingredients.length
        ? `<div class="ing-list">${ingredients.map(i => `<span class="ing">${esc(i)}</span>`).join("")}</div>`
        : `<p class="muted">Lista de ingredientes no disponible para este producto.</p>`}
      ${p.ingredients_text ? `<details style="margin-top:14px"><summary class="mono muted" style="font-size:11px;letter-spacing:.1em;cursor:pointer">TEXTO ORIGINAL DE LA ETIQUETA</summary><p style="font-size:13px;margin-top:8px;color:var(--muted)">${esc(p.ingredients_text)}</p></details>` : ""}
    </div>

    <div class="panel span2" id="invimaPanel">
      <h3><span class="k">INVIMA</span> Registros sanitarios de alimentos relacionados</h3>
      <div class="skeleton" style="min-height:90px"></div>
    </div>

    <div class="panel span2" id="companyPanel">
      <h3><span class="k">EMPRESA</span> Antecedentes del titular</h3>
      <div class="skeleton" style="min-height:90px"></div>
    </div>
  </div>`;

  document.getElementById("btnCompare").addEventListener("click", () => {
    if (!CompareStore.a) { CompareStore.a = p; toast("Producto 1 guardado — elige el segundo"); location.hash = "#/comparar"; }
    else if (CompareStore.a.code === p.code) { toast("Ya es el producto 1"); location.hash = "#/comparar"; }
    else { CompareStore.b = p; location.hash = "#/comparar"; }
  });

  // ---- Pull INVIMA: registros por marca/titular ----
  const invimaPanel = document.getElementById("invimaPanel");
  const companyPanel = document.getElementById("companyPanel");
  if (brand) {
    INVIMA.registros(brand, 40).then(rows => {
      if (!Array.isArray(rows) || !rows.length) {
        invimaPanel.innerHTML = `<h3><span class="k">INVIMA</span> Registros sanitarios relacionados</h3>
          <div class="notice">No se hallaron registros RS/NSO de alimentos que coincidan con “${esc(brand)}” en el dataset abierto del INVIMA. Esto puede deberse a diferencias de razón social; verifica en el portal oficial.</div>
          <div class="ext-links"><a class="ext-link" href="https://www.invima.gov.co" target="_blank" rel="noopener">Consulta INVIMA ↗</a>
          <a class="ext-link" href="https://www.datos.gov.co/d/ui32-p9f2" target="_blank" rel="noopener">Dataset RS/NSO ↗</a></div>`;
        renderCompany(brand, [], []);
        return;
      }
      const vigentes = rows.filter(r => /vigente/i.test(r.estadoregistro || ""));
      invimaPanel.innerHTML = `<h3><span class="k">INVIMA</span> ${rows.length} registros sanitarios (${vigentes.length} vigentes)</h3>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Producto</th><th>Registro</th><th>Estado</th><th>Titular</th><th>Vence</th></tr></thead>
          <tbody>${rows.slice(0, 15).map(r => `<tr>
            <td style="max-width:280px">${esc(cap((r.producto || "").toLowerCase()))}</td>
            <td class="mono" style="font-size:11.5px">${esc(r.rsynso || "—")}</td>
            <td>${/vigente/i.test(r.estadoregistro || "") ? '<span class="badge ok">Vigente</span>' : '<span class="badge danger">' + esc(r.estadoregistro || "?") + "</span>"}</td>
            <td style="font-size:12px">${esc(r.titular || "—")}</td>
            <td class="mono" style="font-size:11.5px">${esc((r.fechavencimiento || "").slice(0, 10) || "—")}</td>
          </tr>`).join("")}</tbody></table></div>
        ${rows.length > 15 ? `<p class="muted mono" style="font-size:11px;margin-top:10px">Mostrando 15 de ${rows.length}. Refina en <a href="#/empresas?q=${encodeURIComponent(brand)}">Empresas</a>.</p>` : ""}
        <p class="muted" style="font-size:11.5px;margin-top:10px">Fuente: datos.gov.co · dataset <a href="https://www.datos.gov.co/d/ui32-p9f2" target="_blank" rel="noopener">RS y NSO vigentes y vencidos</a> (actualización mensual).</p>`;
      const titular = rows[0].titular || brand;
      Promise.all([
        INVIMA.establecimientos(titular.split(" ")[0]).catch(() => []),
        INVIMA.conteoRegistros(titular).catch(() => [])
      ]).then(([ests, conteo]) => renderCompany(titular, ests, conteo));
    }).catch(err => {
      invimaPanel.innerHTML = `<h3><span class="k">INVIMA</span> Registros sanitarios</h3>` +
        errorBox(err.message, "No fue posible consultar datos.gov.co desde tu navegador (puede ser un bloqueo de red o CORS puntual).");
      renderCompany(brand, [], []);
    });
  } else {
    invimaPanel.innerHTML = `<h3><span class="k">INVIMA</span> Registros sanitarios</h3><p class="muted">El producto no tiene marca registrada en Open Food Facts; no es posible cruzar con el INVIMA.</p>`;
    companyPanel.innerHTML = `<h3><span class="k">EMPRESA</span> Antecedentes</h3><p class="muted">Sin marca asociada.</p>`;
  }

  function renderCompany(nombre, ests, conteo) {
    const { score } = companyScore(ests, conteo);
    const rating = scoreToRating(score, (ests && ests.length) || (conteo && conteo.length));
    const reports = Reports.forCompany(nombre);
    companyPanel.innerHTML = `<h3><span class="k">EMPRESA</span> ${esc(nombre)}</h3>
      <div class="rating-badge ${rating.cls}"><span class="dot"></span>${rating.label} · ${ests.length || conteo.length ? score + "/100" : "N/D"}</div>
      <p class="muted" style="font-size:13px;margin-top:10px">${rating.desc}</p>
      ${reports.length ? `<p style="margin-top:10px"><span class="badge warn">${reports.length} reporte(s) ciudadano(s) en este navegador</span></p>` : ""}
      <div class="ext-links">
        <a class="ext-link" href="#/empresas?q=${encodeURIComponent(nombre)}">Ficha completa y registros →</a>
        <a class="ext-link" href="https://www.invima.gov.co" target="_blank" rel="noopener">INVIMA ↗</a>
        <a class="ext-link" href="https://www.sic.gov.co/tema/proteccion-del-consumidor" target="_blank" rel="noopener">Reclamos SIC ↗</a>
      </div>`;
  }
};

/* ---------- COMPONENTES (enciclopedia de aditivos) ---------- */
Views.componentes = async function (el, key) {
  if (key) {
    const a = ADDITIVES[key.toLowerCase()];
    if (!a) {
      el.innerHTML = `<div class="section-label">Componente</div>` +
        emptyState("Sin ficha curada", "Este código no está en nuestra base curada de aditivos frecuentes. Consulta la evaluación oficial en la EFSA.") +
        `<div class="ext-links" style="margin-top:14px"><a class="ext-link" href="https://www.efsa.europa.eu/en/topics/topic/food-additives" target="_blank" rel="noopener">Base EFSA ↗</a><a class="ext-link" href="#/componentes">← Todos los componentes</a></div>`;
      return;
    }
    el.innerHTML = `
    <div class="section-label">Ficha de componente</div>
    <h1 class="page-title">${esc(key.toUpperCase())} · ${esc(a.nombre)}</h1>
    <p class="page-sub">${esc(a.funcion)}</p>
    <div class="panel">
      <div class="rating-badge ${a.riesgo === "bajo" ? "rating-favorable" : a.riesgo === "alto" ? "rating-desfavorable" : a.riesgo === "debate" ? "rating-requerimiento" : "rating-condicionado"}">
        <span class="dot"></span>${esc(RISK_LABEL[a.riesgo])}</div>
      <p style="margin-top:16px;font-size:14.5px;line-height:1.7">${esc(a.nota)}</p>
      <div class="ext-links">
        <a class="ext-link" href="${esc(a.fuente)}" target="_blank" rel="noopener">Fuente científica ↗</a>
        <a class="ext-link" href="https://world.openfoodfacts.org/cgi/search.pl?search_terms=&tagtype_0=additives&tag_contains_0=contains&tag_0=${esc(key)}&action=process" target="_blank" rel="noopener">Productos con este aditivo en OFF ↗</a>
        <a class="ext-link" href="#/componentes">← Todos los componentes</a>
      </div>
    </div>`;
    return;
  }

  el.innerHTML = `
  <div class="section-label">Investigación de componentes</div>
  <h1 class="page-title">Aditivos bajo la lupa</h1>
  <p class="page-sub">Fichas de los aditivos más frecuentes en golosinas, snacks, lácteos y bebidas de la canasta familiar, con nivel de precaución y fuente científica (EFSA / JECFA / OMS / IARC).</p>
  <form class="search-box" style="max-width:520px" id="addSearch">
    <input type="search" name="q" placeholder="Buscar por código (E211) o nombre (tartrazina)…" autocomplete="off">
    <button class="btn btn-primary" type="submit">Filtrar</button>
  </form>
  <div class="filters" id="riskFilters">
    <span class="flabel">Riesgo</span>
    ${["bajo","moderado","alto","debate"].map(r => `<button class="chip" data-r="${r}">${RISK_LABEL[r]}</button>`).join("")}
  </div>
  <div class="grid" id="addGrid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))"></div>`;

  const grid = document.getElementById("addGrid");
  let risk = "", term = "";
  function render() {
    const items = Object.entries(ADDITIVES).filter(([k, a]) => {
      if (risk && a.riesgo !== risk) return false;
      if (term && !(k.includes(term) || a.nombre.toLowerCase().includes(term) || a.funcion.toLowerCase().includes(term))) return false;
      return true;
    });
    grid.innerHTML = items.length ? items.map(([k, a]) => `
      <a class="pcard" href="#/componentes/${k}">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="mono" style="font-weight:700;color:var(--cyan)">${esc(k.toUpperCase())}</span>
          <span class="badge ${a.riesgo === "bajo" ? "ok" : a.riesgo === "alto" ? "danger" : "warn"}">${esc(RISK_LABEL[a.riesgo])}</span>
        </div>
        <div class="pcard-name">${esc(a.nombre)}</div>
        <div class="pcard-brand">${esc(a.funcion)}</div>
        <p class="muted" style="font-size:12.5px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden">${esc(a.nota)}</p>
      </a>`).join("") : emptyState("Sin coincidencias", "Prueba con otro código o nivel de riesgo.");
  }
  render();
  document.getElementById("addSearch").addEventListener("submit", e => {
    e.preventDefault(); term = e.target.q.value.trim().toLowerCase().replace(/^e/, "e"); render();
  });
  document.getElementById("addSearch").q.addEventListener("input", e => { term = e.target.value.trim().toLowerCase(); render(); });
  document.getElementById("riskFilters").addEventListener("click", e => {
    const b = e.target.closest("[data-r]"); if (!b) return;
    risk = risk === b.dataset.r ? "" : b.dataset.r;
    document.querySelectorAll("#riskFilters [data-r]").forEach(x => x.classList.toggle("active", x.dataset.r === risk));
    render();
  });
};

/* ---------- EMPRESAS ---------- */
Views.empresas = async function (el, params) {
  const q0 = params.get("q") || "";
  el.innerHTML = `
  <div class="section-label">Vigilancia de empresas</div>
  <h1 class="page-title">Antecedentes y calificación</h1>
  <p class="page-sub">Cruza el titular o razón social con los establecimientos vigilados por el INVIMA (concepto sanitario vigente) y el estado de sus registros sanitarios de alimentos. Las calificaciones combinan ambas fuentes abiertas.</p>
  <form class="search-box" style="max-width:600px" id="compSearch">
    <input type="search" name="q" value="${esc(q0)}" placeholder="Razón social o marca: Ej. Colombina, Alpina, Super…" autocomplete="off">
    <button class="btn btn-primary" type="submit">Investigar</button>
  </form>
  <div id="compResults" style="margin-top:22px"></div>
  <div class="notice" style="margin-top:22px">La calificación es un indicador automatizado a partir de datos abiertos (concepto sanitario de la última visita de inspección y estado de registros). No constituye una acusación ni reemplaza la verificación oficial en INVIMA, SIC o RUES.</div>`;

  const resultsEl = document.getElementById("compResults");
  async function run(q) {
    if (!q.trim()) { resultsEl.innerHTML = ""; return; }
    resultsEl.innerHTML = `<div class="skeleton" style="min-height:130px"></div>`;
    try {
      const [ests, registros] = await Promise.all([
        INVIMA.establecimientos(q),
        INVIMA.registros(q, 80)
      ]);
      const parts = [];
      if (ests.length) {
        // Agrupar por razón social
        const byCompany = {};
        for (const e of ests) {
          const k = e.razon_social || "SIN NOMBRE";
          (byCompany[k] = byCompany[k] || []).push(e);
        }
        parts.push(`<div class="section-label" style="margin-top:6px">Establecimientos vigilados · ${ests.length}</div>`);
        for (const [nombre, lista] of Object.entries(byCompany)) {
          const { score } = companyScore(lista, []);
          const rating = scoreToRating(score, true);
          const reps = Reports.forCompany(nombre);
          parts.push(`<div class="company-card">
            <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;align-items:flex-start">
              <div>
                <h4>${esc(nombre)}</h4>
                <div class="company-meta">
                  ${lista[0].nit ? `<span>NIT ${esc(lista[0].nit)}</span>` : ""}
                  ${lista[0].municipio ? `<span>${esc(lista[0].municipio)}${lista[0].departamento ? ", " + esc(lista[0].departamento) : ""}</span>` : ""}
                  <span>${lista.length} establecimiento(s)</span>
                  ${reps.length ? `<span class="badge warn">${reps.length} reporte(s) ciudadano(s)</span>` : ""}
                </div>
              </div>
              <div class="rating-badge ${rating.cls}"><span class="dot"></span>${rating.label} · ${score}/100</div>
            </div>
            <div class="tbl-wrap"><table class="tbl">
              <thead><tr><th>Línea de alimentos</th><th>Estado</th><th>Concepto sanitario vigente</th><th>Ubicación</th></tr></thead>
              <tbody>${lista.slice(0, 8).map(e => `<tr>
                <td style="font-size:12px;max-width:300px">${esc(cap((e.linea_subcateggoria_de || "—").toLowerCase()))}</td>
                <td style="font-size:12px">${esc(cap((e.estado_del_establecimiento || "—").toLowerCase()))}</td>
                <td>${conceptoBadge(e.concepto_sanitario_vigente)}</td>
                <td class="mono" style="font-size:11px">${esc(e.municipio || "")}${e.departamento ? " · " + esc(e.departamento) : ""}</td>
              </tr>`).join("")}</tbody></table></div>
            <div class="ext-links">
              <a class="ext-link" href="https://www.datos.gov.co/d/uhs6-qp53" target="_blank" rel="noopener">Dataset INVIMA · establecimientos ↗</a>
              <a class="ext-link" href="https://www.rues.org.co" target="_blank" rel="noopener">Registro mercantil RUES ↗</a>
              <a class="ext-link" href="https://www.sic.gov.co/tema/proteccion-del-consumidor" target="_blank" rel="noopener">Reclamos SIC ↗</a>
              <a class="ext-link" href="#/reportar?empresa=${encodeURIComponent(nombre)}">Reportar hallazgo</a>
            </div>
          </div>`);
        }
      }
      if (registros.length) {
        const vig = registros.filter(r => /vigente/i.test(r.estadoregistro || ""));
        parts.push(`<div class="section-label" style="margin-top:20px">Registros sanitarios de alimentos · ${registros.length} (${vig.length} vigentes)</div>
        <div class="tbl-wrap"><table class="tbl">
          <thead><tr><th>Producto</th><th>Registro</th><th>Estado</th><th>Titular</th><th>Vence</th></tr></thead>
          <tbody>${registros.slice(0, 20).map(r => `<tr>
            <td style="max-width:280px;font-size:12.5px">${esc(cap((r.producto || "").toLowerCase()))}</td>
            <td class="mono" style="font-size:11.5px">${esc(r.rsynso || "—")}</td>
            <td>${/vigente/i.test(r.estadoregistro || "") ? '<span class="badge ok">Vigente</span>' : '<span class="badge danger">' + esc(r.estadoregistro || "?") + "</span>"}</td>
            <td style="font-size:12px">${esc(r.titular || "—")}</td>
            <td class="mono" style="font-size:11.5px">${esc((r.fechavencimiento || "").slice(0, 10) || "—")}</td>
          </tr>`).join("")}</tbody></table></div>
        <p class="muted" style="font-size:11.5px;margin-top:10px">Fuente: <a href="https://www.datos.gov.co/d/ui32-p9f2" target="_blank" rel="noopener">RS y NSO vigentes y vencidos · datos.gov.co</a>. ${registros.length > 20 ? "Mostrando 20 primeros." : ""}</p>`);
      }
      resultsEl.innerHTML = parts.length ? parts.join("") :
        emptyState("Sin coincidencias en el INVIMA", "No se encontraron establecimientos ni registros sanitarios de alimentos para “" + q + "”. Verifica la razón social exacta en el portal del INVIMA o en el RUES.");
    } catch (err) {
      resultsEl.innerHTML = errorBox(err.message, "datos.gov.co no respondió. El servicio Socrata puede estar temporalmente no disponible.");
    }
  }
  document.getElementById("compSearch").addEventListener("submit", e => {
    e.preventDefault(); run(e.target.q.value);
  });
  if (q0) run(q0);
};

function conceptoBadge(c) {
  const t = (c || "").toUpperCase();
  if (!t) return '<span class="badge na">Sin concepto</span>';
  if (t.includes("DESFAVORABLE")) return `<span class="badge danger">${esc(c)}</span>`;
  if (t.includes("CONDICIONAD") || t.includes("REQUERIMIENTO")) return `<span class="badge warn">${esc(c)}</span>`;
  if (t.includes("FAVORABLE")) return `<span class="badge ok">${esc(c)}</span>`;
  return `<span class="badge na">${esc(c)}</span>`;
}

/* ---------- COMPARAR ---------- */
Views.comparar = async function (el) {
  el.innerHTML = `
  <div class="section-label">Comparador</div>
  <h1 class="page-title">Comparar dos productos</h1>
  <p class="page-sub">Pon frente a frente nutrientes, sellos, aditivos y grado de procesamiento. Busca cada producto por nombre o código de barras.</p>
  <div class="compare-slots">
    <div class="compare-slot" id="slotA"></div>
    <div class="vs-badge">VS</div>
    <div class="compare-slot" id="slotB"></div>
  </div>
  <div id="compareOut"></div>`;

  function slotHTML(slotEl, p, other) {
    if (!p) {
      slotEl.classList.remove("filled");
      slotEl.innerHTML = `
        <form class="search-box" data-slot="${slotEl.id}">
          <input type="search" name="q" placeholder="Buscar producto o código…" autocomplete="off">
          <button class="btn btn-primary" type="submit">+</button>
        </form>
        <div class="mini-results"></div>`;
      slotEl.querySelector("form").addEventListener("submit", async e => {
        e.preventDefault();
        const q = e.target.q.value.trim(); if (!q) return;
        const box = slotEl.querySelector(".mini-results");
        box.innerHTML = `<div class="skeleton" style="min-height:50px"></div>`;
        try {
          if (/^\d{8,13}$/.test(q)) {
            const p2 = await OFF.product(q);
            if (p2) { setSlot(p2); return; }
          }
          const d = await OFF.search(q, { pageSize: 5 });
          box.innerHTML = d.products.length
            ? d.products.map(x => `<button class="mini-result" data-code="${esc(x.code)}">
                ${x.image_front_small_url ? `<img src="${esc(x.image_front_small_url)}" alt="">` : ""}
                <span><span class="n">${esc(x.product_name || "Sin nombre")}</span><br><span class="b">${esc(x.brands || "")}</span></span>
              </button>`).join("")
            : `<p class="muted" style="font-size:12.5px">Sin resultados.</p>`;
        } catch (err) { box.innerHTML = `<p class="muted" style="font-size:12.5px">Error: ${esc(err.message)}</p>`; }
      });
      slotEl.addEventListener("click", async e => {
        const b = e.target.closest("[data-code]"); if (!b) return;
        const p2 = await OFF.product(b.dataset.code).catch(() => null);
        if (p2) setSlot(p2); else toast("No se pudo cargar el producto");
      });
    } else {
      slotEl.classList.add("filled");
      slotEl.innerHTML = `
        <div style="display:flex;gap:12px;align-items:center">
          ${p.image_front_small_url ? `<img src="${esc(p.image_front_small_url)}" style="width:52px;height:52px;object-fit:contain" alt="">` : ""}
          <div>
            <div style="font-weight:700;font-size:14px;line-height:1.3">${esc(p.product_name || "Sin nombre")}</div>
            <div class="mono muted" style="font-size:10.5px;margin-top:3px">${esc(p.brands || "")}</div>
          </div>
        </div>
        <div class="pcard-badges">${nutriscoreBadge(p.nutriscore_grade)}${novaBadge(p.nova_group)}</div>
        <button class="btn btn-ghost" data-clear="${slotEl.id}" style="align-self:flex-start;min-height:36px;padding:8px 16px">Quitar</button>`;
      slotEl.querySelector("[data-clear]").addEventListener("click", () => {
        if (slotEl.id === "slotA") CompareStore.a = null; else CompareStore.b = null;
        renderAll();
      });
    }
  }

  function setSlot(p) {
    if (!CompareStore.a) CompareStore.a = p;
    else CompareStore.b = p;
    renderAll();
  }

  function renderAll() {
    slotHTML(document.getElementById("slotA"), CompareStore.a);
    slotHTML(document.getElementById("slotB"), CompareStore.b);
    const out = document.getElementById("compareOut");
    const A = CompareStore.a, B = CompareStore.b;
    if (!A || !B) { out.innerHTML = `<p class="muted mono" style="font-size:12px;letter-spacing:.06em">Selecciona dos productos para ver la comparación completa.</p>`; return; }
    const rows = NUTRI_ROWS.map(([key, label, un, ref, good, factor]) => {
      let va = (A.nutriments || {})[key], vb = (B.nutriments || {})[key];
      if (factor) { va = va != null ? va * factor : null; vb = vb != null ? vb * factor : null; }
      let winner = "";
      if (va != null && vb != null && va !== vb) winner = good ? (va > vb ? "A" : "B") : (va < vb ? "A" : "B");
      return `<tr><td>${label}</td>
        <td class="num">${fmt(va)} ${un} ${winner === "A" ? '<span class="winner-tag">◀ MEJOR</span>' : ""}</td>
        <td class="num">${fmt(vb)} ${un} ${winner === "B" ? '<span class="winner-tag">MEJOR ▶</span>' : ""}</td></tr>`;
    }).join("");
    const sellosA = computeSellos(A).filter(s => s.aplica).length;
    const sellosB = computeSellos(B).filter(s => s.aplica).length;
    const addA = extractAdditives(A), addB = extractAdditives(B);
    const score = (p, sellos, adds) => {
      let s = 0;
      s += ({ a:5, b:4, c:3, d:2, e:1 }[(p.nutriscore_grade || "").toLowerCase()] || 2) * 4;
      s += ({ 1:10, 2:7, 3:4, 4:0 }[p.nova_group] ?? 4);
      s -= sellos * 3;
      s -= adds.filter(a => a.riesgo === "alto").length * 3;
      return s;
    };
    const sA = score(A, sellosA, addA), sB = score(B, sellosB, addB);
    out.innerHTML = `
    <div class="panel">
      <h3><span class="k">RESUMEN</span> Veredicto del observatorio</h3>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Criterio</th><th>${esc((A.product_name || "A").slice(0, 26))}</th><th>${esc((B.product_name || "B").slice(0, 26))}</th></tr></thead>
        <tbody>
          <tr><td>Sellos frontales estimados</td><td class="num">${sellosA}</td><td class="num">${sellosB}</td></tr>
          <tr><td>Aditivos (alta precaución)</td><td class="num">${addA.length} (${addA.filter(a=>a.riesgo==="alto").length})</td><td class="num">${addB.length} (${addB.filter(a=>a.riesgo==="alto").length})</td></tr>
          <tr><td>Grado NOVA</td><td class="num">${A.nova_group || "—"}</td><td class="num">${B.nova_group || "—"}</td></tr>
          <tr><td>Puntaje orientativo</td>
            <td class="num">${sA} ${sA >= sB ? '<span class="winner-tag">◀ MEJOR OPCIÓN</span>' : ""}</td>
            <td class="num">${sB} ${sB > sA ? '<span class="winner-tag">MEJOR OPCIÓN ▶</span>' : ""}</td></tr>
        </tbody></table></div>
      <p class="muted" style="font-size:11.5px;margin-top:10px">Puntaje orientativo propio (Nutri-Score, NOVA, sellos y aditivos de alta precaución). No sustituye asesoría nutricional.</p>
    </div>
    <div class="panel">
      <h3><span class="k">NUTRIENTES</span> por 100 g / 100 ml</h3>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Nutriente</th><th class="num">${esc((A.product_name || "A").slice(0, 22))}</th><th class="num">${esc((B.product_name || "B").slice(0, 22))}</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
    </div>
    <div class="dossier-grid">
      <div class="panel"><h3><span class="k">A</span> Aditivos</h3><div class="ing-list">${addA.length ? addA.map(riskChip).join("") : '<span class="muted">Sin aditivos declarados</span>'}</div></div>
      <div class="panel"><h3><span class="k">B</span> Aditivos</h3><div class="ing-list">${addB.length ? addB.map(riskChip).join("") : '<span class="muted">Sin aditivos declarados</span>'}</div></div>
    </div>`;
  }
  renderAll();
};

/* ---------- NOTICIAS Y ALERTAS ---------- */
Views.noticias = async function (el) {
  el.innerHTML = `
  <div class="section-label">Noticias y marco regulatorio</div>
  <h1 class="page-title">Qué está pasando con tu comida</h1>
  <p class="page-sub">Normativas vigentes que afectan los empacados de la canasta familiar y portales oficiales donde se publican alertas sanitarias y sanciones. Las alertas puntuales cambian cada semana: consulta siempre la fuente.</p>
  <div class="news-grid">
    <div>
      <div class="section-label">Normativas clave</div>
      ${NORMATIVAS.map(n => `<div class="news-item law">
        <h5>${esc(n.titulo)}</h5>
        <p>${esc(n.resumen)}</p>
        <div class="meta">${esc(n.entidad)} · ${esc(n.anio)} · <a href="${esc(n.url)}" target="_blank" rel="noopener">Documento oficial ↗</a></div>
      </div>`).join("")}
    </div>
    <div>
      <div class="section-label">Dónde verificar alertas y noticias</div>
      ${NEWS_SOURCES.map(s => `<div class="news-item">
        <h5><a href="${esc(s.url)}" target="_blank" rel="noopener" style="color:var(--text)">${esc(s.nombre)} ↗</a></h5>
        <p>${esc(s.desc)}</p>
        <div class="meta">${s.tipo === "oficial" ? '<span class="badge src">Fuente oficial</span>' : '<span class="badge na">Base de datos</span>'}</div>
      </div>`).join("")}
      <div class="alert-row crit">
        <h5>¿Sospechas de un producto fraudulento?</h5>
        <p>Reporta directamente ante el INVIMA (línea nacional de atención) o presenta queja ante la SIC por publicidad engañosa. Conserva el empaque, el lote y la factura.</p>
        <div class="meta"><a href="https://www.invima.gov.co/atencion-al-ciudadano" target="_blank" rel="noopener">Canales INVIMA ↗</a> · <a href="https://www.sic.gov.co" target="_blank" rel="noopener">SIC ↗</a></div>
      </div>
    </div>
  </div>`;
};

/* ---------- REPORTAR (POST ciudadano) ---------- */
Views.reportar = async function (el, params) {
  const producto = params.get("producto") || "";
  const marca = params.get("marca") || params.get("empresa") || "";
  el.innerHTML = `
  <div class="section-label">Participación ciudadana</div>
  <h1 class="page-title">Reportar un hallazgo</h1>
  <p class="page-sub">Registra productos sin registro sanitario visible, etiquetados engañosos, sellos incorrectos o problemas de calidad. <b>Los reportes se guardan solo en este navegador</b> (localStorage) y puedes exportarlos; para una denuncia formal usa los canales del INVIMA o la SIC.</p>
  <div class="dossier-grid">
    <div class="panel">
      <h3><span class="k">NUEVO</span> Formulario de reporte</h3>
      <form id="repForm" class="form-grid">
        <div class="field"><label>Producto</label><input name="producto" value="${esc(producto)}" required placeholder="Ej: Papas sabor limón x 45g"></div>
        <div class="field"><label>Marca / empresa</label><input name="empresa" value="${esc(marca)}" required placeholder="Ej: Snacks del Valle S.A.S."></div>
        <div class="field"><label>Tipo de hallazgo</label>
          <select name="tipo">
            <option>Sin registro sanitario visible</option>
            <option>Etiquetado engañoso o incompleto</option>
            <option>Sellos frontales ausentes/incorrectos</option>
            <option>Producto vencido o en mal estado</option>
            <option>Publicidad dirigida a menores</option>
            <option>Otro</option>
          </select></div>
        <div class="field"><label>Gravedad percibida</label>
          <div class="severity-picker">
            <label class="chip"><input type="radio" name="gravedad" value="baja" checked style="accent-color:#34d399"> Baja</label>
            <label class="chip"><input type="radio" name="gravedad" value="media" style="accent-color:#fbbf24"> Media</label>
            <label class="chip"><input type="radio" name="gravedad" value="alta" style="accent-color:#f87171"> Alta</label>
          </div></div>
        <div class="field full"><label>Descripción</label><textarea name="detalle" placeholder="Dónde lo encontraste, lote, fecha, qué observaste…"></textarea></div>
        <div class="field full"><button class="btn btn-primary" type="submit">Guardar reporte</button></div>
      </form>
    </div>
    <div class="panel">
      <h3><span class="k">REGISTRO LOCAL</span> Tus reportes</h3>
      <div id="repList"></div>
      <div class="ext-links" style="margin-top:12px">
        <button class="ext-link" id="repExport">Exportar JSON ↓</button>
        <a class="ext-link" href="https://www.invima.gov.co/atencion-al-ciudadano" target="_blank" rel="noopener">Denuncia formal INVIMA ↗</a>
      </div>
    </div>
  </div>`;

  function renderList() {
    const list = Reports.all();
    document.getElementById("repList").innerHTML = list.length ? list.map(r => `
      <div class="alert-row ${r.gravedad === "alta" ? "crit" : r.gravedad === "media" ? "" : "good"}">
        <h5>${esc(r.producto)} — <span class="muted">${esc(r.empresa)}</span></h5>
        <p>${esc(r.tipo)}${r.detalle ? " · " + esc(r.detalle) : ""}</p>
        <div class="meta">${esc(r.fecha)} · gravedad ${esc(r.gravedad)} · <a href="#" data-del="${r.id}" style="color:var(--red)">eliminar</a></div>
      </div>`).join("") : `<p class="muted" style="font-size:13px">Aún no tienes reportes guardados.</p>`;
  }
  renderList();
  document.getElementById("repForm").addEventListener("submit", e => {
    e.preventDefault();
    const f = e.target;
    Reports.add({ producto: f.producto.value.trim(), empresa: f.empresa.value.trim(), tipo: f.tipo.value, gravedad: f.gravedad.value, detalle: f.detalle.value.trim() });
    f.reset(); renderList(); toast("Reporte guardado en este navegador");
  });
  document.getElementById("repList").addEventListener("click", e => {
    const d = e.target.closest("[data-del]");
    if (d) { e.preventDefault(); Reports.remove(d.dataset.del); renderList(); }
  });
  document.getElementById("repExport").addEventListener("click", () => Reports.exportJSON());
};
