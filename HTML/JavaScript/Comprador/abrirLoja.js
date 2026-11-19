/* ==========================================================
   abrirLoja.js  (JavaScript/Comprador/abrirLoja.js)

   Clicar no card de uma loja leva para:
       visualizacaoLoja.html?cod=<cod_loja>

   Funciona na indexComprador.html e na pesquisa.html, inclusive
   nos cards criados depois pelo lojasPopulares.js, secoesInicio.js
   e Pesquisa.js (um único listener no document, como no
   adicionarSacola.js). O card precisa ter a classe .lojaCard e o
   atributo data-cod-loja.

   Cliques em botões (ex.: favoritar) ou links dentro do card não
   navegam.
   ========================================================== */
(function () {
  "use strict";

  const PAGINA_LOJA = "visualizacaoLoja.html";
  const SELETOR_CARD = ".lojaCard[data-cod-loja]";

  function urlDaLoja(card) {
    const cod = Number(card.dataset.codLoja);
    if (!Number.isInteger(cod) || cod <= 0) return null;
    return PAGINA_LOJA + "?cod=" + cod;
  }

  // cursor de "clicável" sem depender de editar o CSS da home
  const estilo = document.createElement("style");
  estilo.textContent =
    SELETOR_CARD + "{cursor:pointer}" +
    SELETOR_CARD + ":focus-visible{outline:2px solid currentColor;outline-offset:3px}";
  document.head.appendChild(estilo);

  document.addEventListener("click", (evento) => {
    const card = evento.target.closest(SELETOR_CARD);
    if (!card) return;

    // favoritar, links e outros controles do card mantêm o comportamento deles
    if (evento.target.closest("button, a, input, select, textarea")) return;

    const url = urlDaLoja(card);
    if (!url) return;

    if (evento.ctrlKey || evento.metaKey || evento.shiftKey) {
      window.open(url, "_blank", "noopener");
      return;
    }
    window.location.href = url;
  });

  // Acessibilidade: o card recebe foco e abre a loja com Enter
  function tornarFocavel(card) {
    if (card.dataset.lojaLink) return;
    card.dataset.lojaLink = "1";
    card.tabIndex = 0;
  }

  document.addEventListener("keydown", (evento) => {
    if (evento.key !== "Enter" || evento.target.matches === undefined) return;
    if (!evento.target.matches(SELETOR_CARD)) return; // só quando o foco está no card em si
    const url = urlDaLoja(evento.target);
    if (url) window.location.href = url;
  });

  function marcarCards(raiz) {
    (raiz || document).querySelectorAll(SELETOR_CARD).forEach(tornarFocavel);
  }

  marcarCards();
  new MutationObserver(() => marcarCards()).observe(document.body, { childList: true, subtree: true });
})();