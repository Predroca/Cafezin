    (() => {

        const STORAGE_KEY = "cafezinPerfilEntregador";

        const $ = (id) => document.getElementById(id);

        const camposDados = [
            "campoNome",
            "campoEmail",
            "campoTelefone",
            "campoNascimento"
        ];

        const camposConta = ["contaEmail"];

        const camposEntregador = [
            "campopagamento",
            "campoPlaca",

        ];

        const defaults = {
            campoNome: "Lucas Oliveira",
            campoEmail: "",
            campoTelefone: "",
            campoNascimento: "",
            contaEmail: "",
            campopagamento: "",
            campoPlaca: "",

        };


        let salvo = {};

        try {
            salvo = JSON.parse(
                localStorage.getItem(STORAGE_KEY) || "{}"
            );
        } catch (erro) {
            salvo = {};
        }


        const todosCampos = [
            ...camposDados,
            ...camposConta,
            ...camposEntregador
        ];


        todosCampos.forEach((id) => {

            if (salvo[id] !== undefined) {
                $(id).value = salvo[id];
            } else if (defaults[id] !== undefined) {
                $(id).value = defaults[id];
            }

        });


        if (!$("contaEmail").value && $("campoEmail").value) {
            $("contaEmail").value = $("campoEmail").value;
        }


        if (salvo.avatarData) {
            mostrarAvatar(salvo.avatarData);
        }

        atualizarIdentidade();


        function capturar(ids) {

            const dados = {};

            ids.forEach((id) => {
                dados[id] = $(id).value.trim();
            });

            return dados;
        }


        function salvar(dados) {

            let atuais = {};

            try {
                atuais = JSON.parse(
                    localStorage.getItem(STORAGE_KEY) || "{}"
                );
            } catch (erro) {
                atuais = {};
            }

            localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                    ...atuais,
                    ...dados
                })
            );

            salvo = {
                ...salvo,
                ...dados
            };
        }


        function mensagem(id, texto, erro = false) {

            $(id).textContent = texto;

            $(id).classList.toggle("erro", erro);
        }


        function limparErros(ids) {

            ids.forEach((id) => {

                const campo = $(id);

                campo.removeAttribute("aria-invalid");

                const erro = document.querySelector(
                    `[data-erro-para="${id}"]`
                );

                if (erro) {
                    erro.textContent = "";
                }

            });
        }


        function validar(ids) {

            let valido = true;

            limparErros(ids);

            ids.forEach((id) => {

                const campo = $(id);

                let texto = "";

                if (
                    campo.required &&
                    !campo.value.trim()
                ) {
                    texto = "Preencha este campo.";

                } else if (
                    campo.type === "email" &&
                    campo.value &&
                    !campo.validity.valid
                ) {
                    texto = "Informe um e-mail válido.";

                } else if (
                    campo.minLength > 0 &&
                    campo.value &&
                    campo.value.length < campo.minLength
                ) {
                    texto = `Use pelo menos ${campo.minLength} caracteres.`;
                }


                if (texto) {

                    valido = false;

                    campo.setAttribute("aria-invalid", "true");

                    const erro = document.querySelector(
                        `[data-erro-para="${id}"]`
                    );

                    if (erro) {
                        erro.textContent = texto;
                    }

                }

            });

            return valido;
        }


        function atualizarIdentidade() {

            const nome =
                $("campoNome").value.trim() || "Entregador";

            $("perfilNome").textContent = nome;

            $("perfilEmail").textContent =
                $("campoEmail").value.trim() ||
                "E-mail não informado";

            /*
             * Só atualiza a inicial quando não existe
             * uma foto de perfil carregada.
             */
            if (!$("avatar").querySelector("img")) {
                $("avatar").textContent =
                    nome.charAt(0).toLocaleUpperCase("pt-BR");
            }
        }


        function mostrarAvatar(src) {

            $("avatar").innerHTML = "";

            const img = document.createElement("img");

            img.src = src;
            img.alt = "";

            $("avatar").appendChild(img);
        }


        function restaurar(ids) {

            ids.forEach((id) => {

                $(id).value =
                    salvo[id] !== undefined
                        ? salvo[id]
                        : (defaults[id] || "");

            });

            atualizarIdentidade();
        }


        /* SALVAR DADOS PESSOAIS */
        $("formDados").addEventListener("submit", (e) => {

            e.preventDefault();

            if (!validar(camposDados)) {
                return;
            }

            salvar(capturar(camposDados));

            if (!$("contaEmail").value) {
                $("contaEmail").value = $("campoEmail").value;
            }

            salvar({
                contaEmail: $("contaEmail").value
            });

            atualizarIdentidade();

            mensagem(
                "mensagemDados",
                "Dados pessoais salvos"
            );

        });


        $("descartarDados").addEventListener("click", () => {

            restaurar(camposDados);

            limparErros(camposDados);

            mensagem(
                "mensagemDados",
                "Alterações descartadas."
            );

        });


        /* SALVAR DADOS DA CONTA */
        $("formConta").addEventListener("submit", (e) => {

            e.preventDefault();

            if (!validar(camposConta)) {
                return;
            }

            if (
                $("novaSenha").value &&
                $("novaSenha").value.length < 8
            ) {

                $("novaSenha").setAttribute(
                    "aria-invalid",
                    "true"
                );

                document.querySelector(
                    '[data-erro-para="novaSenha"]'
                ).textContent =
                    "Use pelo menos 8 caracteres.";

                return;
            }


            salvar(capturar(camposConta));

            $("campoEmail").value = $("contaEmail").value;

            salvar({
                campoEmail: $("campoEmail").value
            });

            /*
             * Não armazenamos senhas no navegador.
             * A troca real deve ser feita pelo backend.
             */
            $("senhaAtual").value = "";
            $("novaSenha").value = "";

            atualizarIdentidade();

            mensagem(
                "mensagemConta",
                "E-mail salvo."
            );

        });


        $("descartarConta").addEventListener("click", () => {

            restaurar(camposConta);

            $("senhaAtual").value = "";
            $("novaSenha").value = "";

            limparErros([
                ...camposConta,
                "novaSenha"
            ]);

            mensagem(
                "mensagemConta",
                "Alterações descartadas."
            );

        });


        /* SALVAR DADOS DO ENTREGADOR */
        $("formEntregador").addEventListener("submit", (e) => {

            e.preventDefault();

            salvar(capturar(camposEntregador));

            mensagem(
                "mensagemEntregador",
                "Dados de entregador salvos"
            );

        });


        $("descartarEntregador").addEventListener("click", () => {

            restaurar(camposEntregador);

            mensagem(
                "mensagemEntregador",
                "Alterações descartadas."
            );

        });


        /* ATUALIZAR IDENTIFICAÇÃO */
        $("campoNome").addEventListener(
            "input",
            atualizarIdentidade
        );

        $("campoEmail").addEventListener(
            "input",
            atualizarIdentidade
        );

        $("contaEmail").addEventListener("input", () => {
            limparErros(["contaEmail"]);
        });


        /* TROCAR FOTO DE PERFIL */
        $("avatarArquivo").addEventListener("change", (e) => {

            const arquivo =
                e.target.files && e.target.files[0];

            if (!arquivo) {
                return;
            }

            if (!arquivo.type.startsWith("image/")) {
                return;
            }

            const leitor = new FileReader();

            leitor.onload = () => {

                mostrarAvatar(leitor.result);

                salvar({
                    avatarData: leitor.result
                });

            };

            leitor.readAsDataURL(arquivo);

        });


        /* NAVEGAÇÃO ENTRE AS SEÇÕES */
        const abas = [
            ...document.querySelectorAll("[data-aba]")
        ];

        const paineis = $("perfilPaineis");


        abas.forEach((aba) => {

            aba.addEventListener("click", (e) => {

                const alvo = document.querySelector(
                    aba.getAttribute("href")
                );

                if (!alvo) {
                    return;
                }

                e.preventDefault();

                paineis.scrollTo({
                    top: alvo.offsetTop - paineis.offsetTop,
                    behavior: "smooth"
                });

                abas.forEach((item) => {

                    item.classList.remove("ativa");

                    item.removeAttribute("aria-current");

                });

                aba.classList.add("ativa");

                aba.setAttribute("aria-current", "page");

            });

        });


        /* DESTACAR A SEÇÃO VISÍVEL */
        paineis.addEventListener("scroll", () => {

            let atual = "dados";

            document
                .querySelectorAll(".perfilPaineis .painel")
                .forEach((painel) => {

                    if (
                        painel.offsetTop - paineis.offsetTop
                        <= paineis.scrollTop + 100
                    ) {
                        atual = painel.id.replace("painel-", "");
                    }

                });


            abas.forEach((aba) => {

                const ativa = aba.dataset.aba === atual;

                aba.classList.toggle("ativa", ativa);

                if (ativa) {
                    aba.setAttribute("aria-current", "page");
                } else {
                    aba.removeAttribute("aria-current");
                }

            });

        });

    })();