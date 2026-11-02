/*
Endereços do comprador: cadastro, listagem, definição de principal e exclusão.
*/

import { CHAVES, ENDERECOS_PADRAO } from "./config.js";
import { ler, salvar } from "./armazenamento.js";
import { $, el, icone, avisar, estadoVazio } from "./utilitarios.js";

/* ---------- Estado ---------- */
let enderecos = ler(CHAVES.enderecos, ENDERECOS_PADRAO);

// Função chamada quando a quantidade de endereços muda (o main.js redesenha o cabeçalho)
let aoAlterar = function () {};

export function obterEnderecos() {
    return enderecos;
}

/* ---------- Formulário ---------- */
const formEndereco = $("formEndereco");
const botaoNovoEndereco = $("alternarNovoEndereco");

function alternarFormEndereco(abrir) {
    formEndereco.hidden = !abrir;
    botaoNovoEndereco.setAttribute("aria-expanded", abrir);
    if (abrir) {
        $("endApelido").focus();
    } else {
        formEndereco.reset();
        $("erroEndereco").textContent = "";
    }
}

/* ---------- Lista ---------- */
export function renderEnderecos() {
    const lista = $("listaEnderecos");
    lista.textContent = "";

    if (!enderecos.length) {
        lista.appendChild(estadoVazio("geo-alt", "Nenhum endereço salvo", "Adicione um endereço para receber seus pedidos."));
        return;
    }

    enderecos.forEach(function (end) {
        const item = el("li", "itemEndereco");

        const iconeBox = el("div", "itemEnderecoIcone");
        iconeBox.appendChild(icone(end.apelido.toLowerCase() === "trabalho" ? "briefcase" : "house-door"));

        const texto = el("div");
        const titulo = el("h3", "", end.apelido);
        if (end.principal) titulo.appendChild(el("span", "selo", "Principal"));
        texto.appendChild(titulo);
        texto.appendChild(el("p", "", end.rua + ", " + end.numero + " - " + end.bairro + ", " + end.cidade));

        const acoes = el("div", "itemAcoes");

        if (!end.principal) {
            const principal = el("button", "botaoIcone");
            principal.type = "button";
            principal.title = "Definir como principal";
            principal.setAttribute("aria-label", "Definir " + end.apelido + " como endereço principal");
            principal.appendChild(icone("check2"));
            principal.addEventListener("click", function () {
                enderecos.forEach((x) => (x.principal = x.id === end.id));
                salvar(CHAVES.enderecos, enderecos);
                renderEnderecos();
                avisar(end.apelido + " agora é o endereço principal.");
            });
            acoes.appendChild(principal);
        }

        const excluir = el("button", "botaoIcone excluir");
        excluir.type = "button";
        excluir.title = "Excluir endereço";
        excluir.setAttribute("aria-label", "Excluir endereço " + end.apelido);
        excluir.appendChild(icone("trash"));
        excluir.addEventListener("click", function () {
            enderecos = enderecos.filter((x) => x.id !== end.id);
            if (enderecos.length && !enderecos.some((x) => x.principal)) enderecos[0].principal = true;
            salvar(CHAVES.enderecos, enderecos);
            renderEnderecos();
            aoAlterar();
            avisar("Endereço excluído.");
        });
        acoes.appendChild(excluir);

        item.append(iconeBox, texto, acoes);
        lista.appendChild(item);
    });
}

/* ---------- Eventos ---------- */
export function iniciarEnderecos(callbackAoAlterar) {
    aoAlterar = callbackAoAlterar;

    botaoNovoEndereco.addEventListener("click", () => alternarFormEndereco(formEndereco.hidden));
    $("cancelarEndereco").addEventListener("click", () => alternarFormEndereco(false));

    formEndereco.addEventListener("submit", function (e) {
        e.preventDefault();
        const dados = {
            apelido: $("endApelido").value.trim(),
            rua: $("endRua").value.trim(),
            numero: $("endNumero").value.trim(),
            bairro: $("endBairro").value.trim(),
            cidade: $("endCidade").value.trim()
        };

        if (Object.values(dados).some((v) => !v)) {
            $("erroEndereco").textContent = "Preencha todos os campos do endereço.";
            return;
        }

        enderecos.push(Object.assign({ id: Date.now(), principal: enderecos.length === 0 }, dados));
        salvar(CHAVES.enderecos, enderecos);
        alternarFormEndereco(false);
        renderEnderecos();
        aoAlterar();
        avisar("Endereço adicionado.");
    });
}
