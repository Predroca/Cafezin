/*
Header das etapas da compra (Sacola / Pagamento)
Move a linha amarela sublinhada de uma etapa para a outra (e acompanha o mouse no hover). Como cada etapa é uma página,
a posição anterior da linha fica guardada no sessionStorage: a página nova começa com a
linha onde ela estava e desliza até a etapa atual (mesma transição do menu do header).
*/
(function () {
    "use strict";

    const CHAVE = "cafezinEtapaIndicador";

    const nav = document.querySelector(".navEtapas");
    if (!nav) return;
    const indicador = nav.querySelector(".indicadorEtapa");
    const ativo = nav.querySelector("a.ativo");
    if (!indicador || !ativo) return;

    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function medir(link) {
        const alvo = link || ativo;
        return { x: alvo.offsetLeft, largura: alvo.offsetWidth };
    }

    function posicionar(medida) {
        indicador.style.width = medida.largura + "px";
        indicador.style.transform = "translateX(" + medida.x + "px)";
    }

    // coloca a linha sem animar (usado no resize e quando a fonte termina de carregar)
    function posicionarSemAnimar() {
        indicador.style.transition = "none";
        posicionar(medir());
        void indicador.offsetWidth;
        indicador.style.transition = "";
    }

    function guardar(medida) {
        try { sessionStorage.setItem(CHAVE, JSON.stringify(medida)); } catch (e) { /* sem storage */ }
    }

    let anterior = null;
    try { anterior = JSON.parse(sessionStorage.getItem(CHAVE)); } catch (e) { /* sem storage */ }

    const alvo = medir();
    const mudou = anterior && typeof anterior.x === "number" &&
        (anterior.x !== alvo.x || anterior.largura !== alvo.largura);

    if (mudou && !reduzMovimento) {
        indicador.style.transition = "none";
        posicionar(anterior);
        void indicador.offsetWidth;          // fixa a posição antiga antes de animar
        indicador.style.transition = "";
        requestAnimationFrame(function () { posicionar(medir()); });
    } else {
        posicionarSemAnimar();
    }
    guardar(alvo);

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () {
            posicionar(medir());
            guardar(medir());
        });
    }

    // Hover/foco: a linha desliza até a etapa sob o mouse e volta para a atual ao sair
    nav.querySelectorAll("a").forEach(function (link) {
        link.addEventListener("mouseenter", function () { posicionar(medir(link)); });
        link.addEventListener("focus", function () { posicionar(medir(link)); });
        link.addEventListener("blur", function () { posicionar(medir()); });
    });
    nav.addEventListener("mouseleave", function () { posicionar(medir()); });

    window.addEventListener("resize", function () {
        posicionarSemAnimar();
        guardar(medir());
    });
})();
