/*
Abas do perfil.
Todos os painéis ficam na área .perfilPaineis. Clicar numa aba só rola essa
área (nunca a página inteira) e, ao rolar à mão, a aba ativa acompanha.
*/

import { $ } from "./utilitarios.js";

const abas = Array.from(document.querySelectorAll(".aba"));
const areaPaineis = $("perfilPaineis");
const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");

let abaAtual = null;
let travaRolagem = false;      // true enquanto a rolagem foi pedida por um clique
let temporizadorTrava;
let quadroPendente = false;

function marcarAba(nome, moverFoco) {
    abas.forEach(function (aba) {
        const ativa = aba.dataset.aba === nome;
        aba.classList.toggle("ativa", ativa);
        if (ativa) {
            aba.setAttribute("aria-current", "true");
        } else {
            aba.removeAttribute("aria-current");
        }
        aba.tabIndex = ativa ? 0 : -1;
        // preventScroll: dar foco não pode rolar a página
        if (ativa && moverFoco) aba.focus({ preventScroll: true });
    });

    if (nome !== abaAtual && history.replaceState) {
        history.replaceState(null, "", "#" + nome);
    }
    abaAtual = nome;
}

function rolarParaPainel(nome, instantaneo) {
    const painel = $("painel-" + nome);
    if (!painel) return;

    const folga = parseFloat(getComputedStyle(areaPaineis).paddingTop) || 0;
    const topo = Math.max(0, painel.offsetTop - folga);   // .perfilPaineis é position: relative

    travaRolagem = true;
    clearTimeout(temporizadorTrava);
    // se já estiver na posição não haverá evento de scroll; garante que a trava solte
    temporizadorTrava = setTimeout(function () { travaRolagem = false; }, 250);

    // scrollTo age só nesta área; scrollIntoView/âncora (#id) rolariam a página toda
    areaPaineis.scrollTo({
        top: topo,
        behavior: instantaneo || reduzMovimento.matches ? "auto" : "smooth"
    });
}

export function abrirAba(nome, opcoes) {
    const config = opcoes || {};
    marcarAba(nome, config.moverFoco);
    rolarParaPainel(nome, config.instantaneo);
}

// Descobre qual painel está no topo da área e marca a aba correspondente
function sincronizarAbaComRolagem() {
    quadroPendente = false;

    if (travaRolagem) {
        // durante a rolagem do clique, só espera ela terminar (sem piscar abas no caminho)
        clearTimeout(temporizadorTrava);
        temporizadorTrava = setTimeout(function () { travaRolagem = false; }, 120);
        return;
    }

    const folga = parseFloat(getComputedStyle(areaPaineis).paddingTop) || 0;
    const referencia = areaPaineis.scrollTop + areaPaineis.clientHeight * 0.2;
    let nome = abas[0].dataset.aba;

    abas.forEach(function (aba) {
        const painel = $("painel-" + aba.dataset.aba);
        if (painel.offsetTop - folga <= referencia) nome = aba.dataset.aba;
    });

    const noFim = areaPaineis.scrollTop + areaPaineis.clientHeight >= areaPaineis.scrollHeight - 2;
    if (noFim) nome = abas[abas.length - 1].dataset.aba;

    if (nome !== abaAtual) marcarAba(nome);
}

// Abre a aba indicada na URL (#nome) ou, se não houver, a primeira
export function abrirAbaInicial() {
    const abaInicial = location.hash.replace("#", "");
    if (abas.some((a) => a.dataset.aba === abaInicial)) {
        abrirAba(abaInicial, { instantaneo: true });
    } else {
        marcarAba(abas[0].dataset.aba);
    }
}

export function iniciarAbas() {
    areaPaineis.addEventListener("scroll", function () {
        if (quadroPendente) return;
        quadroPendente = true;
        requestAnimationFrame(sincronizarAbaComRolagem);
    }, { passive: true });

    abas.forEach(function (aba, indice) {
        aba.addEventListener("click", function (e) {
            e.preventDefault();   // impede o salto nativo da âncora (#painel-...) que rolava a página
            abrirAba(aba.dataset.aba);
        });
        aba.addEventListener("keydown", function (e) {
            const teclas = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
            if (e.key in teclas) {
                e.preventDefault();
                const proxima = abas[(indice + teclas[e.key] + abas.length) % abas.length];
                abrirAba(proxima.dataset.aba, { moverFoco: true });
            }
        });
    });

    // Links de fora do menu lateral (ex.: "Pedidos" no topo da página)
    document.querySelectorAll("[data-ir-aba]").forEach(function (link) {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            abrirAba(link.dataset.irAba);
        });
    });
}
