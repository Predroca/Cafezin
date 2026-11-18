/* ==========================================================
   abrirProduto.js  (JavaScript/Comprador/abrirProduto.js)

   Clicar em qualquer card de produto abre produto.html?cod=<id>.
   Funciona para cards criados depois pelo JS (secoesInicio.js,
   lojasPopulares.js, Pesquisa.js e produto.js), pois usa um único
   listener no document.

   O card só é clicável se tiver data-cod-produto.
   Cliques no "+" (adicionar), no coração (favoritar) e em links
   não abrem o produto.
   ========================================================== */
(function () {
  "use strict";

  const PAGINA_PRODUTO = "produto.html";
  const SELETOR_CARD = ".produtoCard, .OutrasLojasCard";

  function codigoDoCard(card) {
    const codigo = Number(card.dataset.codProduto);
    return Number.isFinite(codigo) && codigo > 0 ? codigo : null;
  }

  function abrir(card) {
    const codigo = codigoDoCard(card);
    if (codigo === null) return;
    window.location.href = PAGINA_PRODUTO + "?cod=" + encodeURIComponent(codigo);
  }

  document.addEventListener("click", (evento) => {
    // ignora cliques em botões, links e campos dentro do card
    if (evento.target.closest("button, a, input, select, textarea, label")) return;

    const card = evento.target.closest(SELETOR_CARD);
    if (card) abrir(card);
  });

  // Acessibilidade: o card focado com Tab abre com Enter
  document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Enter") return;
    const card = evento.target.closest && evento.target.closest(SELETOR_CARD);
    if (card && evento.target === card) abrir(card);
  });

  // Cursor de "clicável" e foco visível (não depende de CSS externo)
  const estilo = document.createElement("style");
  estilo.textContent =
    ".produtoCard[data-cod-produto], .OutrasLojasCard[data-cod-produto] { cursor: pointer; }" +
    ".produtoCard[data-cod-produto]:focus-visible, .OutrasLojasCard[data-cod-produto]:focus-visible" +
    " { outline: 2px solid #b5651d; outline-offset: 3px; }";
  document.head.appendChild(estilo);

  // Cards criados dinamicamente também ficam alcançáveis por teclado
  function tornarFocaveis(raiz) {
    if (!raiz.querySelectorAll) return;
    const cards = raiz.matches && raiz.matches(SELETOR_CARD) ? [raiz] : [];
    raiz.querySelectorAll(SELETOR_CARD).forEach((c) => cards.push(c));
    cards.forEach((c) => {
      if (c.dataset.codProduto && !c.hasAttribute("tabindex")) c.setAttribute("tabindex", "0");
    });
  }

  function iniciar() {
    tornarFocaveis(document.body);
    new MutationObserver((mutacoes) => {
      mutacoes.forEach((m) => m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) tornarFocaveis(n);
      }));
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();