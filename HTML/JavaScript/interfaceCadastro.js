document.addEventListener('DOMContentLoaded', () => {


    function configurarOlho(botaoId, inputId){
        const botao = document.getElementById(botaoId);
        const input = document.getElementById(inputId);
        if(!botao || !input) return;

        botao.addEventListener('click', () => {
            const oculto = input.type === 'password';
            input.type = oculto ? 'text' : 'password';
            botao.setAttribute('aria-pressed', String(oculto));
            botao.setAttribute('aria-label', oculto ? 'Ocultar senha' : 'Mostrar senha');
        });
    }
    configurarOlho('olhoSenha', 'password');
    configurarOlho('olhoConfirmar', 'confirmPsswd');

    function marcarCampo(input, valido){
        const wrapper = input.closest('.inptLoginEmail');
        if(!wrapper) return;
        wrapper.classList.toggle('campoValido', valido === true);
        wrapper.classList.toggle('campoInvalido', valido === false);
    }

    const nomeUserInput = document.getElementById('nomeUser');
    if(nomeUserInput){
        nomeUserInput.addEventListener('input', () => {
            const valor = nomeUserInput.value.trim();
            if(valor === '') marcarCampo(nomeUserInput, null);
            else marcarCampo(nomeUserInput, valor.length >= 3);
        });
    }

    const emailInput = document.getElementById('email');
    if(emailInput){
        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        emailInput.addEventListener('input', () => {
            const valor = emailInput.value.trim();
            if(valor === '') marcarCampo(emailInput, null);
            else marcarCampo(emailInput, regexEmail.test(valor));
        });
    }

    const senhaInput = document.getElementById('password');
    const confirmarInput = document.getElementById('confirmPsswd');
    const mensagemSenha = document.getElementById('mensagemSenha');

    function atualizarMensagemSenha(){
        if(!senhaInput || !confirmarInput || !mensagemSenha) return;
        const senha = senhaInput.value;
        const confirmar = confirmarInput.value;

        if(confirmar === ''){
            mensagemSenha.textContent = '';
            mensagemSenha.classList.remove('senhasConferem');
            return;
        }
        if(senha === confirmar){
            mensagemSenha.textContent = 'As senhas conferem';
            mensagemSenha.classList.add('senhasConferem');
        } else {
            mensagemSenha.textContent = 'As senhas ainda não são iguais';
            mensagemSenha.classList.remove('senhasConferem');
        }
    }
    if(senhaInput) senhaInput.addEventListener('input', atualizarMensagemSenha);
    if(confirmarInput) confirmarInput.addEventListener('input', atualizarMensagemSenha);

    const dot1 = document.querySelector('.stepDot[data-step="1"]');
    const dot2 = document.querySelector('.stepDot[data-step="2"]');
    const linha = document.getElementById('stepLinha');
    const secao1 = document.getElementById('primeiraSessao');
    const secao2 = document.getElementById('segundaSessao');

    function irParaEtapa2(){
        if(dot1) { dot1.classList.remove('ativo'); dot1.classList.add('concluido'); }
        if(dot2) dot2.classList.add('ativo');
        if(linha) linha.classList.add('preenchida');
    }
    function irParaEtapa1(){
        if(dot1) { dot1.classList.add('ativo'); dot1.classList.remove('concluido'); }
        if(dot2) dot2.classList.remove('ativo');
        if(linha) linha.classList.remove('preenchida');
    }

    if(secao2){
        const observer = new MutationObserver(() => {
            const visivel = secao2.style.display && secao2.style.display !== 'none';
            if(visivel) irParaEtapa2();
        });
        observer.observe(secao2, { attributes: true, attributeFilter: ['style'] });
    }

    const botaoVoltar = document.getElementById('prevStep');
    if(botaoVoltar && secao1 && secao2){
        botaoVoltar.addEventListener('click', () => {
            secao2.style.animation = 'disappearLeft 0.2s linear backwards';
            secao1.style.display = 'flex';
            secao1.style.animation = 'aparecerLado 0.2s linear backwards';
            irParaEtapa1();
            setTimeout(() => {
                secao2.style.display = 'none';
                secao1.style.position = 'static';
            }, 200);
        });
    }

});
