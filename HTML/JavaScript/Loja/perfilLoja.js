(function () {
    "use strict";

    const abas = Array.from(document.querySelectorAll(".perfilAbas [data-aba]"));
    const areaPaineis = document.getElementById("perfilPaineis");
    const reduzMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
    let abaAtual = null;
    let travaRolagem = false;
    let temporizadorTrava;
    let quadroPendente = false;

    function marcarAba(nome, moverFoco) {
        abas.forEach(function (aba) {
            const ativa = aba.dataset.aba === nome;
            aba.classList.toggle("ativa", ativa);
            aba.tabIndex = ativa ? 0 : -1;

            if (ativa) {
                aba.setAttribute("aria-current", "true");
                aba.setAttribute("aria-selected", "true");
                if (moverFoco) aba.focus({ preventScroll: true });
            } else {
                aba.removeAttribute("aria-current");
                aba.setAttribute("aria-selected", "false");
            }
        });

        if (nome !== abaAtual && history.replaceState) {
            history.replaceState(null, "", "#painel-" + nome);
        }
        abaAtual = nome;
    }

    function rolarParaPainel(nome, instantaneo) {
        const painel = document.getElementById("painel-" + nome);
        if (!painel) return;

        const folga = parseFloat(getComputedStyle(areaPaineis).paddingTop) || 0;
        const topo = Math.max(0, painel.offsetTop - folga);

        travaRolagem = true;
        clearTimeout(temporizadorTrava);
        temporizadorTrava = setTimeout(function () {
            travaRolagem = false;
        }, 250);

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
            temporizadorTrava = setTimeout(function () {
                travaRolagem = false;
            }, 120);
            return;
        }

        const folga = parseFloat(getComputedStyle(areaPaineis).paddingTop) || 0;
        const referencia = areaPaineis.scrollTop + areaPaineis.clientHeight * 0.2;
        let nome = abas[0].dataset.aba;

        abas.forEach(function (aba) {
            const painel = document.getElementById("painel-" + aba.dataset.aba);
            if (painel && painel.offsetTop - folga <= referencia) {
                nome = aba.dataset.aba;
            }
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
        aba.addEventListener("click", function (evento) {
            evento.preventDefault();
            abrirAba(aba.dataset.aba);
        });

        aba.addEventListener("keydown", function (evento) {
            const direcoes = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
            if (!(evento.key in direcoes)) return;

            evento.preventDefault();
            const proxima = abas[(indice + direcoes[evento.key] + abas.length) % abas.length];
            abrirAba(proxima.dataset.aba, { moverFoco: true });
        });
    });

    const hashInicial = window.location.hash.replace(/^#painel-/, "");
    const abaInicial = abas.some(function (aba) { return aba.dataset.aba === hashInicial; })
        ? hashInicial
        : abas[0].dataset.aba;
    abrirAba(abaInicial, { instantaneo: true });

    // ------------------------------------------------------------------
    // Integração com o backend (loja_bp.py): GET/PATCH /loja/perfil
    // ------------------------------------------------------------------

    // Ajuste para o endereço onde o Flask está rodando (sem barra no final).
    // Se o front for servido pelo próprio Flask, pode deixar "" (mesma origem).
    const API_URL = "http://127.0.0.1:5000";
    const URL_PERFIL = API_URL + "/loja/perfil";

    const camposLoja = {};
    const aviso = document.getElementById("aviso");
    const botoesEditar = Array.from(document.querySelectorAll("[data-abrir-modal]"));
    let temporizadorAviso;

    function obterToken() {
        try {
            return localStorage.getItem("token");
        } catch (erro) {
            return null;
        }
    }

    async function chamarApi(metodo, corpo) {
        const token = obterToken();
        if (!token) {
            sairDaConta();
            throw new Error("Sessão não encontrada. Entre novamente.");
        }

        const cabecalhos = { "Authorization": "Bearer " + token };
        if (corpo) cabecalhos["Content-Type"] = "application/json";

        let resposta;
        try {
            resposta = await fetch(URL_PERFIL, {
                method: metodo,
                headers: cabecalhos,
                body: corpo ? JSON.stringify(corpo) : undefined
            });
        } catch (erro) {
            throw new Error("Não foi possível conectar ao servidor.");
        }

        let dados = null;
        try {
            dados = await resposta.json();
        } catch (erro) { /* resposta sem JSON (ex.: erro 500 em HTML) */ }

        if (resposta.status === 401) {
            sairDaConta();
            throw new Error("Sessão expirada. Entre novamente.");
        }
        if (!resposta.ok) {
            throw new Error((dados && (dados.error || dados.msg)) || "Erro inesperado (" + resposta.status + ").");
        }
        return dados;
    }

    function textoHorario(abertura, fecha) {
        if (abertura && fecha) return abertura + " às " + fecha;
        if (abertura) return "Abre às " + abertura;
        if (fecha) return "Fecha às " + fecha;
        return "";
    }

    function aplicarPerfil(perfil) {
        const endereco = perfil.endereco || {};

        camposLoja.nome = perfil.nome || "";
        camposLoja.cnpj = perfil.cnpj || "";
        camposLoja.foto_url = perfil.foto_url || "";
        camposLoja.email = perfil.email || "";
        camposLoja.telefone = perfil.telefone || "";
        camposLoja.nome_logradouro = endereco.nome_logradouro || "";
        camposLoja.numero = endereco.numero || "";
        camposLoja.bairro = endereco.bairro || "";
        camposLoja.cidade = endereco.cidade || "";
        camposLoja.estado = endereco.estado || "";
        camposLoja.cep = endereco.cep || "";
        camposLoja.horario_abertura = perfil.horario_abertura || "";
        camposLoja.horario_fecha = perfil.horario_fecha || "";
        camposLoja.horario_funcionamento = textoHorario(camposLoja.horario_abertura, camposLoja.horario_fecha);
    }

    function formatarValor(chave, valor) {
        if (!valor) return "Não informado";
        if (chave === "cnpj" && /^\d{14}$/.test(valor)) {
            return valor.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
        }
        if (chave === "cep" && /^\d{8}$/.test(valor)) {
            return valor.replace(/^(\d{5})(\d{3})$/, "$1-$2");
        }
        if (chave === "estado") return valor.toUpperCase();
        return valor;
    }

    function atualizarFoto() {
        const url = camposLoja.foto_url;
        const avatar = document.getElementById("fotoLoja");

        avatar.hidden = !url;
        avatar.onerror = function () {
            avatar.hidden = true;
        };
        if (url) avatar.src = url;
        else avatar.removeAttribute("src");
    }

    function atualizarResumo() {
        document.querySelectorAll("[data-valor-para]").forEach(function (elemento) {
            const chave = elemento.dataset.valorPara;
            elemento.textContent = formatarValor(chave, camposLoja[chave] || "");
        });

        document.getElementById("nomeLoja").textContent = camposLoja.nome || "Nome da loja";
        atualizarFoto();
    }

    function mostrarAviso(mensagem) {
        aviso.textContent = mensagem;
        aviso.classList.add("visivel");
        clearTimeout(temporizadorAviso);
        temporizadorAviso = setTimeout(function () {
            aviso.classList.remove("visivel");
        }, 3600);
    }

    function preencherFormulario(formulario) {
        formulario.querySelectorAll("[name]").forEach(function (campo) {
            campo.value = camposLoja[campo.name] || "";
        });
        const erro = formulario.querySelector(".erroFormulario");
        if (erro) erro.textContent = "";
    }

    function montarPayload(tipo, valores) {
        if (tipo === "identificacao") {
            return { nome: valores.nome, cnpj: valores.cnpj };
        }
        if (tipo === "contato") {
            return { email: valores.email, telefone: valores.telefone };
        }
        if (tipo === "endereco") {
            return {
                endereco: {
                    nome_logradouro: valores.nome_logradouro,
                    numero: valores.numero,
                    bairro: valores.bairro,
                    cidade: valores.cidade,
                    estado: valores.estado.toUpperCase(),
                    cep: valores.cep
                }
            };
        }
        return {
            horario_abertura: valores.horario_abertura,
            horario_fecha: valores.horario_fecha
        };
    }

    // Mesmas regras do backend, para avisar antes de enviar.
    function validarFuncionamento(valores) {
        const abertura = valores.horario_abertura;
        const fecha = valores.horario_fecha;

        if ((abertura && !fecha) || (!abertura && fecha)) {
            return "Informe a abertura e o fechamento (ou deixe os dois vazios).";
        }
        if (abertura && fecha && fecha <= abertura) {
            return "O fechamento deve ser depois da abertura.";
        }
        return "";
    }

    document.querySelectorAll(".modalEditar").forEach(function (modal) {
        modal.querySelectorAll("[data-fechar-modal]").forEach(function (botao) {
            botao.addEventListener("click", function () {
                modal.close();
            });
        });

        modal.addEventListener("click", function (evento) {
            if (evento.target === modal) modal.close();
        });
    });

    botoesEditar.forEach(function (botao) {
        // só libera a edição depois que os dados do servidor chegarem
        botao.disabled = true;

        botao.addEventListener("click", function () {
            const modal = document.getElementById(botao.dataset.abrirModal);
            preencherFormulario(modal.querySelector("form[data-formulario]"));
            modal.showModal();
        });
    });

    document.querySelectorAll("form[data-formulario]").forEach(function (formulario) {
        const tipo = formulario.dataset.formulario;
        const erro = formulario.querySelector(".erroFormulario");
        const botaoSalvar = formulario.querySelector('button[type="submit"]');

        formulario.addEventListener("submit", async function (evento) {
            evento.preventDefault();
            erro.textContent = "";

            const valores = {};
            formulario.querySelectorAll("[name]").forEach(function (campo) {
                valores[campo.name] = campo.value.trim();
            });

            if (tipo === "funcionamento") {
                const mensagem = validarFuncionamento(valores);
                if (mensagem) {
                    erro.textContent = mensagem;
                    return;
                }
            }

            botaoSalvar.disabled = true;
            try {
                const perfil = await chamarApi("PATCH", montarPayload(tipo, valores));
                aplicarPerfil(perfil);
                atualizarResumo();
                formulario.closest("dialog").close();
                mostrarAviso("Dados salvos com sucesso.");
            } catch (falha) {
                erro.textContent = falha.message;
            } finally {
                botaoSalvar.disabled = false;
            }
        });
    });

    document.getElementById("descartarHorario").addEventListener("click", function () {
        preencherFormulario(document.querySelector('form[data-formulario="funcionamento"]'));
    });

    async function carregarPerfil() {
        try {
            const perfil = await chamarApi("GET");
            aplicarPerfil(perfil);
            atualizarResumo();
            botoesEditar.forEach(function (botao) {
                botao.disabled = false;
            });
        } catch (falha) {
            mostrarAviso("Não foi possível carregar os dados da loja: " + falha.message);
        }
    }


    const modalSair = document.getElementById("modalSair");
    const botaoCancelarSaida = document.getElementById("cancelarSair");

    document.getElementById("abrirSair").addEventListener("click", function () {
        if (typeof modalSair.showModal === "function") {
            modalSair.showModal();
            botaoCancelarSaida.focus();
        } else if (window.confirm("Sair da sua conta?")) {
            sairDaConta();
        }
    });

    botaoCancelarSaida.addEventListener("click", function () {
        modalSair.close();
    });

    modalSair.addEventListener("click", function (evento) {
        if (evento.target === modalSair) modalSair.close();
    });

    document.getElementById("confirmarSair").addEventListener("click", sairDaConta);

    function sairDaConta() {
        try {
            localStorage.removeItem("token");
            localStorage.removeItem("cafezinSessao");
        } catch (erro) { /* a navegação ainda deve ocorrer sem acesso ao armazenamento */ }

        try {
            sessionStorage.clear();
        } catch (erro) { /* a navegação ainda deve ocorrer sem acesso ao armazenamento */ }

        window.location.replace("index.html");
    }

    carregarPerfil();
})();