/*
Cafeterias favoritas do comprador.
*/

import { CHAVES, FAVORITAS_PADRAO, PAGINA_INICIAL_COMPRADOR } from "./config.js";
import { ler, salvar } from "./armazenamento.js";
import { $, el, icone, avisar, estadoVazio } from "./utilitarios.js";

/* ---------- Estado ---------- */
let favoritas = ler(CHAVES.favoritas, FAVORITAS_PADRAO);

export function obterFavoritas() {
    return favoritas;
}

// callbackAoAlterar: chamado quando a quantidade muda (o main.js redesenha o cabeçalho)
export function renderFavoritas(callbackAoAlterar) {
    const aoAlterar = callbackAoAlterar || function () {};
    const lista = $("listaFavoritas"); 
    lista.textContent = "";

    if (!favoritas.length) {
        lista.appendChild(estadoVazio("heart", "Nenhuma favorita ainda", "Toque no coração de uma cafeteria para guardá-la aqui.", "Ver cafeterias", PAGINA_INICIAL_COMPRADOR + "#cafeterias"));
        return;
    }

    favoritas.forEach(function (loja) {
        const item = el("li", "itemFavorita");
        item.appendChild(el("div", "logoFavorita " + loja.cor, loja.sigla));

        const texto = el("div");
        texto.appendChild(el("h3", "", loja.nome));
        texto.appendChild(el("p", "", loja.tipo));
        const nota = el("p", "nota");
        nota.appendChild(icone("star-fill"));
        nota.appendChild(document.createTextNode(" " + loja.nota));
        texto.appendChild(nota);
        item.appendChild(texto);

        const remover = el("button", "botaoIcone coracao");
        remover.type = "button";
        remover.title = "Remover das favoritas";
        remover.setAttribute("aria-label", "Remover " + loja.nome + " das favoritas");
        remover.appendChild(icone("heart-fill"));
        remover.addEventListener("click", function () {
            favoritas = favoritas.filter((x) => x.id !== loja.id);
            salvar(CHAVES.favoritas, favoritas);
            renderFavoritas(aoAlterar);
            aoAlterar();
            avisar(loja.nome + " saiu das favoritas.");
        });
        item.appendChild(remover);

        lista.appendChild(item);
    });
}
