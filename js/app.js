/* =========================================================
   CanastaClara — router y arranque
   ========================================================= */
"use strict";

(function () {
  const view = document.getElementById("view");
  const nav = document.getElementById("mainNav");
  const toggle = document.getElementById("navToggle");

  /* Ticker: duplicado para loop continuo */
  const tickerHTML = TICKER_ITEMS.map(t => `<span>${t}</span>`).join("");
  document.getElementById("tickerTrack").innerHTML = tickerHTML + tickerHTML;

  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  });
  nav.addEventListener("click", e => {
    if (e.target.closest("a")) { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
  });

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [path, qs] = raw.split("?");
    const segs = path.split("/").filter(Boolean);
    return { segs, params: new URLSearchParams(qs || "") };
  }

  async function route() {
    const { segs, params } = parseHash();
    const page = segs[0] || "";
    nav.querySelectorAll("a").forEach(a =>
      a.classList.toggle("active", a.dataset.nav === (page || "inicio-home")));
    view.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });

    try {
      switch (page) {
        case "":           await Views.home(view); break;
        case "buscar":      await Views.buscar(view, params); break;
        case "producto":    await Views.producto(view, segs[1]); break;
        case "componentes": await Views.componentes(view, segs[1]); break;
        case "empresas":    await Views.empresas(view, params); break;
        case "comparar":    await Views.comparar(view); break;
        case "noticias":    await Views.noticias(view); break;
        case "reportar":    await Views.reportar(view, params); break;
        default:
          view.innerHTML = `<div class="section-label">404</div>` +
            `<div class="empty"><div class="ico">∅</div><h4>Ruta no encontrada</h4><p>La sección “${page}” no existe.</p></div>
             <p style="margin-top:16px"><a class="btn btn-ghost" href="#/">← Ir al inicio</a></p>`;
      }
    } catch (err) {
      console.error(err);
      view.innerHTML = `<div class="section-label">Error</div>` +
        `<div class="error-box"><b>Algo falló al renderizar la vista.</b><br><span class="muted">${String(err.message || err)}</span></div>`;
    }
  }

  window.addEventListener("hashchange", route);
  route();
})();
