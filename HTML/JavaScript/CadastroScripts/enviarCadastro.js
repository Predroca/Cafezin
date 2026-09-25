const API_URL = 'http://localhost:5000';

async function cadastrar(user, email, senha, telefone, cpf, nasc, sexo) {
    // email senha nome telefone cpf nasc sexo
    const resposta = await fetch(`${API_URL}/register/comprador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            'email': email,
            'senha': senha,
            'nome': user,
            'telefone': telefone,
            'cpf': cpf,
            'data_nasc': nasc,
            'sexo': sexo
        })
    });
    return resposta;
}

document.addEventListener('DOMContentLoaded', () => {

    /* ---------------- Configurações ---------------- */
    const DURACAO_TRANSICAO = 300;   // ms — slide entre as etapas
    const DURACAO_ERRO = 3800;       // ms — tempo dos alertas simples
    const SENHA_MIN = 6;             // tamanho mínimo da senha

    /* ---------------- Elementos ---------------- */
    const form = document.getElementById('loginForm');
    const primeiraSessao = document.getElementById('primeiraSessao');
    const segundaSessao = document.getElementById('segundaSessao');
    const nextStep = document.getElementById('nextStep');
    const botaoSubmit = document.getElementById('submit');

    const nomeUser = document.getElementById('nomeUser');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPsswd = document.getElementById('confirmPsswd');
    const telefone = document.getElementById('telefone');
    const cpfUser = document.getElementById('cpfUser');
    const dataNascUser = document.getElementById('dataNascUser');
    const opcoesSexo = document.getElementById('opcoesSexo');

    const preencherCampos = document.getElementById('preencherCampos');
    const diferentPsswd = document.getElementById('diferentPsswd');
    const usuarioExistente = document.getElementById('usuarioExistente');
    const fecharUsuarioExistente = document.getElementById('fecharUsuarioExistente');

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let transitando = false;
    let timerErro = null;

    // guarda o texto original de cada alerta para restaurar depois
    [preencherCampos, diferentPsswd].forEach((alerta) => {
        const p = alerta.querySelector('p');
        alerta.dataset.padrao = p.textContent.trim().replace(/\s+/g, ' ');
    });

    /* ---------------- Alertas ---------------- */
    function esconderErros() {
        clearTimeout(timerErro);
        preencherCampos.style.display = 'none';
        diferentPsswd.style.display = 'none';
    }

    function mostrarErro(alerta, mensagem) {
        esconderErros();
        alerta.querySelector('p').textContent = mensagem || alerta.dataset.padrao;
        alerta.style.display = 'flex';
        timerErro = setTimeout(() => { alerta.style.display = 'none'; }, DURACAO_ERRO);
    }

    function abrirAlertaUsuarioExistente() {
        esconderErros();
        usuarioExistente.classList.add('aberto');
        fecharUsuarioExistente.focus();
    }

    function fecharAlertaUsuarioExistente() {
        usuarioExistente.classList.remove('aberto');
    }

    fecharUsuarioExistente.addEventListener('click', fecharAlertaUsuarioExistente);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') fecharAlertaUsuarioExistente();
    });

    /* ---------------- Validação ---------------- */
    function cpfValido(cpf) {
        if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
        for (let t = 9; t < 11; t++) {
            let soma = 0;
            for (let i = 0; i < t; i++) soma += Number(cpf[i]) * (t + 1 - i);
            const dv = ((soma * 10) % 11) % 10;
            if (dv !== Number(cpf[t])) return false;
        }
        return true;
    }

    function dataValida(valor) {
        if (!valor) return false;
        const d = new Date(valor + 'T00:00:00');
        return !isNaN(d) && d <= new Date() && d.getFullYear() >= 1900;
    }

    // regras: [campo, estaValido, mensagem, alertaOpcional]
    // Marca TODOS os campos inválidos e mostra o alerta do primeiro erro.
    function checar(regras) {
        const invalidos = new Set();
        let primeiro = null;

        regras.forEach(([campo, valido, mensagem, alerta]) => {
            if (valido) return;
            invalidos.add(campo);
            if (!primeiro) primeiro = { campo, mensagem, alerta };
        });

        regras.forEach(([campo]) => {
            const invalido = invalidos.has(campo);
            campo.classList.toggle('is-invalid', invalido);
            if (invalido) campo.classList.remove('is-valid');
        });

        if (!primeiro) {
            esconderErros();
            return true;
        }
        mostrarErro(primeiro.alerta || preencherCampos, primeiro.mensagem);
        primeiro.campo.focus();
        return false;
    }

    function validarEtapa1() {
        const tel = telefone.value.trim();
        return checar([
            [nomeUser, nomeUser.value.trim().length >= 3, 'O nome de usuário precisa ter ao menos 3 caracteres.'],
            [email, regexEmail.test(email.value.trim()), 'Digite um e-mail válido.'],
            [password, password.value.length >= SENHA_MIN, `A senha precisa ter ao menos ${SENHA_MIN} caracteres.`],
            [confirmPsswd, confirmPsswd.value !== '', 'Confirme a sua senha.'],
            [confirmPsswd, password.value === confirmPsswd.value, null, diferentPsswd],
            [telefone, tel === '' || /^\d{10,11}$/.test(tel), 'Telefone inválido. Use o DDD + número.']
        ]);
    }

    function validarEtapa2() {
        return checar([
            [cpfUser, cpfValido(cpfUser.value), 'CPF inválido. Confira os 11 números.'],
            [dataNascUser, dataValida(dataNascUser.value), 'Informe uma data de nascimento válida.'],
            [opcoesSexo, ['M', 'F', 'null'].includes(opcoesSexo.value), 'Selecione uma opção de sexo.']
        ]);
    }

    /* ---------------- Máscaras simples ---------------- */
    cpfUser.addEventListener('input', () => {
        cpfUser.value = cpfUser.value.replace(/\D/g, '').slice(0, 11);
    });
    telefone.addEventListener('input', () => {
        telefone.value = telefone.value.replace(/\D/g, '').slice(0, 11);
    });

    // tira o destaque vermelho assim que a pessoa volta a editar o campo
    [password, telefone, cpfUser, dataNascUser].forEach((campo) => {
        campo.addEventListener('input', () => campo.classList.remove('is-invalid'));
    });
    opcoesSexo.addEventListener('change', () => opcoesSexo.classList.remove('is-invalid'));

    /* ---------------- Slide entre etapas ---------------- */
    function trocarEtapa(saindo, entrando, displayEntrada, animSaida, animEntrada) {
        transitando = true;

        // 1) congela a altura atual do card e a posição da seção que sai
        const alturaInicial = form.offsetHeight;
        const topo = saindo.offsetTop;
        const esquerda = saindo.offsetLeft;
        const largura = saindo.offsetWidth;
        const alturaSaindo = saindo.offsetHeight;

        form.style.transition = `height ${DURACAO_TRANSICAO}ms ease`;
        form.style.height = alturaInicial + 'px';

        // 2) a seção que sai vira "flutuante" e desliza para a esquerda
        Object.assign(saindo.style, {
            position: 'absolute',
            top: topo + 'px',
            left: esquerda + 'px',
            width: largura + 'px',
            height: alturaSaindo + 'px',
            animation: `${animSaida} ${DURACAO_TRANSICAO}ms ease-in forwards`
        });

        // 3) a seção que entra ocupa o lugar e desliza vindo da direita
        entrando.style.height = 'auto';
        entrando.style.display = displayEntrada;
        entrando.style.animation = `${animEntrada} ${DURACAO_TRANSICAO}ms ease-out backwards`;

        // 4) o card se ajusta suavemente à altura da nova etapa
        const alturaFinal = entrando.offsetTop + entrando.offsetHeight
            + parseFloat(getComputedStyle(form).paddingBottom);
        form.style.height = alturaFinal + 'px';

        // 5) limpa tudo ao final
        setTimeout(() => {
            saindo.style.display = 'none';
            ['position', 'top', 'left', 'width', 'height', 'animation'].forEach((p) => { saindo.style[p] = ''; });
            entrando.style.height = '';
            entrando.style.animation = '';
            form.style.height = '';
            form.style.transition = '';
            transitando = false;
        }, DURACAO_TRANSICAO);
    }

    function avancar() {
        if (transitando || !validarEtapa1()) return;
        trocarEtapa(primeiraSessao, segundaSessao, 'grid', 'disappearLeft', 'aparecerDireita');
        setTimeout(() => cpfUser.focus(), DURACAO_TRANSICAO);
    }

    nextStep.addEventListener('click', avancar);

    /* ---------------- Envio ---------------- */
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        // Enter na etapa 1 apenas avança (com a mesma validação do botão)
        if (getComputedStyle(segundaSessao).display === 'none') {
            avancar();
            return;
        }

        if (!validarEtapa2()) return;

        botaoSubmit.disabled = true;
        botaoSubmit.value = 'Cadastrando...';

        try {
            const resp = await cadastrar(
                nomeUser.value.trim(),
                email.value.trim(),
                password.value,
                telefone.value.trim() || null,
                cpfUser.value,
                dataNascUser.value,
                opcoesSexo.value === 'null' ? null : opcoesSexo.value
            );

            if (resp.status === 409) {
                abrirAlertaUsuarioExistente();
                return;
            }

            if (!resp.ok) {
                let mensagem = 'Não foi possível concluir o cadastro. Tente novamente.';
                try {
                    const dados = await resp.json();
                    mensagem = dados.error || dados.erro || mensagem;
                } catch (_) { /* resposta sem JSON */ }
                mostrarErro(preencherCampos, mensagem);
                return;
            }

            window.location.href = 'indexComprador.html';

        } catch (erro) {
            console.error('Erro ao conectar com o servidor:', erro);
            mostrarErro(preencherCampos, 'Não foi possível conectar ao servidor. Tente novamente em instantes.');
        } finally {
            botaoSubmit.disabled = false;
            botaoSubmit.value = 'Cadastrar';
        }
    });

});
