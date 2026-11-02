/*
Sessão do comprador: confirmação e encerramento da sessão.
*/

import { CHAVES, PAGINA_INICIAL_DESLOGADO } from "./config.js";
import { $ } from "./utilitarios.js";

const modalSair = $("modalSair");

function sair() {
    // Encerra só a sessão. Quando houver token/cookie de login, remova-o aqui também.
    try {
        localStorage.removeItem(CHAVES.sessao);
        sessionStorage.clear();
    } catch (e) { /* navegador sem storage: segue para o início mesmo assim */ }

    window.location.replace(PAGINA_INICIAL_DESLOGADO);
}

export function iniciarSessao() {
    $("abrirSair").addEventListener("click", function () {
        if (typeof modalSair.showModal === "function") {
            modalSair.showModal();
            $("cancelarSair").focus();
        } else if (window.confirm("Sair da sua conta?")) {
            sair();
        }
    });

    $("cancelarSair").addEventListener("click", () => modalSair.close());

    // Fecha ao clicar fora da caixa
    modalSair.addEventListener("click", function (e) {
        const caixa = modalSair.getBoundingClientRect();
        const fora = e.clientX < caixa.left || e.clientX > caixa.right || e.clientY < caixa.top || e.clientY > caixa.bottom;
        if (fora) modalSair.close();
    });

    $("confirmarSair").addEventListener("click", sair);
}
