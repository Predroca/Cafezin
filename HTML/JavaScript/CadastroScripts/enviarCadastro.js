/* Cadastro Cafézin: somente front-end (sem backend por enquanto).
   Quando for integrar, o ponto de envio é o "TODO backend" no final do arquivo. */

document.addEventListener('DOMContentLoaded', () => {

    /* ---------------- Configurações ---------------- */
    const DURACAO_TRANSICAO = 300;   // ms — slide entre as etapas
    const DURACAO_ERRO = 3800;       // ms — tempo dos alertas simples
    const SENHA_MIN = 6;             // tamanho mínimo da senha

    // Textos do Step 2 para cada tipo de usuário
    const TEXTOS_ETAPA2 = {
        '':         { rotulo: 'Dados pessoais',     subtitulo: 'Agora só precisamos de mais alguns dados' },
        comprador:  { rotulo: 'Dados pessoais',     subtitulo: 'Agora só precisamos de mais alguns dados' },
        loja:       { rotulo: 'Dados da loja',      subtitulo: 'Conte para a gente onde sua loja fica' },
        entregador: { rotulo: 'Dados do entregador', subtitulo: 'Precisamos de alguns dados para as suas entregas' }
    };

    /* ---------------- Elementos ---------------- */
    const form = document.getElementById('loginForm');
    const primeiraSessao = document.getElementById('primeiraSessao');
    const segundaSessao = document.getElementById('segundaSessao');
    const nextStep = document.getElementById('nextStep');

    // Step 1 (comuns)
    const seletorTipo = document.getElementById('seletorTipo');
    const nomeUser = document.getElementById('nomeUser');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPsswd = document.getElementById('confirmPsswd');
    const telefone = document.getElementById('telefone');

    // Step 2: comprador / entregador
    const cpfUser = document.getElementById('cpfUser');
    const dataNascUser = document.getElementById('dataNascUser');
    const opcoesSexo = document.getElementById('opcoesSexo');
    const cnhEntregador = document.getElementById('cnhEntregador');
    const pagamentoEntregador = document.getElementById('pagamentoEntregador');

    // Step 2: loja
    const ruaLoja = document.getElementById('ruaLoja');
    const numeroLoja = document.getElementById('numeroLoja');
    const bairroLoja = document.getElementById('bairroLoja');
    const cidadeLoja = document.getElementById('cidadeLoja');
    const estadoLoja = document.getElementById('estadoLoja');
    const cepLoja = document.getElementById('cepLoja');
    const cnpjLoja = document.getElementById('cnpjLoja');
    const abreLoja = document.getElementById('abreLoja');
    const fechaLoja = document.getElementById('fechaLoja');

    const gruposEtapa2 = document.querySelectorAll('.grupoCampos');
    const rotuloEtapa2 = document.getElementById('rotuloEtapa2');
    const subtituloEtapa2 = document.getElementById('subtituloEtapa2');

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

    /* ---------------- Tipo de usuário ---------------- */

    // Devolve "comprador", "loja", "entregador" ou "" (nada escolhido)
    function tipoSelecionado() {
        const marcado = form.querySelector('input[name="tipoUsuario"]:checked');
        return marcado ? marcado.value : '';
    }

    // Monta o Step 2 para o tipo escolhido:
    // mostra os grupos do tipo e esconde + desabilita (disabled) os demais.
    function montarEtapa2(tipo) {
        gruposEtapa2.forEach((grupo) => {
            const ativo = grupo.dataset.tipos.split(' ').includes(tipo);

            grupo.classList.toggle('d-none', !ativo);

            grupo.querySelectorAll('input, select').forEach((campo) => {
                campo.disabled = !ativo;                       // desabilitado = ignorado
                campo.classList.remove('is-invalid', 'is-valid');
            });
        });

        rotuloEtapa2.textContent = TEXTOS_ETAPA2[tipo].rotulo;
        subtituloEtapa2.textContent = TEXTOS_ETAPA2[tipo].subtitulo;
    }

    form.querySelectorAll('input[name="tipoUsuario"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            seletorTipo.classList.remove('is-invalid');
            montarEtapa2(tipoSelecionado());
        });
    });

    montarEtapa2(tipoSelecionado());   // estado inicial (também cobre F5 com rádio marcado)

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
            [seletorTipo, tipoSelecionado() !== '', 'Escolha se você é comprador, loja ou entregador.'],
            [nomeUser, nomeUser.value.trim().length >= 3, 'O nome de usuário precisa ter ao menos 3 caracteres.'],
            [email, regexEmail.test(email.value.trim()), 'Digite um e-mail válido.'],
            [password, password.value.length >= SENHA_MIN, `A senha precisa ter ao menos ${SENHA_MIN} caracteres.`],
            [confirmPsswd, confirmPsswd.value !== '', 'Confirme a sua senha.'],
            [confirmPsswd, password.value === confirmPsswd.value, null, diferentPsswd],
            [telefone, tel === '' || /^\d{10,11}$/.test(tel), 'Telefone inválido. Use o DDD + número.']
        ]);
    }

    function validarEtapa2() {
        const tipo = tipoSelecionado();
        if (tipo === '') return false;

        const regras = [];

        if (tipo === 'comprador' || tipo === 'entregador') {
            regras.push([cpfUser, cpfValido(cpfUser.value), 'CPF inválido. Confira os 11 números.']);
            regras.push([dataNascUser, dataValida(dataNascUser.value), 'Informe uma data de nascimento válida.']);
        }

        if (tipo === 'comprador') {
            regras.push([opcoesSexo, ['M', 'F', 'null'].includes(opcoesSexo.value), 'Selecione uma opção de sexo.']);
        }

        if (tipo === 'loja') {
            regras.push([ruaLoja, ruaLoja.value.trim().length >= 3, 'Informe o nome da rua.']);
            regras.push([numeroLoja, numeroLoja.value.trim() !== '', 'Informe o número do estabelecimento.']);
            regras.push([bairroLoja, bairroLoja.value.trim() !== '', 'Informe o bairro.']);
            regras.push([cidadeLoja, cidadeLoja.value.trim() !== '', 'Informe a cidade.']);
            regras.push([estadoLoja, estadoLoja.value !== '', 'Selecione o estado.']);
            regras.push([cepLoja, /^\d{8}$/.test(cepLoja.value), 'CEP inválido. Use os 8 números.']);
            regras.push([cnpjLoja, /^\d{14}$/.test(cnpjLoja.value), 'CNPJ inválido. Use os 14 números.']);
            regras.push([abreLoja, abreLoja.value !== '', 'Informe o horário de abertura.']);
            regras.push([fechaLoja, fechaLoja.value !== '', 'Informe o horário de fechamento.']);
        }

        if (tipo === 'entregador') {
            regras.push([cnhEntregador, /^\d{11}$/.test(cnhEntregador.value), 'CNH inválida. Use os 11 números.']);
            regras.push([pagamentoEntregador, pagamentoEntregador.value !== '', 'Selecione o tipo de pagamento.']);
        }

        return checar(regras);
    }

    /* ---------------- Máscaras simples (só números) ---------------- */
    function somenteNumeros(campo, limite) {
        campo.addEventListener('input', () => {
            campo.value = campo.value.replace(/\D/g, '').slice(0, limite);
        });
    }
    somenteNumeros(cpfUser, 11);
    somenteNumeros(telefone, 11);
    somenteNumeros(cnpjLoja, 14);
    somenteNumeros(cepLoja, 8);
    somenteNumeros(cnhEntregador, 11);

    // tira o destaque vermelho assim que a pessoa volta a editar o campo
    [password, telefone].forEach((campo) => {
        campo.addEventListener('input', () => campo.classList.remove('is-invalid'));
    });
    segundaSessao.querySelectorAll('input, select').forEach((campo) => {
        campo.addEventListener('input', () => campo.classList.remove('is-invalid'));
        campo.addEventListener('change', () => campo.classList.remove('is-invalid'));
    });

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
        montarEtapa2(tipoSelecionado());   // garante que o Step 2 está certo antes de aparecer
        trocarEtapa(primeiraSessao, segundaSessao, 'grid', 'disappearLeft', 'aparecerDireita');
        setTimeout(() => {
            const primeiroCampo = segundaSessao.querySelector('input:not(:disabled), select:not(:disabled)');
            if (primeiroCampo) primeiroCampo.focus();
        }, DURACAO_TRANSICAO);
    }

    nextStep.addEventListener('click', avancar);

    /* ---------------- Envio (sem backend) ---------------- */

    // Monta o objeto só com os campos do tipo escolhido (Usuario + subclasse)
    function montarDados() {
        const tipo = tipoSelecionado();

        // atributos de Usuario (comuns). A senha fica de fora de propósito para não ir ao console.
        const dados = {
            tipo: tipo,
            nome: nomeUser.value.trim(),
            email: email.value.trim(),
            telefone: telefone.value.trim() || null
        };

        if (tipo === 'comprador' || tipo === 'entregador') {
            dados.cpf = cpfUser.value;
            dados.dataNascimento = dataNascUser.value;
        }
        if (tipo === 'comprador') {
            dados.sexo = opcoesSexo.value === 'null' ? null : opcoesSexo.value;
        }
        if (tipo === 'loja') {
            dados.rua = ruaLoja.value.trim();
            dados.numero = numeroLoja.value.trim();
            dados.bairro = bairroLoja.value.trim();
            dados.cidade = cidadeLoja.value.trim();
            dados.estado = estadoLoja.value;
            dados.cep = cepLoja.value;
            dados.cnpj = cnpjLoja.value;
            dados.horarioFuncionamento = abreLoja.value + ' às ' + fechaLoja.value;
        }
        if (tipo === 'entregador') {
            dados.cnh = cnhEntregador.value;
            dados.tipoPagamento = pagamentoEntregador.value;
        }
        return dados;
    }

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        // Enter na etapa 1 apenas avança (com a mesma validação do botão)
        if (getComputedStyle(segundaSessao).display === 'none') {
            avancar();
            return;
        }

        if (!validarEtapa2()) return;

        const dados = montarDados();
        console.log('Cadastro validado (sem backend):', dados);
        alert('Cadastro de ' + dados.tipo + ' validado! Veja os dados no console (F12).');

        // TODO backend: aqui entra o fetch/POST quando você for integrar.
    });
});
