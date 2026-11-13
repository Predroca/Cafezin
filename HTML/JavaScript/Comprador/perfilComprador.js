
(function () {
    "use strict";

    const CHAVES = {
        perfil: "cafezinPerfil",                                  // só a foto
        identificacao: "cafezinPerfilCompradorIdentificacao",     // gravada pelo script inline
        enderecos: "cafezinEnderecosComprador",                   // gravada pelo script inline
        favoritas: "cafezinFavoritas",
        sessao: "cafezinSessao",
        avaliacoes: "cafezinAvaliacoesComprador"
    };

    const PAGINA_INICIAL_DESLOGADO = "index.html";
    const PAGINA_INICIAL_COMPRADOR = "indexComprador.html";

    const FAVORITAS_PADRAO = [
        { id: 1, nome: "Boutique dos Pães", tipo: "Padaria · Cafeteria", sigla: "BP", nota: "4,9", cor: "" },
        { id: 2, nome: "Café Retiro", tipo: "Cafeteria artesanal", sigla: "CR", nota: "4,9", cor: "escura" }
    ];

    const PEDIDOS = [
        { codigo: "#1042", loja: "Empório do Café", itens: "Chocolate quente cremoso, Pão de queijo", data: "Hoje, 08:40", total: "R$ 27,50", status: "caminho" },
        { codigo: "#1031", loja: "Boutique dos Pães", itens: "Café coado, Croissant de queijo", data: "28 de setembro", total: "R$ 24,90", status: "entregue" },
        { codigo: "#1017", loja: "Grão & Cia", itens: "Cappuccino, Bolo de cenoura", data: "21 de setembro", total: "R$ 31,00", status: "entregue" },
        { codigo: "#1009", loja: "Café Retiro", itens: "Espresso duplo", data: "14 de setembro", total: "R$ 9,00", status: "cancelado" }
    ];

    const ROTULO_STATUS = { caminho: "A caminho", entregue: "Entregue", cancelado: "Cancelado" };

    /* ---------- Utilitários ---------- */
    function ler(chave, padrao) {
        try {
            const bruto = localStorage.getItem(chave);
            return bruto ? JSON.parse(bruto) : padrao;
        } catch (e) {
            return padrao;
        }
    }

    function salvar(chave, valor) {
        try {
            localStorage.setItem(chave, JSON.stringify(valor));
            return true;
        } catch (e) {
            return false;
        }
    }

    function el(tag, classe, texto) {
        const no = document.createElement(tag);
        if (classe) no.className = classe;
        if (texto !== undefined) no.textContent = texto;
        return no;
    }

    function icone(nome) {
        const i = el("i", "bi bi-" + nome);
        i.setAttribute("aria-hidden", "true");
        return i;
    }

    function $(id) {
        return document.getElementById(id);
    }

    function definirTexto(id, valor) {
        const no = $(id);
        if (no) no.textContent = valor;
    }

    let temporizadorAviso;
    function avisar(mensagem) {
        const aviso = $("aviso");
        if (!aviso) return;
        aviso.textContent = mensagem;
        aviso.classList.add("visivel");
        clearTimeout(temporizadorAviso);
        temporizadorAviso = setTimeout(() => aviso.classList.remove("visivel"), 2800);
    }

    /* ---------- Estado ---------- */
    let perfil = Object.assign({ foto: "" }, ler(CHAVES.perfil, {}));
    let favoritas = ler(CHAVES.favoritas, FAVORITAS_PADRAO);

    /* ---------- Cabeçalho (avatar e contagens) ---------- */
    function nomeAtual() {
        const ident = ler(CHAVES.identificacao, {});
        return (ident.nome || "").trim();
    }

    function renderAvatar() {
        const avatar = $("avatar");
        if (!avatar) return;
        avatar.textContent = "";
        if (perfil.foto) {
            const img = el("img");
            img.src = perfil.foto;
            img.alt = "";
            avatar.appendChild(img);
        } else {
            avatar.textContent = (nomeAtual().charAt(0) || "A").toUpperCase();
        }
    }

    function renderContagens() {
        definirTexto("resumoPedidos", PEDIDOS.length);
        definirTexto("resumoFavoritas", favoritas.length);
        definirTexto("resumoEnderecos", ler(CHAVES.enderecos, []).length);
    }

    const inputFoto = $("avatarArquivo");
    if (inputFoto) {
        inputFoto.addEventListener("change", function () {
            const arquivo = this.files[0];
            if (!arquivo) return;

            if (arquivo.size > 1024 * 1024) {
                avisar("Escolha uma foto de até 1 MB.");
                this.value = "";
                return;
            }

            const leitor = new FileReader();
            leitor.onload = function () {
                perfil.foto = leitor.result;
                if (salvar(CHAVES.perfil, perfil)) {
                    avisar("Foto atualizada.");
                } else {
                    avisar("Não foi possível guardar a foto. Tente uma imagem menor.");
                    perfil.foto = "";
                }
                renderAvatar();
            };
            leitor.readAsDataURL(arquivo);
        });
    }

    // Quando a identificação é salva (script inline), atualiza a inicial do avatar
    const formIdentificacao = $("formIdentificacaoComprador");
    if (formIdentificacao) {
        formIdentificacao.addEventListener("submit", function () {
            setTimeout(renderAvatar, 0);
        });
    }

    // Quando um endereço é salvo/excluído (script inline), atualiza a contagem
    const formEnderecoNovo = $("formEndereco");
    if (formEnderecoNovo) {
        formEnderecoNovo.addEventListener("submit", function () { setTimeout(renderContagens, 0); });
    }
    const listaEnd = $("listaEnderecos");
    if (listaEnd) {
        new MutationObserver(renderContagens).observe(listaEnd, { childList: true });
    }

    /* ---------- Abas ---------- */
    const abas = Array.from(document.querySelectorAll(".aba"));
    const areaPaineis = $("perfilPaineis");
    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");

    let abaAtual = null;
    let travaRolagem = false;
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
        const topo = Math.max(0, painel.offsetTop - folga);

        travaRolagem = true;
        clearTimeout(temporizadorTrava);
        temporizadorTrava = setTimeout(function () { travaRolagem = false; }, 250);

        areaPaineis.scrollTo({
            top: topo,
            behavior: instantaneo || reduzMovimento.matches ? "auto" : "smooth"
        });
    }

    function abrirAba(nome, opcoes) {
        const config = opcoes || {};
        marcarAba(nome, config.moverFoco);
        rolarParaPainel(nome, config.instantaneo);
    }

    function sincronizarAbaComRolagem() {
        quadroPendente = false;

        if (travaRolagem) {
            clearTimeout(temporizadorTrava);
            temporizadorTrava = setTimeout(function () { travaRolagem = false; }, 120);
            return;
        }

        const folga = parseFloat(getComputedStyle(areaPaineis).paddingTop) || 0;
        const referencia = areaPaineis.scrollTop + areaPaineis.clientHeight * 0.2;
        let nome = abas[0].dataset.aba;

        abas.forEach(function (aba) {
            const painel = $("painel-" + aba.dataset.aba);
            if (painel && painel.offsetTop - folga <= referencia) nome = aba.dataset.aba;
        });

        const noFim = areaPaineis.scrollTop + areaPaineis.clientHeight >= areaPaineis.scrollHeight - 2;
        if (noFim) nome = abas[abas.length - 1].dataset.aba;

        if (nome !== abaAtual) marcarAba(nome);
    }

    areaPaineis.addEventListener("scroll", function () {
        if (quadroPendente) return;
        quadroPendente = true;
        requestAnimationFrame(sincronizarAbaComRolagem);
    }, { passive: true });

    abas.forEach(function (aba, indice) {
        aba.addEventListener("click", function (e) {
            e.preventDefault();
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

    document.querySelectorAll("[data-ir-aba]").forEach(function (link) {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            abrirAba(link.dataset.irAba);
        });
    });

    /* ---------- Estado vazio ---------- */
    function estadoVazio(nomeIcone, titulo, texto, rotuloLink, href) {
        const li = el("li", "estadoVazio");
        li.appendChild(icone(nomeIcone));
        li.appendChild(el("strong", "", titulo));
        li.appendChild(el("span", "", texto));
        if (rotuloLink) {
            const a = el("a", "", rotuloLink);
            a.href = href;
            li.appendChild(a);
        }
        return li;
    }

    /* ---------- Pedidos ---------- */
function renderPedidos() {
    const lista = $("listaPedidos");
    if (!lista) return;
    lista.textContent = "";

    if (!PEDIDOS.length) {
        lista.appendChild(estadoVazio("receipt", "Você ainda não fez pedidos", "Seu primeiro Cafézin está a um clique.", "Ver cafeterias", PAGINA_INICIAL_COMPRADOR + "#cafeterias"));
        return;
    }

    const avaliacoes = ler(CHAVES.avaliacoes, {});

    PEDIDOS.forEach(function (pedido) {
        const item = el("li", "itemPedido");

        const info = el("div");
        const topo = el("div", "itemPedidoTopo");
        topo.appendChild(el("h3", "", pedido.loja));
        topo.appendChild(el("span", "status " + pedido.status, ROTULO_STATUS[pedido.status]));
        info.appendChild(topo);
        info.appendChild(el("p", "", pedido.itens));
        info.appendChild(el("p", "", pedido.codigo + " · " + pedido.data));

        const lado = el("div", "itemPedidoLado");
        lado.appendChild(el("strong", "", pedido.total));
        const pedirDeNovo = el("a", "linkPedir", pedido.status === "caminho" ? "Acompanhar" : "Pedir de novo");
        pedirDeNovo.href = PAGINA_INICIAL_COMPRADOR + "#produtos";
        lado.appendChild(pedirDeNovo);

        item.appendChild(info);

        if (pedido.status === "entregue") {
            const jaAvaliou = !!avaliacoes[pedido.codigo];
            const avaliar = el("button", "botaoSecundario pequeno botaoAvaliar", jaAvaliou ? "Editar avaliação" : "Avaliar");
            avaliar.type = "button";
            avaliar.addEventListener("click", function () { abrirAvaliacao(pedido); });
            item.appendChild(avaliar);
        }

        item.appendChild(lado);
        lista.appendChild(item);
    });
}

function abrirAvaliacao(pedido) {
    const modal = $("modal-avaliar");
    const form = $("formAvaliar");
    if (!modal || !form) return;

    definirTexto("avaliarLoja", pedido.loja);
    definirTexto("avaliarItens", pedido.itens);
    definirTexto("avaliarMeta", pedido.codigo + " · " + pedido.data);
    definirTexto("avaliarTotal", pedido.total);
    definirTexto("erroAvaliar", "");

    form.reset();
    const anterior = ler(CHAVES.avaliacoes, {})[pedido.codigo];
    if (anterior) {
        const radio = form.querySelector('input[name="nota"][value="' + anterior.nota + '"]');
        if (radio) radio.checked = true;
        $("avaliarComentario").value = anterior.comentario || "";
    }

    modal.dataset.pedidoId = pedido.codigo;
    modal.showModal();
}

function renderAvaliacao() {
    const modal = $("modal-avaliar");
    const form = $("formAvaliar");
    if (!modal || !form) return;

    modal.querySelectorAll("[data-fechar-modal]").forEach(function (botao) {
        botao.addEventListener("click", function () { modal.close(); });
    });
    modal.addEventListener("click", function (e) {
        if (e.target === modal) modal.close();
    });

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        const nota = form.querySelector('input[name="nota"]:checked');
        if (!nota) {
            definirTexto("erroAvaliar", "Escolha uma nota de 1 a 5 estrelas.");
            return;
        }

        const avaliacoes = ler(CHAVES.avaliacoes, {});
        avaliacoes[modal.dataset.pedidoId] = {
            nota: Number(nota.value),
            comentario: $("avaliarComentario").value.trim(),
            data: new Date().toISOString()
        };
        if (!salvar(CHAVES.avaliacoes, avaliacoes)) {
            definirTexto("erroAvaliar", "Não foi possível salvar a avaliação neste navegador.");
            return;
        }

        modal.close();
        renderPedidos();
        avisar("Avaliação enviada. Obrigado!");
    });
}

    /* ---------- Favoritas ---------- */
    function renderFavoritas() {
        const lista = $("listaFavoritas");
        if (!lista) return;
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
                renderFavoritas();
                renderContagens();
                avisar(loja.nome + " saiu das favoritas.");
            });
            item.appendChild(remover);

            lista.appendChild(item);
        });
    }

    /* ---------- Sair da conta ---------- */
    const modalSair = $("modalSair");

    function sair() {
        try {
            localStorage.removeItem(CHAVES.sessao);
            sessionStorage.clear();
        } catch (e) { /* segue mesmo sem storage */ }
        window.location.replace(PAGINA_INICIAL_DESLOGADO);
    }

    const botaoAbrirSair = $("abrirSair");
    if (botaoAbrirSair && modalSair) {
        botaoAbrirSair.addEventListener("click", function () {
            if (typeof modalSair.showModal === "function") {
                modalSair.showModal();
                $("cancelarSair").focus();
            } else if (window.confirm("Sair da sua conta?")) {
                sair();
            }
        });

        $("cancelarSair").addEventListener("click", () => modalSair.close());

        modalSair.addEventListener("click", function (e) {
            const caixa = modalSair.getBoundingClientRect();
            const fora = e.clientX < caixa.left || e.clientX > caixa.right || e.clientY < caixa.top || e.clientY > caixa.bottom;
            if (fora) modalSair.close();
        });

        $("confirmarSair").addEventListener("click", sair);
    }

    /* ---------- Início ---------- */
    renderAvatar();
    renderContagens();
    renderAvaliacao();
    renderPedidos();
    renderFavoritas();

    const abaInicial = location.hash.replace("#", "");
    if (abas.some((a) => a.dataset.aba === abaInicial)) {
        abrirAba(abaInicial, { instantaneo: true });
    } else {
        marcarAba(abas[0].dataset.aba);
    }
})();
