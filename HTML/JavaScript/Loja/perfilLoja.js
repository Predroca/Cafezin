(function () {
    "use strict";

    const chaveHorarios = "cafezin.horariosFuncionamentoLoja";
    const dias = [
        { id: "segunda", nome: "Seg" },
        { id: "terca", nome: "Ter" },
        { id: "quarta", nome: "Qua" },
        { id: "quinta", nome: "Qui" },
        { id: "sexta", nome: "Sex" },
        { id: "sabado", nome: "Sáb" },
        { id: "domingo", nome: "Dom" }
    ];

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

    const camposLoja = {};
    document.querySelectorAll("[data-valor-para]").forEach(function (elemento) {
        camposLoja[elemento.dataset.valorPara] = elemento.dataset.valorInicial || "";
    });
    camposLoja.foto_url = "";

    const aviso = document.getElementById("aviso");
    let temporizadorAviso;
    let horariosSalvos = lerHorarios();
    let temHorarioSalvo = lerSeHaHorarioSalvo();

    function criarSemanaVazia() {
        const semana = {};
        dias.forEach(function (dia) {
            semana[dia.id] = { aberto: false, abertura: "", fechamento: "" };
        });
        return semana;
    }

    function normalizarSemana(dados) {
        const semana = criarSemanaVazia();
        if (!dados || typeof dados !== "object") return semana;

        dias.forEach(function (dia) {
            const item = dados[dia.id];
            if (!item || typeof item !== "object") return;
            semana[dia.id] = {
                aberto: item.aberto === true,
                abertura: typeof item.abertura === "string" ? item.abertura : "",
                fechamento: typeof item.fechamento === "string" ? item.fechamento : ""
            };
        });
        return semana;
    }

    function lerSeHaHorarioSalvo() {
        try {
            return localStorage.getItem(chaveHorarios) !== null;
        } catch (erro) {
            return false;
        }
    }

    function lerHorarios() {
        try {
            const bruto = localStorage.getItem(chaveHorarios);
            return bruto === null ? criarSemanaVazia() : normalizarSemana(JSON.parse(bruto));
        } catch (erro) {
            return criarSemanaVazia();
        }
    }

    function limparErroDia(linha) {
        linha.querySelector(".erroDia").textContent = "";
        linha.querySelectorAll("[data-abertura], [data-fechamento]").forEach(function (campo) {
            campo.removeAttribute("aria-invalid");
        });
    }

    function atualizarEstadoDia(linha) {
        const aberto = linha.querySelector("[data-aberto]").checked;
        const abertura = linha.querySelector("[data-abertura]");
        const fechamento = linha.querySelector("[data-fechamento]");

        abertura.disabled = !aberto;
        fechamento.disabled = !aberto;
        linha.querySelector("[data-status-dia]").textContent = aberto ? "Aberto" : "Fechado";
        if (!aberto) limparErroDia(linha);
    }

    function preencherHorarios(semana) {
        document.querySelectorAll(".horarioDia[data-dia]").forEach(function (linha) {
            const dia = semana[linha.dataset.dia] || { aberto: false, abertura: "", fechamento: "" };
            linha.querySelector("[data-aberto]").checked = dia.aberto;
            linha.querySelector("[data-abertura]").value = dia.abertura;
            linha.querySelector("[data-fechamento]").value = dia.fechamento;
            atualizarEstadoDia(linha);
            limparErroDia(linha);
        });
        document.getElementById("erroHorario").textContent = "";
    }

    function coletarHorarios() {
        const semana = criarSemanaVazia();
        document.querySelectorAll(".horarioDia[data-dia]").forEach(function (linha) {
            semana[linha.dataset.dia] = {
                aberto: linha.querySelector("[data-aberto]").checked,
                abertura: linha.querySelector("[data-abertura]").value,
                fechamento: linha.querySelector("[data-fechamento]").value
            };
        });
        return semana;
    }

    function validarHorarios() {
        const erroHorario = document.getElementById("erroHorario");
        erroHorario.textContent = "";
        let primeiroInvalido = null;

        document.querySelectorAll(".horarioDia[data-dia]").forEach(function (linha) {
            limparErroDia(linha);
            if (!linha.querySelector("[data-aberto]").checked) return;

            const abertura = linha.querySelector("[data-abertura]");
            const fechamento = linha.querySelector("[data-fechamento]");
            let mensagem = "";

            if (!abertura.value || !fechamento.value) {
                mensagem = "Informe os horários de abertura e fechamento.";
            } else if (fechamento.value <= abertura.value) {
                mensagem = "O fechamento deve ser depois da abertura.";
            }

            if (mensagem) {
                linha.querySelector(".erroDia").textContent = mensagem;
                [abertura, fechamento].forEach(function (campo) {
                    campo.setAttribute("aria-invalid", "true");
                });
                if (!primeiroInvalido) primeiroInvalido = abertura.value ? fechamento : abertura;
            }
        });

        if (!primeiroInvalido) return true;
        erroHorario.textContent = "Revise os horários destacados antes de salvar.";
        primeiroInvalido.focus();
        return false;
    }

    function atualizarResumoHorarios() {
        const resumo = document.getElementById("resumoHorario");
        if (!temHorarioSalvo) {
            resumo.textContent = "Não informada";
            return;
        }

        const abertos = dias.filter(function (dia) {
            return horariosSalvos[dia.id].aberto;
        });
        if (abertos.length === 0) {
            resumo.textContent = "Fechado todos os dias";
            return;
        }

        const itens = abertos.map(function (dia) {
            const horario = horariosSalvos[dia.id];
            return dia.nome + ": " + horario.abertura + " às " + horario.fechamento;
        });
        const fechados = dias.filter(function (dia) {
            return !horariosSalvos[dia.id].aberto;
        }).map(function (dia) { return dia.nome; });
        if (fechados.length) itens.push("Fechado: " + fechados.join(", "));
        resumo.textContent = itens.join(" · ");
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
        const miniatura = document.getElementById("miniaturaFotoLoja");
        const status = document.getElementById("statusFotoLoja");

        [avatar, miniatura].forEach(function (imagem) {
            imagem.hidden = !url;
            imagem.onload = function () {
                status.textContent = "Foto cadastrada";
            };
            imagem.onerror = function () {
                imagem.hidden = true;
                status.textContent = "Endereço informado; imagem indisponível";
            };
            if (url) imagem.src = url;
            else imagem.removeAttribute("src");
        });

        if (!url) status.textContent = "Não informada";
    }

    function atualizarResumo() {
        document.querySelectorAll("[data-valor-para]").forEach(function (elemento) {
            const chave = elemento.dataset.valorPara;
            elemento.textContent = formatarValor(chave, camposLoja[chave] || "");
        });

        const nome = camposLoja.nome || "Nome da loja";
        document.getElementById("nomeLoja").textContent = nome;
        atualizarFoto();
        atualizarResumoHorarios();
    }

    function mostrarAviso(mensagem) {
        aviso.textContent = mensagem;
        aviso.classList.add("visivel");
        clearTimeout(temporizadorAviso);
        temporizadorAviso = setTimeout(function () {
            aviso.classList.remove("visivel");
        }, 3600);
    }

    document.querySelectorAll("[data-abrir-modal]").forEach(function (botao) {
        botao.addEventListener("click", function () {
            const modal = document.getElementById(botao.dataset.abrirModal);
            const formulario = modal.querySelector("form[data-formulario]");

            formulario.querySelectorAll("[name]").forEach(function (campo) {
                campo.value = camposLoja[campo.name] || "";
            });

            if (formulario.dataset.formulario === "funcionamento") {
                preencherHorarios(horariosSalvos);
            }

            modal.showModal();
        });
    });

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

    document.querySelectorAll("form[data-formulario]").forEach(function (formulario) {
        formulario.addEventListener("submit", function (evento) {
            evento.preventDefault();

            let agendaAtualizada = false;
            if (formulario.dataset.formulario === "funcionamento") {
                if (!validarHorarios()) return;
                horariosSalvos = coletarHorarios();
                temHorarioSalvo = true;
                try {
                    localStorage.setItem(chaveHorarios, JSON.stringify(horariosSalvos));
                    agendaAtualizada = true;
                } catch (erro) {
                    agendaAtualizada = false;
                }
            }

            formulario.querySelectorAll("[name]").forEach(function (campo) {
                let valor = campo.value.trim();
                if (campo.name === "estado") valor = valor.toUpperCase();
                camposLoja[campo.name] = valor;
            });

            atualizarResumo();
            formulario.closest("dialog").close();
            if (formulario.dataset.formulario === "funcionamento" && !agendaAtualizada) {
                mostrarAviso("Prévia atualizada. Não foi possível salvar a agenda neste navegador.");
            } else if (formulario.dataset.formulario === "funcionamento") {
                mostrarAviso("Prévia atualizada. A agenda semanal foi salva neste navegador.");
            } else {
                mostrarAviso("Prévia atualizada nesta página. Os dados não foram salvos no banco.");
            }
        });
    });

    document.querySelectorAll(".horarioDia[data-dia]").forEach(function (linha) {
        linha.querySelector("[data-aberto]").addEventListener("change", function () {
            atualizarEstadoDia(linha);
            document.getElementById("erroHorario").textContent = "";
        });

        linha.querySelectorAll("[data-abertura], [data-fechamento]").forEach(function (campo) {
            campo.addEventListener("input", function () {
                limparErroDia(linha);
                document.getElementById("erroHorario").textContent = "";
            });
        });
    });

    document.getElementById("descartarHorario").addEventListener("click", function () {
        const formulario = document.querySelector('form[data-formulario="funcionamento"]');
        formulario.querySelectorAll("[name]").forEach(function (campo) {
            campo.value = camposLoja[campo.name] || "";
        });
        preencherHorarios(horariosSalvos);
    });

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

    atualizarResumo();
})();
