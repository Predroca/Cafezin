/*
 * Cafézin - perfil do comprador (PerfilComprador.html)
 *
 * Rotas utilizadas:
 *   GET    /comprador/perfil                       dados do comprador (vêm do token)
 *   PATCH  /comprador/perfil                       editar dados
 *   GET    /enderecos                              listar endereços
 *   POST   /enderecos                              criar endereço
 *   DELETE /enderecos/<cod_endereco>               remover endereço
 *   GET    /favoritas                              lojas favoritas
 *   DELETE /favoritas/<cod_loja>                   remover favorita
 *   GET    /comprador/pedidos                      pedidos (com "avaliacoes" e "tem_entrega")
 *   POST   /pedidos/<cod_pedido>/avaliar/loja        avaliar a loja
 *   POST   /pedidos/<cod_pedido>/avaliar/produto     avaliar um produto do pedido
 *   POST   /pedidos/<cod_pedido>/avaliar/entregador  avaliar o entregador
 *
 * Corpo das avaliações: { nota: 1..5, descricao: texto|null } (+ cod_produto no produto).
 * Para EDITAR, o mesmo POST é reenviado (o backend atualiza a avaliação existente).
 */

(() => {
    "use strict";

    // ==========================================
    // CONFIGURAÇÕES
    // ==========================================

    const API_BASE = "http://127.0.0.1:5000";
    const TOKEN_KEY = "token";
    const PAGINA_LOGIN = "login.html";

    // O backend não tem colunas "apelido" e "tipo" no endereço. Esses dois campos
    // do formulário ficam guardados só neste navegador, ligados ao cod_endereco.
    const ENDERECOS_META_KEY = "cafezinEnderecosMeta";

    const ROTAS = {
        perfil: "/comprador/perfil",
        pedidos: "/comprador/pedidos",
        favoritas: "/favoritas",
        enderecos: "/enderecos",
        avaliar: (codPedido, tipo) => `/pedidos/${codPedido}/avaliar/${tipo}`
    };

    const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
    const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];

    let perfilAtual = null;


    // ==========================================
    // AUTENTICAÇÃO E REQUISIÇÕES
    // ==========================================

    function irParaLogin() {
        window.location.href = PAGINA_LOGIN;
    }

    async function requisicao(url, metodo = "GET", dados = null) {

        const token = localStorage.getItem(TOKEN_KEY);

        if (!token) {
            irParaLogin();
            throw new Error("Faça login para continuar.");
        }

        const headers = {
            "Accept": "application/json",
            "Authorization": `Bearer ${token}`
        };

        const configuracao = { method: metodo, headers };

        if (dados !== null) {
            headers["Content-Type"] = "application/json";
            configuracao.body = JSON.stringify(dados);
        }

        let resposta;

        try {
            resposta = await fetch(`${API_BASE}${url}`, configuracao);
        } catch {
            throw new Error("Não foi possível conectar ao servidor.");
        }

        const tipo = resposta.headers.get("content-type") || "";

        const resultado = tipo.includes("application/json")
            ? await resposta.json().catch(() => ({}))
            : await resposta.text();

        // token expirado (401) ou inválido (422)
        if (resposta.status === 401 || resposta.status === 422) {
            localStorage.removeItem(TOKEN_KEY);
            mostrarAviso("Sua sessão expirou. Faça login novamente.");
            setTimeout(irParaLogin, 1200);
            throw new Error("Sua sessão expirou. Faça login novamente.");
        }

        if (!resposta.ok) {
            const mensagem = resultado && typeof resultado === "object"
                ? (resultado.error || resultado.erro || resultado.msg)
                : null;

            throw new Error(mensagem || `Erro na requisição: ${resposta.status}`);
        }

        return resultado;
    }


    // ==========================================
    // AVISOS E FORMATAÇÃO
    // ==========================================

    function mostrarAviso(mensagem) {

        const aviso = $("#aviso");

        if (!aviso) {
            alert(mensagem);
            return;
        }

        aviso.textContent = mensagem;
        aviso.classList.add("visivel");

        clearTimeout(window.avisoTimer);

        window.avisoTimer = setTimeout(() => {
            aviso.classList.remove("visivel");
        }, 3500);
    }

    function formatarData(data) {

        if (!data) return "Não informada";

        const partes = data.split("-");

        if (partes.length !== 3) return data;

        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    function formatarDataHora(data) {

        if (!data) return "Data não informada";

        const valor = new Date(data);

        if (Number.isNaN(valor.getTime())) return data;

        return valor.toLocaleString("pt-BR");
    }

    function formatarMoeda(valor) {

        return Number(valor || 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
        });
    }

    function formatarCep(cep) {

        const numeros = String(cep || "").replace(/\D/g, "");

        return numeros.length === 8
            ? `${numeros.slice(0, 5)}-${numeros.slice(5)}`
            : (cep || "Não informado");
    }

    function estrelas(nota) {

        const n = Math.max(0, Math.min(5, Number(nota) || 0));

        return "★".repeat(n) + "☆".repeat(5 - n);
    }

    // cria um elemento já com classe e texto (sempre via textContent)
    function criar(tag, classe, texto) {

        const elemento = document.createElement(tag);

        if (classe) elemento.className = classe;
        if (texto !== undefined) elemento.textContent = texto;

        return elemento;
    }

    // bloco .estadoVazio do CSS: ícone + título + texto + link opcional
    function criarEstadoVazio(lista, icone, titulo, texto, link) {

        const item = criar("li", "estadoVazio");

        const simbolo = criar("i", `bi ${icone}`);
        simbolo.setAttribute("aria-hidden", "true");

        item.append(simbolo, criar("strong", "", titulo));

        if (texto) item.append(criar("span", "", texto));

        if (link) {
            const anchor = criar("a", "", link.texto);
            anchor.href = link.href;
            item.append(anchor);
        }

        lista.replaceChildren(item);
    }

    const LINK_CAFETERIAS = { texto: "Ver cafeterias", href: "indexComprador.html#cafeterias" };


    // ==========================================
    // IDENTIFICAÇÃO DO COMPRADOR (GET/PATCH /comprador/perfil)
    // ==========================================

    async function carregarPerfil() {

        const perfil = await requisicao(ROTAS.perfil);

        exibirPerfil(perfil);

        return perfil;
    }

    function exibirPerfil(dados) {

        perfilAtual = dados;

        const nome = dados.nome || "Comprador";
        const email = dados.email || "E-mail não informado";

        if ($("#perfilNome")) $("#perfilNome").textContent = nome;
        if ($("#perfilEmail")) $("#perfilEmail").textContent = email;

        const valores = {
            nome: dados.nome,
            email: dados.email,
            telefone: dados.telefone,
            nascimento: dados.data_nasc
        };

        Object.entries(valores).forEach(([campo, valor]) => {

            const elemento = $(`[data-comprador-valor="${campo}"]`);

            if (!elemento) return;

            elemento.textContent = campo === "nascimento"
                ? formatarData(valor)
                : (valor || "Não informado");
        });

        // campos do formulário de edição

        const campos = {
            nome: $("#campoNomeComprador"),
            email: $("#campoEmailComprador"),
            telefone: $("#campoTelefoneComprador"),
            nascimento: $("#campoNascimentoComprador")
        };

        Object.entries(campos).forEach(([campo, input]) => {

            if (!input) return;

            const propriedade = campo === "nascimento" ? "data_nasc" : campo;

            input.value = dados[propriedade] || "";
        });

        // avatar: foto, se existir; senão a inicial do nome

        const avatar = $("#avatar");

        if (avatar) {
            if (dados.foto_url) {
                const imagem = document.createElement("img");
                imagem.src = dados.foto_url;
                imagem.alt = "";
                avatar.replaceChildren(imagem);
            } else {
                avatar.textContent = nome.charAt(0).toUpperCase();
            }
        }

        if (dados.resumo) atualizarResumo(dados.resumo);
    }

    function configurarIdentificacao() {

        const modal = $("#modal-identificacao");
        const formulario = $("#formIdentificacaoComprador");

        if (!modal || !formulario) return;

        const mensagem = $("#mensagemIdentificacaoComprador");

        $$('[data-abrir-modal="modal-identificacao"]').forEach(botao => {

            botao.addEventListener("click", () => {

                // preenche o formulário com os dados já carregados
                if (perfilAtual) exibirPerfil(perfilAtual);

                if (mensagem) mensagem.textContent = "";

                modal.showModal();
            });
        });

        $$("[data-fechar-modal]", modal).forEach(botao => {
            botao.addEventListener("click", () => modal.close());
        });

        modal.addEventListener("click", evento => {
            if (evento.target === modal) modal.close();
        });

        formulario.addEventListener("submit", async evento => {

            evento.preventDefault();

            if (!formulario.reportValidity()) return;

            const novos = {
                nome: $("#campoNomeComprador").value.trim(),
                email: $("#campoEmailComprador").value.trim(),
                telefone: $("#campoTelefoneComprador").value.trim(),
                data_nasc: $("#campoNascimentoComprador").value || null
            };

            const atuais = {
                nome: perfilAtual?.nome,
                email: perfilAtual?.email,
                telefone: perfilAtual?.telefone,
                data_nasc: perfilAtual?.data_nasc
            };

            // PATCH: envia só o que mudou (o backend ignora o que não vier no corpo)
            const dados = {};

            Object.keys(novos).forEach(campo => {
                if ((novos[campo] ?? "") !== (atuais[campo] ?? "")) {
                    dados[campo] = novos[campo];
                }
            });

            if (Object.keys(dados).length === 0) {
                modal.close();
                mostrarAviso("Nenhuma alteração para salvar.");
                return;
            }

            const botao = $('button[type="submit"]', formulario);

            if (botao) botao.disabled = true;
            if (mensagem) mensagem.textContent = "";

            try {

                const atualizado = await requisicao(ROTAS.perfil, "PATCH", dados);

                exibirPerfil(atualizado);

                modal.close();

                mostrarAviso("Dados atualizados com sucesso!");

            } catch (erro) {

                if (mensagem) {
                    mensagem.textContent = erro.message;
                } else {
                    mostrarAviso(erro.message);
                }

            } finally {

                if (botao) botao.disabled = false;
            }
        });
    }


    // ==========================================
    // RESUMO DA CONTA
    // ==========================================

    function atualizarResumo(resumo = {}) {

        const destinos = {
            pedidos: $("#resumoPedidos"),
            favoritas: $("#resumoFavoritas"),
            enderecos: $("#resumoEnderecos")
        };

        Object.entries(destinos).forEach(([campo, elemento]) => {
            if (elemento && resumo[campo] !== undefined) {
                elemento.textContent = resumo[campo];
            }
        });
    }


    // ==========================================
    // ENDEREÇOS (GET/POST /enderecos, DELETE /enderecos/<id>)
    // ==========================================

    function lerMetaEnderecos() {
        try {
            return JSON.parse(localStorage.getItem(ENDERECOS_META_KEY)) || {};
        } catch {
            return {};
        }
    }

    function salvarMetaEnderecos(meta) {
        try {
            localStorage.setItem(ENDERECOS_META_KEY, JSON.stringify(meta));
        } catch {
            /* sem espaço: o endereço continua salvo no banco */
        }
    }

    async function configurarEnderecos() {

        const formulario = $("#formEndereco");
        const lista = $("#listaEnderecos");
        const botaoNovo = $("#alternarNovoEndereco");
        const modal = $("#modal-endereco");

        if (!formulario || !lista || !botaoNovo || !modal) return;

        const campos = {
            apelido: $("#endApelido"),
            tipo: $("#endTipo"),
            rua: $("#endRua"),
            numero: $("#endNumero"),
            bairro: $("#endBairro"),
            cidade: $("#endCidade"),
            estado: $("#endEstado"),
            cep: $("#endCep")
        };

        const mensagem = $("#erroEndereco");

        let enderecos = [];

        // ---------- carregar ----------

        async function carregarEnderecos() {

            const resposta = await requisicao(ROTAS.enderecos);

            enderecos = resposta.enderecos || [];

            renderizar();
        }

        // ---------- renderizar ----------

        function renderizar() {

            lista.replaceChildren();

            if (enderecos.length === 0) {
                criarEstadoVazio(
                    lista,
                    "bi-geo-alt",
                    "Você ainda não cadastrou nenhum endereço.",
                    "Cadastre um endereço para receber seus cafés."
                );
            }

            const meta = lerMetaEnderecos();

            enderecos.forEach(endereco => {

                const extra = meta[endereco.cod_endereco] || {};

                const item = criar("li", "itemEndereco");

                const icone = criar("div", "itemEnderecoIcone");
                icone.innerHTML = '<i class="bi bi-geo-alt-fill" aria-hidden="true"></i>';

                const conteudo = criar("div", "itemEnderecoConteudo");

                conteudo.append(criar("h3", "", extra.apelido || "Endereço"));

                if (extra.tipo) {
                    conteudo.append(criar("p", "", `Tipo: ${extra.tipo}`));
                }

                conteudo.append(
                    criar("p", "", `${endereco.nome_logradouro || ""}, ${endereco.numero || "S/N"}`),
                    criar("p", "", `${endereco.bairro || ""} — ${endereco.cidade || ""}/${endereco.estado || ""}`),
                    criar("p", "", `CEP: ${formatarCep(endereco.cep)}`)
                );

                const acoes = criar("div", "itemAcoes");

                const excluir = criar("button", "botaoIcone excluir");
                excluir.type = "button";
                excluir.title = "Excluir endereço";
                excluir.setAttribute("aria-label", "Excluir endereço");
                excluir.innerHTML = '<i class="bi bi-trash3-fill" aria-hidden="true"></i>';

                excluir.addEventListener("click", () => {
                    excluirEndereco(endereco, extra, excluir);
                });

                acoes.append(excluir);
                item.append(icone, conteudo, acoes);
                lista.append(item);
            });

            atualizarResumo({ enderecos: enderecos.length });
        }

        // ---------- excluir ----------

        async function excluirEndereco(endereco, extra, botao) {

            const nome = extra.apelido || endereco.nome_logradouro || "este endereço";

            if (!window.confirm(`Deseja realmente excluir "${nome}"?`)) return;

            botao.disabled = true;

            try {

                await requisicao(
                    `${ROTAS.enderecos}/${encodeURIComponent(endereco.cod_endereco)}`,
                    "DELETE"
                );

                const meta = lerMetaEnderecos();
                delete meta[endereco.cod_endereco];
                salvarMetaEnderecos(meta);

                // só atualiza a tela depois que o banco confirmar
                enderecos = enderecos.filter(
                    item => item.cod_endereco !== endereco.cod_endereco
                );

                renderizar();

                mostrarAviso("Endereço excluído com sucesso!");

            } catch (erro) {

                console.error("Erro ao excluir endereço:", erro);

                mostrarAviso(`Não foi possível excluir o endereço: ${erro.message}`);

                botao.disabled = false;
            }
        }

        // ---------- modal ----------

        function fechar() {

            formulario.reset();

            if (mensagem) mensagem.textContent = "";

            if (modal.open) modal.close();

            botaoNovo.setAttribute("aria-expanded", "false");
        }

        botaoNovo.addEventListener("click", () => {

            formulario.reset();

            if (mensagem) mensagem.textContent = "";

            modal.showModal();

            botaoNovo.setAttribute("aria-expanded", "true");

            campos.apelido?.focus();
        });

        $("#cancelarEndereco")?.addEventListener("click", fechar);
        $("#fecharModalEndereco")?.addEventListener("click", fechar);

        modal.addEventListener("click", evento => {
            if (evento.target === modal) fechar();
        });

        modal.addEventListener("close", () => {
            botaoNovo.setAttribute("aria-expanded", "false");
        });

        // ---------- cadastrar ----------

        formulario.addEventListener("submit", async evento => {

            evento.preventDefault();

            if (!formulario.reportValidity()) return;

            const dados = {
                nome_logradouro: campos.rua.value.trim(),
                numero: campos.numero.value.trim(),
                bairro: campos.bairro.value.trim(),
                cidade: campos.cidade.value.trim(),
                estado: campos.estado.value.trim().toUpperCase(),
                cep: campos.cep.value.replace(/\D/g, "")
            };

            const botao = $('button[type="submit"]', formulario);

            if (botao) botao.disabled = true;
            if (mensagem) mensagem.textContent = "";

            try {

                const criado = await requisicao(ROTAS.enderecos, "POST", dados);

                // apelido e tipo ficam só neste navegador (ver ENDERECOS_META_KEY)
                const apelido = campos.apelido.value.trim();
                const tipo = campos.tipo.value;

                if (criado.cod_endereco != null && (apelido || tipo)) {
                    const meta = lerMetaEnderecos();
                    meta[criado.cod_endereco] = { apelido, tipo };
                    salvarMetaEnderecos(meta);
                }

                await carregarEnderecos();

                fechar();

                mostrarAviso("Endereço cadastrado com sucesso!");

            } catch (erro) {

                console.error("Erro ao cadastrar endereço:", erro);

                if (mensagem) {
                    mensagem.textContent = erro.message;
                } else {
                    mostrarAviso(`Não foi possível cadastrar: ${erro.message}`);
                }

            } finally {

                if (botao) botao.disabled = false;
            }
        });

        // ---------- máscaras ----------

        campos.cep?.addEventListener("input", () => {

            const numeros = campos.cep.value.replace(/\D/g, "").slice(0, 8);

            campos.cep.value = numeros.length > 5
                ? `${numeros.slice(0, 5)}-${numeros.slice(5)}`
                : numeros;
        });

        campos.estado?.addEventListener("input", () => {

            campos.estado.value = campos.estado.value
                .replace(/[^a-z]/gi, "")
                .toUpperCase()
                .slice(0, 2);
        });

        // carrega os endereços assim que a seção é configurada

        try {
            await carregarEnderecos();
        } catch (erro) {
            console.error("Erro ao carregar endereços:", erro);
            criarEstadoVazio(lista, "bi-exclamation-circle", "Não foi possível carregar seus endereços.", "Tente recarregar a página.");
            throw erro;
        }
    }


    // ==========================================
    // CAFETERIAS FAVORITAS (GET /favoritas, DELETE /favoritas/<cod_loja>)
    // ==========================================

    let favoritas = [];

    async function carregarFavoritas() {

        const lista = $("#listaFavoritas");

        if (!lista) return;

        const resposta = await requisicao(ROTAS.favoritas);

        favoritas = Array.isArray(resposta) ? resposta : (resposta.favoritas || []);

        renderizarFavoritas();
    }

    // variações de cor do .logoFavorita (a primeira é a cor padrão)
    const VARIANTES_LOGO = ["", "clara", "escura", "marrom"];

    // "Boutique dos Pães" -> "BP"
    function iniciais(nome) {

        const palavras = String(nome || "").split(/\s+/).filter(Boolean);
        const principais = palavras.filter(p => p.length > 3);
        const base = principais.length ? principais : palavras;

        return base.slice(0, 2).map(p => p.charAt(0)).join("").toUpperCase() || "?";
    }

    function renderizarFavoritas() {

        const lista = $("#listaFavoritas");

        if (!lista) return;

        lista.replaceChildren();

        if (favoritas.length === 0) {
            criarEstadoVazio(
                lista,
                "bi-heart",
                "Você ainda não possui cafeterias favoritas.",
                "Favorite uma cafeteria para encontrá-la mais rápido.",
                LINK_CAFETERIAS
            );
        }

        favoritas.forEach((loja, indice) => {

            const item = criar("li", "itemFavorita");

            const variante = VARIANTES_LOGO[indice % VARIANTES_LOGO.length];
            const logo = criar("div", `logoFavorita ${variante}`.trim(), iniciais(loja.nome));
            logo.setAttribute("aria-hidden", "true");

            if (loja.foto_url) {
                logo.textContent = "";
                logo.style.backgroundImage = `url("${encodeURI(loja.foto_url)}")`;
                logo.style.backgroundSize = "cover";
                logo.style.backgroundPosition = "center";
            }

            const texto = criar("div", "itemFavoritaTexto");

            texto.append(criar("h3", "", loja.nome));

            if (loja.horario_abertura && loja.horario_fecha) {
                texto.append(criar(
                    "p",
                    "",
                    `Funcionamento: ${loja.horario_abertura} às ${loja.horario_fecha}`
                ));
            }

            const remover = criar("button", "botaoIcone coracao");
            remover.type = "button";
            remover.title = "Remover dos favoritos";
            remover.setAttribute("aria-label", `Remover ${loja.nome} dos favoritos`);
            remover.innerHTML = '<i class="bi bi-heart-fill" aria-hidden="true"></i>';

            remover.addEventListener("click", () => removerFavorita(loja, remover));

            item.append(logo, texto, remover);
            lista.append(item);
        });

        atualizarResumo({ favoritas: favoritas.length });
    }

    async function removerFavorita(loja, botao) {

        if (!window.confirm(`Remover "${loja.nome}" dos favoritos?`)) return;

        botao.disabled = true;

        try {

            await requisicao(
                `${ROTAS.favoritas}/${encodeURIComponent(loja.cod_loja)}`,
                "DELETE"
            );

            favoritas = favoritas.filter(item => item.cod_loja !== loja.cod_loja);

            renderizarFavoritas();

            mostrarAviso("Loja removida dos favoritos.");

        } catch (erro) {

            console.error("Erro ao remover favorita:", erro);

            mostrarAviso(`Não foi possível remover: ${erro.message}`);

            botao.disabled = false;
        }
    }


    // ==========================================
    // PEDIDOS E AVALIAÇÕES
    // ==========================================

    let pedidos = [];
    let pedidoEmAvaliacao = null;

    async function carregarPedidos() {

        const lista = $("#listaPedidos");

        if (!lista) return;

        const resposta = await requisicao(ROTAS.pedidos);

        pedidos = resposta.pedidos || [];

        renderizarPedidos();
    }

    // status do backend -> variação do .status no CSS
    const CLASSE_STATUS = {
        "Pendente": "caminho",
        "Em preparo": "caminho",
        "Em andamento": "caminho",
        "Entregue": "entregue",
        "Cancelado": "cancelado"
    };

    function renderizarPedidos() {

        const lista = $("#listaPedidos");

        if (!lista) return;

        lista.replaceChildren();

        if (pedidos.length === 0) {
            criarEstadoVazio(
                lista,
                "bi-receipt",
                "Você ainda não realizou pedidos.",
                "Quando você pedir, o acompanhamento aparece aqui.",
                LINK_CAFETERIAS
            );
        }

        pedidos.forEach(pedido => {

            const item = criar("li", "itemPedido");

            // coluna 1: título + status, data, itens e avaliação
            const info = criar("div", "itemPedidoInfo");

            const topo = criar("div", "itemPedidoTopo");

            topo.append(
                criar("h3", "", `Pedido #${pedido.cod_pedido} — ${pedido.loja}`),
                criar(
                    "span",
                    `status ${CLASSE_STATUS[pedido.status] || ""}`.trim(),
                    pedido.status_tela || pedido.status
                )
            );

            const resumoItens = (pedido.itens || [])
                .map(i => `${i.quantidade}x ${i.produto}`)
                .join(" · ");

            info.append(
                topo,
                criar("p", "", formatarDataHora(pedido.data_pedido)),
                criar("p", "", resumoItens || "Sem itens")
            );

            listarAvaliacoesDoPedido(pedido).forEach(av => {

                const linha = criar("p", "pedidoAvaliacao", `${av.rotulo}: `);

                const estrelasNota = criar("span", "pedidoNota", estrelas(av.nota));
                estrelasNota.setAttribute("aria-label", `${av.nota} de 5 estrelas`);

                linha.append(estrelasNota);
                info.append(linha);

                if (av.descricao) {
                    info.append(criar("p", "pedidoComentario", `“${av.descricao}”`));
                }
            });

            // coluna 2: total
            const lado = criar("div", "itemPedidoLado");
            lado.append(criar("strong", "", formatarMoeda(pedido.valor_total)));

            item.append(info, lado);

            // coluna 3: só pedidos entregues podem ser avaliados
            if (pedido.status === "Entregue") {

                const botao = criar(
                    "button",
                    "botaoSecundario pequeno botaoAvaliar",
                    temAvaliacao(pedido) ? "Editar avaliações" : "Avaliar pedido"
                );
                botao.type = "button";
                botao.addEventListener("click", () => abrirAvaliacao(pedido));

                item.append(botao);
            }

            lista.append(item);
        });

        atualizarResumo({ pedidos: pedidos.length });
    }

    // avaliações já feitas, em lista: [{ rotulo, nota, descricao }]
    function listarAvaliacoesDoPedido(pedido) {

        const av = pedido.avaliacoes || {};
        const linhas = [];

        if (av.loja) linhas.push({ rotulo: "Loja", ...av.loja });
        if (av.entregador) linhas.push({ rotulo: "Entregador", ...av.entregador });

        Object.entries(av.produtos || {}).forEach(([codProduto, avaliacao]) => {

            const item = (pedido.itens || []).find(i => String(i.cod_produto) === codProduto);

            linhas.push({ rotulo: item ? item.produto : `Produto ${codProduto}`, ...avaliacao });
        });

        return linhas;
    }

    function temAvaliacao(pedido) {
        return listarAvaliacoesDoPedido(pedido).length > 0;
    }

    // o que pode ser avaliado neste pedido
    // O que pode ser avaliado neste pedido
function montarAlvos(pedido) {

    const alvos = [
        {
            chave: "loja",
            tipo: "loja",
            rotulo: `Loja — ${pedido.loja}`
        }
    ];

    const vistos = new Set();

    (pedido.itens || []).forEach(item => {

        if (item.cod_produto == null || vistos.has(item.cod_produto)) return;

        vistos.add(item.cod_produto);

        alvos.push({
            chave: `produto-${item.cod_produto}`,
            tipo: "produto",
            cod_produto: item.cod_produto,
            rotulo: `Produto — ${item.produto}`
        });
    });

    return alvos;
}

    function avaliacaoExistente(pedido, alvo) {

        const av = pedido.avaliacoes || {};

        return alvo.tipo === "produto"
            ? (av.produtos || {})[String(alvo.cod_produto)] || null
            : av[alvo.tipo] || null;
    }

    function guardarAvaliacao(pedido, alvo, avaliacao) {

        if (!pedido.avaliacoes) {
            pedido.avaliacoes = { loja: null, entregador: null, produtos: {} };
        }
        if (!pedido.avaliacoes.produtos) pedido.avaliacoes.produtos = {};

        if (alvo.tipo === "produto") {
            pedido.avaliacoes.produtos[String(alvo.cod_produto)] = avaliacao;
        } else {
            pedido.avaliacoes[alvo.tipo] = avaliacao;
        }
    }

    let alvosAvaliacao = [];

    function configurarAvaliacao() {

        const modal = $("#modal-avaliar");
        const formulario = $("#formAvaliar");

        if (!modal || !formulario) return;

        // seletor "o que você quer avaliar?" (usa .campo e o select já estilizado no CSS)
        if (!$("#avaliarAlvo")) {

            const campo = criar("div", "campo");
            campo.style.gridColumn = "span 2";

            const rotulo = criar("label", "", "O que você quer avaliar?");
            rotulo.htmlFor = "avaliarAlvo";

            const select = document.createElement("select");
            select.id = "avaliarAlvo";

            campo.append(rotulo, select);

            formulario.insertBefore(campo, $(".avaliarNota", formulario));

            select.addEventListener("change", preencherAlvoSelecionado);
        }

        $$("[data-fechar-modal]", modal).forEach(botao => {
            botao.addEventListener("click", () => modal.close());
        });

        modal.addEventListener("click", evento => {
            if (evento.target === modal) modal.close();
        });

        formulario.addEventListener("submit", async evento => {

            evento.preventDefault();

            if (!pedidoEmAvaliacao) return;

            const erro = $("#erroAvaliar");
            const selecionada = $('input[name="nota"]:checked', formulario);
            const alvo = alvosAvaliacao.find(a => a.chave === $("#avaliarAlvo").value);

            if (erro) erro.textContent = "";

            if (!alvo) return;

            if (!selecionada) {
                if (erro) erro.textContent = "Escolha uma nota de 1 a 5 estrelas.";
                return;
            }

            const dados = {
                nota: Number(selecionada.value),
                descricao: $("#avaliarComentario").value.trim() || null
            };

            if (alvo.tipo === "produto") dados.cod_produto = alvo.cod_produto;

            const botao = $('button[type="submit"]', formulario);

            if (botao) botao.disabled = true;

            try {

                await requisicao(
                    ROTAS.avaliar(pedidoEmAvaliacao.cod_pedido, alvo.tipo),
                    "POST",
                    dados
                );

                const editando = Boolean(avaliacaoExistente(pedidoEmAvaliacao, alvo));

                // a API só devolve uma mensagem: guarda a avaliação localmente
                guardarAvaliacao(pedidoEmAvaliacao, alvo, {
                    nota: dados.nota,
                    descricao: dados.descricao
                });

                renderizarPedidos();

                modal.close();

                mostrarAviso(editando ? "Avaliação atualizada!" : "Obrigado pela avaliação!");

            } catch (e) {

                console.error("Erro ao salvar avaliação:", e);

                if (erro) {
                    erro.textContent = e.message;
                } else {
                    mostrarAviso(e.message);
                }

            } finally {

                if (botao) botao.disabled = false;
            }
        });
    }

    function abrirAvaliacao(pedido) {

        const modal = $("#modal-avaliar");
        const formulario = $("#formAvaliar");

        if (!modal || !formulario) return;

        pedidoEmAvaliacao = pedido;
        alvosAvaliacao = montarAlvos(pedido);

        $("#avaliarLoja").textContent = pedido.loja || "";

        $("#avaliarItens").textContent = (pedido.itens || [])
            .map(i => `${i.quantidade}x ${i.produto}`)
            .join(", ");

        $("#avaliarMeta").textContent =
            `Pedido #${pedido.cod_pedido} — ${formatarDataHora(pedido.data_pedido)}`;

        $("#avaliarTotal").textContent = formatarMoeda(pedido.valor_total);

        // opções do seletor; as já avaliadas ganham " (avaliado)"
        const select = $("#avaliarAlvo");

        select.replaceChildren();

        alvosAvaliacao.forEach(alvo => {
            const feito = Boolean(avaliacaoExistente(pedido, alvo));
            select.add(new Option(alvo.rotulo + (feito ? " (avaliado)" : ""), alvo.chave));
        });

        // começa no primeiro item ainda não avaliado
        const pendente = alvosAvaliacao.find(a => !avaliacaoExistente(pedido, a));
        select.value = (pendente || alvosAvaliacao[0]).chave;

        preencherAlvoSelecionado();

        modal.showModal();
    }

    // preenche estrelas, comentário e textos conforme o item escolhido
    function preencherAlvoSelecionado() {

        const formulario = $("#formAvaliar");
        const alvo = alvosAvaliacao.find(a => a.chave === $("#avaliarAlvo").value);

        if (!formulario || !alvo || !pedidoEmAvaliacao) return;

        const existente = avaliacaoExistente(pedidoEmAvaliacao, alvo);
        const editando = Boolean(existente);

        $$('input[name="nota"]', formulario).forEach(radio => {
            radio.checked = editando && Number(radio.value) === Number(existente.nota);
        });

        $("#avaliarComentario").value = (editando && existente.descricao) || "";

        const erro = $("#erroAvaliar");
        if (erro) erro.textContent = "";

        const titulo = $("#titulo-modal-avaliar");
        if (titulo) titulo.textContent = editando ? "Editar avaliação" : "Avaliar pedido";

        const botao = $('button[type="submit"]', formulario);
        if (botao) {
            botao.innerHTML = `<i class="bi bi-check2" aria-hidden="true"></i> ${
                editando ? "Salvar avaliação" : "Enviar avaliação"
            }`;
        }
    }


    // ==========================================
    // NAVEGAÇÃO ENTRE ABAS
    // ==========================================

    function configurarAbas() {

        $$("[data-aba]").forEach(aba => {

            aba.addEventListener("click", () => {

                $$("[data-aba]").forEach(item => {
                    item.classList.remove("ativa");
                    item.removeAttribute("aria-current");
                });

                aba.classList.add("ativa");
                aba.setAttribute("aria-current", "true");
            });
        });

        $$('[data-ir-aba="pedidos"]').forEach(link => {
            link.addEventListener("click", () => {
                $('[data-aba="pedidos"]')?.click();
            });
        });
    }


    // ==========================================
    // SAIR DA CONTA
    // ==========================================

    function configurarLogout() {

        const modal = $("#modalSair");

        $("#abrirSair")?.addEventListener("click", () => modal?.showModal());

        $("#cancelarSair")?.addEventListener("click", () => modal?.close());

        $("#confirmarSair")?.addEventListener("click", () => {

            localStorage.removeItem(TOKEN_KEY);

            modal?.close();

            window.location.href = "index.html";
        });
    }


    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================

    async function iniciar() {

        // este script só faz sentido na tela de perfil do comprador
        if (!$("#perfilPaineis")) return;

        if (!localStorage.getItem(TOKEN_KEY)) {
            irParaLogin();
            return;
        }

        configurarIdentificacao();
        configurarAvaliacao();
        configurarAbas();
        configurarLogout();

        const carregamentoEnderecos = configurarEnderecos();

        const resultados = await Promise.allSettled([
            carregarPerfil(),
            carregarFavoritas(),
            carregarPedidos(),
            carregamentoEnderecos
        ]);

        const mensagens = [
            "Não foi possível carregar seu perfil.",
            "Não foi possível carregar suas favoritas.",
            "Não foi possível carregar seus pedidos.",
            null // endereços já avisam por conta própria
        ];

        resultados.forEach((resultado, indice) => {

            if (resultado.status !== "rejected") return;

            console.error("Erro ao carregar dados do perfil:", resultado.reason);

            if (mensagens[indice]) mostrarAviso(mensagens[indice]);
        });
    }

    document.addEventListener("DOMContentLoaded", iniciar);

})();