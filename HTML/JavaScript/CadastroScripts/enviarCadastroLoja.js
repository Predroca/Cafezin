document.addEventListener("DOMContentLoaded", () => {

    const API_URL = "http://127.0.0.1:5000";


    const form = document.getElementById("loginForm");

    const primeiraSessao = document.getElementById("primeiraSessao");
    const segundaSessao = document.getElementById("segundaSessao");

    const nextStep = document.getElementById("nextStep");
    const prevStep = document.getElementById("prevStep");

    const nomeUser = document.getElementById("nomeUser");
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const confirmPsswd = document.getElementById("confirmPsswd");
    const telefone = document.getElementById("telefone");

    const cnpjUser = document.getElementById("cnpjUser");
    const horaAberturaLoja = document.getElementById("horaAberturaLoja");

    const cep = document.getElementById("cepEnderecoLoja");
    const rua = document.getElementById("ruaEnderecoLoja");
    const numero = document.getElementById("numEnderecoLoja");
    const cidade = document.getElementById("cidadeEnderecoLoja");
    const bairro = document.getElementById("bairroEnderecoLoja");
    const estado = document.getElementById("estadoEnderecoLoja");

    const errorLogin = document.getElementById("errorLogin");
    const preencherCampos = document.getElementById("preencherCampos");
    const diferentPsswd = document.getElementById("diferentPsswd");



    function esconderErros() {

        errorLogin.style.display = "none";
        preencherCampos.style.display = "none";
        diferentPsswd.style.display = "none";

    }



    function mostrarErro(elemento) {

        esconderErros();

        elemento.style.display = "flex";

        setTimeout(() => {

            elemento.style.display = "none";

        }, 3800);

    }



    function validarPrimeiraEtapa() {

        esconderErros();

        const Femail = email.value.trim();
        const Fsenha = password.value;
        const ConfSenha = confirmPsswd.value;
        const FnomeUser = nomeUser.value.trim();


      

        if (
            Femail === "" ||
            Fsenha === "" ||
            ConfSenha === "" ||
            FnomeUser === ""
        ) {

            mostrarErro(preencherCampos);

            return false;

        }


  

        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!regex.test(Femail)) {

            mostrarErro(preencherCampos);

            return false;

        }

        if (Fsenha !== ConfSenha) {
            mostrarErro(diferentPsswd);
            return false;

        }
        return true;
    }


    nextStep.addEventListener("click", () => {

        console.log("Botão próxima etapa clicado");

        if (!validarPrimeiraEtapa()) {
            console.log("Primeira etapa inválida");
            return;
        }

        console.log("Primeira etapa válida");
        segundaSessao.style.display = "grid";

        primeiraSessao.style.animation =
            "disappearLeft 0.2s linear backwards";

        segundaSessao.style.animation =
            "aparecerDireita 0.2s linear backwards";



        setTimeout(() => {
            primeiraSessao.style.display = "none";
            segundaSessao.style.position = "relative";

        }, 200);

    });


    prevStep.addEventListener("click", () => {
        console.log("Voltando para primeira etapa");
        segundaSessao.style.animation =
            "disappearRight 0.2s linear backwards";


        primeiraSessao.style.display = "block";
        primeiraSessao.style.animation =
            "aparecerEsquerda 0.2s linear backwards";


        setTimeout(() => {
            segundaSessao.style.display = "none";
        }, 200);
    });


    cnpjUser.addEventListener("input", () => {
        cnpjUser.value = cnpjUser.value.replace(/\D/g, "");
    });

    cep.addEventListener("input", () => {
        cep.value = cep.value.replace(/\D/g, "");
    });


    cep.addEventListener("blur", async () => {
        const valorCEP = cep.value.replace(/\D/g, "");
        if (valorCEP.length !== 8) {
            return;
        }


        try {

            const resposta = await fetch(
                `https://viacep.com.br/ws/${valorCEP}/json/`
            );


            if (!resposta.ok) {
                throw new Error("Erro ao consultar CEP");
            }
            const dadosCEP = await resposta.json();
            if (dadosCEP.erro) {
                alert("CEP não encontrado.");
                return;
            }


            rua.value = dadosCEP.logradouro || "";
            bairro.value = dadosCEP.bairro || "";
            cidade.value = dadosCEP.localidade || "";
            estado.value = dadosCEP.uf || "";


        } catch (erro) {

            console.error("Erro ao consultar CEP:", erro);
            alert("Não foi possível consultar o CEP.");

        }

    });


    form.addEventListener("submit", async (event) => {

        event.preventDefault();
        console.log("Formulário enviado");

        if (!validarPrimeiraEtapa()) {
            return;
        }

        if (
            cnpjUser.value.trim() === "" ||
            horaAberturaLoja.value.trim() === "" ||
            cep.value.trim() === "" ||
            rua.value.trim() === "" ||
            numero.value.trim() === "" ||
            cidade.value.trim() === "" ||
            bairro.value.trim() === "" ||
            estado.value.trim() === ""
        ) {

            mostrarErro(preencherCampos);

            return;

        }

        if (cnpjUser.value.length !== 14) {
            alert("O CNPJ deve possuir 14 números.");
            return;

        }


        const dadosCadastro = {

            nome: nomeUser.value.trim(),
            email: email.value.trim(),
            senha: password.value,
            telefone: telefone.value.trim() || null,
            cnpj: cnpjUser.value.trim(),
            horario_funcionamento:
                horaAberturaLoja.value.trim(),
            endereco: {
                nome_logradouro: rua.value.trim(),
                numero: numero.value.trim(),
                bairro: bairro.value.trim(),
                cidade: cidade.value.trim(),
                estado: estado.value.trim(),
                cep: cep.value.trim()
            }

        };
        console.log("Dados que serão enviados:");
        console.log(dadosCadastro);


        const botaoSubmit = document.getElementById("submit");
        botaoSubmit.disabled = true;
        botaoSubmit.value = "Cadastrando...";


        try {

            const resposta = await fetch(
        `${API_URL}/register/loja`, {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(dadosCadastro)
    }
);


            const resultado = await resposta.json();
            console.log("Resposta do servidor:");
            console.log(resultado);

            if (resposta.status === 409) {
                mostrarErro(errorLogin);
                return;

            }

            if (!resposta.ok) {

                alert(
                    resultado.error ||
                    resultado.erro ||
                    "Erro ao realizar cadastro."
                );

                return;

            }


            if (resposta.status === 201) {
                alert(
                    `Loja criada com sucesso! Bem-vindo, ${resultado.usuario}.`
                );
                window.location.href = "indexLoja.html";

            }


        } catch (erro) {

            console.error(
                "Erro ao conectar com o backend:",
                erro
            );

            alert(
                "Não foi possível conectar ao servidor Flask."
            );

        } finally {

            botaoSubmit.disabled = false;
            botaoSubmit.value = "Cadastrar";

        }

    });

});
