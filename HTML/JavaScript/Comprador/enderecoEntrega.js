// ==========================================
// enderecoEntrega.js
// Seção "Endereço de entrega" da sacola.html.
// Lista os endereços do comprador (GET /enderecos) e guarda o escolhido em
// localStorage["cafezinEnderecoEntrega"] (apenas o cod_endereco).
//
// A tela de pagamento pode ler a escolha com:
//   window.EnderecoEntrega.obter()  -> cod_endereco (número) ou null
// e enviar em POST /pedidos como "cod_endereco".
// ==========================================

(() => {
    "use strict";

    const API_URL = "http://localhost:5000";
    const CHAVE_ENDERECO = "cafezinEnderecoEntrega";

    const elLista = document.getElementById("listaEnderecos");
    const elMensagem = document.getElementById("mensagemEndereco");
    if (!elLista) return;

    let carregou = false; // true quando a lista de endereços chegou do backend

    // ---------- escolha guardada ----------

    function obterEscolhido() {
        try {
            const valor = Number(localStorage.getItem(CHAVE_ENDERECO));
            return Number.isFinite(valor) && valor > 0 ? valor : null;
        } catch (_) {
            return null;
        }
    }

    function guardarEscolhido(codEndereco) {
        try {
            localStorage.setItem(CHAVE_ENDERECO, String(codEndereco));
        } catch (erro) {
            console.error("Erro ao guardar o endereço:", erro);
        }
    }

    function limparEscolhido() {
        try { localStorage.removeItem(CHAVE_ENDERECO); } catch (_) { /* ignora */ }
    }

    // ---------- tela ----------

    function mostrarMensagem(texto, erro = false) {
        if (!elMensagem) return;
        elMensagem.textContent = texto;
        elMensagem.classList.toggle("erroEndereco", erro);
    }

    function criar(tag, classe, texto) {
        const el = document.createElement(tag);
        if (classe) el.className = classe;
        if (texto !== undefined) el.textContent = texto;
        return el;
    }

    function linhaPrincipal(e) {
        return [e.nome_logradouro, e.numero].filter(Boolean).join(", ");
    }

    function linhaSecundaria(e) {
        const cidade = [e.cidade, e.estado].filter(Boolean).join("/");
        return [e.bairro, cidade, e.cep].filter(Boolean).join(" · ");
    }

    function criarOpcao(endereco, marcado) {
        const rotulo = criar("label", "opcaoEndereco");

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "enderecoEntrega";
        radio.value = endereco.cod_endereco;
        radio.checked = marcado;

        const texto = criar("span", "textoEndereco");
        texto.append(criar("strong", null, linhaPrincipal(endereco)));
        const detalhe = linhaSecundaria(endereco);
        if (detalhe) texto.append(criar("span", null, detalhe));

        rotulo.append(radio, texto);
        return rotulo;
    }

    function renderizar(enderecos) {
        if (!enderecos.length) {
            limparEscolhido();
            elLista.replaceChildren(
                criar("p", "enderecoVazio", "Você ainda não tem endereços cadastrados. Cadastre um no seu perfil para finalizar o pedido.")
            );
            return;
        }

        // mantém a escolha anterior se o endereço ainda existe; senão, usa o primeiro
        const anterior = obterEscolhido();
        const escolhido = enderecos.some(e => e.cod_endereco === anterior)
            ? anterior
            : enderecos[0].cod_endereco;
        guardarEscolhido(escolhido);

        elLista.replaceChildren(
            ...enderecos.map(e => criarOpcao(e, e.cod_endereco === escolhido))
        );
    }

    // ---------- backend ----------

    async function carregarEnderecos() {
        const token = localStorage.getItem("token");
        if (!token) {
            elLista.replaceChildren(
                criar("p", "enderecoVazio", "Entre na sua conta de comprador para escolher o endereço de entrega.")
            );
            return;
        }

        elLista.replaceChildren(criar("p", "enderecoVazio", "Carregando endereços..."));

        try {
            const resposta = await fetch(`${API_URL}/enderecos`, {
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            });

            let dados = {};
            try { dados = await resposta.json(); } catch (_) { /* sem JSON */ }
            if (!resposta.ok) throw new Error(dados.error || dados.msg || `Erro ${resposta.status}`);

            renderizar(Array.isArray(dados.enderecos) ? dados.enderecos : []);
            carregou = true;
        } catch (erro) {
            console.error("Erro ao carregar endereços:", erro);
            elLista.replaceChildren(
                criar("p", "enderecoVazio", `Não foi possível carregar os endereços: ${erro.message}`)
            );
        }
    }

    // ---------- eventos ----------

    elLista.addEventListener("change", evento => {
        const radio = evento.target;
        if (!radio.matches('input[name="enderecoEntrega"]')) return;
        guardarEscolhido(Number(radio.value));
        mostrarMensagem("");
    });

    // "Continuar" só avança com um endereço escolhido (o backend exige cod_endereco)
    document.getElementById("botaoContinuar")?.addEventListener("click", evento => {
        if (carregou && obterEscolhido() != null) return;

        evento.preventDefault();
        evento.stopImmediatePropagation();
        mostrarMensagem(
            carregou
                ? "Cadastre um endereço no seu perfil para continuar."
                : "Escolha um endereço de entrega para continuar.",
            true
        );
        document.getElementById("enderecoEntrega")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, true);

    window.EnderecoEntrega = { obter: obterEscolhido };

    carregarEnderecos();
})();