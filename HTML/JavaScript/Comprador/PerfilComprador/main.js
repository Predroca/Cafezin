/*
Ponto de entrada do perfil do comprador.
Só inicializa e conecta os módulos; a lógica de cada área fica no seu arquivo.

No HTML, carregue apenas este arquivo:
<script type="module" src="js/main.js"></script>
*/

import { PEDIDOS, renderPedidos, iniciarAvaliacao } from "./pedidosPerfilComprador.js";
import { renderCabecalho, preencherForm, iniciarPerfil } from "./perfilComprador.js";
import { iniciarAbas, abrirAbaInicial } from "./abasPerfilComprador.js";
import { obterEnderecos, renderEnderecos, iniciarEnderecos } from "./enderecosPerfilComprador.js";
import { obterFavoritas, renderFavoritas } from "./favoritasPerfilComprador.js";
import { iniciarSessao } from "./sessaoPerfilComprador.js";

// Reúne as contagens dos módulos e redesenha o cabeçalho.
// Passado como callback para os módulos, evitando importações circulares.
function atualizarCabecalho() {
    renderCabecalho({
        pedidos: PEDIDOS.length,
        favoritas: obterFavoritas().length,
        enderecos: obterEnderecos().length
    });
}

function inicializarPagina() {
    // Eventos de cada módulo
    iniciarPerfil(atualizarCabecalho);
    iniciarAbas();
    iniciarEnderecos(atualizarCabecalho);
    iniciarSessao();
    iniciarAvaliacao();

    // Carregamento inicial
    atualizarCabecalho();
    preencherForm();
    renderEnderecos();
    renderPedidos();
    renderFavoritas(atualizarCabecalho);

    // Aba da URL (#nome) ou a primeira
    abrirAbaInicial();
}

inicializarPagina();
