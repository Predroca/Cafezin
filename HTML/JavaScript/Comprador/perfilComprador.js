/*
Perfil do comprador
Os dados ficam no localStorage enquanto não há back-end.
Quando a API existir, troque ler() e salvar() por chamadas fetch.
*/
(function () {
    "use strict";

    const CHAVES = {
        perfil: "cafezinPerfil",
        enderecos: "cafezinEnderecos",
        favoritas: "cafezinFavoritas",
        sessao: "cafezinSessao"
    };

    const PAGINA_INICIAL_DESLOGADO = "index.html";
    const PAGINA_INICIAL_COMPRADOR = "indexComprador.html";

    /* ---------- Dados de exemplo (substitua pelos dados reais do back-end) ---------- */
    const PERFIL_PADRAO = {
        nome: "Ana",
        email: "ana@email.com",
        telefone: "(34) 9 9999-9999",
        nascimento: "",
        foto: ""
    };

    const ENDERECOS_PADRAO = [
        { id: 1, apelido: "Casa", rua: "Rua das Flores", numero: "120", bairro: "Centro", cidade: "Barbacena", principal: true }
    ];

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

    // Cria elementos sem innerHTML, para nunca interpretar texto digitado como HTML.
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

    let temporizadorAviso;
    function avisar(mensagem) {
        const aviso = $("aviso");
        aviso.textContent = mensagem;
        aviso.classList.add("visivel");
        clearTimeout(temporizadorAviso);
        temporizadorAviso = setTimeout(() => aviso.classList.remove("visivel"), 2800);
    }

    /* ---------- Estado ---------- */
    let perfil = Object.assign({}, PERFIL_PADRAO, ler(CHAVES.perfil, {}));
    let enderecos = ler(CHAVES.enderecos, ENDERECOS_PADRAO);
    let favoritas = ler(CHAVES.favoritas, FAVORITAS_PADRAO);

    /* ---------- Cabeçalho ---------- */
    function primeiroNome(nome) {
        return nome.trim().split(/\s+/)[0] || "Cliente";
    }

    function renderAvatar() {
        const avatar = $("avatar");
        avatar.textContent = "";
        if (perfil.foto) {
            const img = el("img");
            img.src = perfil.foto;
            img.alt = "";
            avatar.appendChild(img);
        } else {
            avatar.textContent = primeiroNome(perfil.nome).charAt(0).toUpperCase();
        }
    }

    function renderCabecalho() {
        $("perfilNome").textContent = perfil.nome;
        $("perfilEmail").textContent = perfil.email;
        $("resumoPedidos").textContent = PEDIDOS.length;
        $("resumoFavoritas").textContent = favoritas.length;
        $("resumoEnderecos").textContent = enderecos.length;
        renderAvatar();
    }

    $("avatarArquivo").addEventListener("change", function () {
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

    /* ---------- Abas ----------
       Todos os painéis ficam na área .perfilPaineis. Clicar numa aba só rola essa
       área (nunca a página inteira) e, ao rolar à mão, a aba ativa acompanha. */
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

    function abrirAba(nome, opcoes) {
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

    /* ---------- Meus dados ---------- */
    const formDados = $("formDados");
    const camposDados = { nome: $("campoNome"), email: $("campoEmail"), telefone: $("campoTelefone"), nascimento: $("campoNascimento") };

    function preencherForm() {
        Object.keys(camposDados).forEach(function (k) {
            camposDados[k].value = perfil[k] || "";
        });
        limparErros();
    }

    function mostrarErro(campo, mensagem) {
        const alvo = document.querySelector('[data-erro-para="' + campo.id + '"]');
        if (alvo) alvo.textContent = mensagem;
        campo.setAttribute("aria-invalid", mensagem ? "true" : "false");
        if (alvo) {
            campo.setAttribute("aria-describedby", alvo.id || (alvo.id = campo.id + "Erro"));
        }
    }

    function limparErros() {
        Object.values(camposDados).forEach((c) => mostrarErro(c, ""));
    }

    function formatarTelefone(valor) {
        const n = valor.replace(/\D/g, "").slice(0, 11);
        if (n.length <= 2) return n ? "(" + n : "";
        if (n.length <= 3) return "(" + n.slice(0, 2) + ") " + n.slice(2);
        if (n.length <= 7) return "(" + n.slice(0, 2) + ") " + n.slice(2, 3) + " " + n.slice(3);
        return "(" + n.slice(0, 2) + ") " + n.slice(2, 3) + " " + n.slice(3, 7) + "-" + n.slice(7);
    }

    camposDados.telefone.addEventListener("input", function () {
        this.value = formatarTelefone(this.value);
    });

    function validarDados() {
        limparErros();
        let primeiroInvalido = null;

        function falhar(campo, msg) {
            mostrarErro(campo, msg);
            if (!primeiroInvalido) primeiroInvalido = campo;
        }

        if (camposDados.nome.value.trim().length < 3) {
            falhar(camposDados.nome, "Digite seu nome completo.");
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(camposDados.email.value.trim())) {
            falhar(camposDados.email, "Digite um e-mail válido, como nome@email.com.");
        }
        if (camposDados.telefone.value.replace(/\D/g, "").length !== 11) {
            falhar(camposDados.telefone, "Digite o telefone com DDD e 9 dígitos.");
        }

        if (primeiroInvalido) primeiroInvalido.focus();
        return !primeiroInvalido;
    }

    formDados.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validarDados()) return;

        perfil.nome = camposDados.nome.value.trim();
        perfil.email = camposDados.email.value.trim();
        perfil.telefone = camposDados.telefone.value;
        perfil.nascimento = camposDados.nascimento.value;

        if (salvar(CHAVES.perfil, perfil)) {
            renderCabecalho();
            avisar("Dados salvos.");
        } else {
            avisar("Não foi possível salvar. Verifique o espaço do navegador.");
        }
    });

    $("descartarDados").addEventListener("click", function () {
        preencherForm();
        avisar("Alterações descartadas.");
    });

    /* ---------- Endereços ---------- */
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
        renderCabecalho();
        avisar("Endereço adicionado.");
    });

    function renderEnderecos() {
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
                renderCabecalho();
                avisar("Endereço excluído.");
            });
            acoes.appendChild(excluir);

            item.append(iconeBox, texto, acoes);
            lista.appendChild(item);
        });
    }

    /* ---------- Pedidos ---------- */
    function renderPedidos() {
        const lista = $("listaPedidos");
        lista.textContent = "";

        if (!PEDIDOS.length) {
            lista.appendChild(estadoVazio("receipt", "Você ainda não fez pedidos", "Seu primeiro Cafézin está a um clique.", "Ver cafeterias", PAGINA_INICIAL_COMPRADOR + "#cafeterias"));
            return;
        }

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

            item.append(info, lado);
            lista.appendChild(item);
        });
    }

    /* ---------- Favoritas ---------- */
    function renderFavoritas() {
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
                renderFavoritas();
                renderCabecalho();
                avisar(loja.nome + " saiu das favoritas.");
            });
            item.appendChild(remover);

            lista.appendChild(item);
        });
    }

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

    /* ---------- Sair da conta ---------- */
    const modalSair = $("modalSair");

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

    function sair() {
        // Encerra só a sessão. Quando houver token/cookie de login, remova-o aqui também.
        try {
            localStorage.removeItem(CHAVES.sessao);
            sessionStorage.clear();
        } catch (e) { /* navegador sem storage: segue para o início mesmo assim */ }

        window.location.replace(PAGINA_INICIAL_DESLOGADO);
    }

    /* ---------- Início ---------- */
    renderCabecalho();
    preencherForm();
    renderEnderecos();
    renderPedidos();
    renderFavoritas();

    const abaInicial = location.hash.replace("#", "");
    if (abas.some((a) => a.dataset.aba === abaInicial)) {
        abrirAba(abaInicial, { instantaneo: true });
    } else {
        marcarAba(abas[0].dataset.aba);
    }
})();
