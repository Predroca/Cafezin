/**
 * formsFunctionality.js
 * -----------------------------------------------------------------
 * Funções utilitárias de INTERFACE, reaproveitáveis em qualquer
 * formulário do site (login, cadastro de comprador, cadastro de
 * vendedor, etc).
 *
 * Este arquivo NUNCA faz requisições ao servidor e NUNCA decide se
 * um formulário pode ser enviado — ele só cuida da experiência
 * visual (mostrar/ocultar senha, estilizar campos, indicar senhas
 * iguais, exibir alertas). As regras de negócio e a integração com
 * o back-end continuam 100% nos scripts de cada tela
 * (login.js, enviar.js, cadastrar.js, enviarCadastro.js).
 * -----------------------------------------------------------------
 */

document.addEventListener('DOMContentLoaded', () => {
    iniciarBotoesDeOlho();
    iniciarEstiloDeValidacao();
});

/* ---------------------------------------------------------------
   Mostrar / ocultar senha
   Qualquer botão com o atributo [data-toggle-target="idDoInput"]
   vira um olho de senha automaticamente — basta usar o atributo
   no HTML, sem precisar escrever JS novo em cada tela.
--------------------------------------------------------------- */
function iniciarBotoesDeOlho() {
    document.querySelectorAll('[data-toggle-target]').forEach((botao) => {
        const input = document.getElementById(botao.dataset.toggleTarget);
        if (!input) return;

        botao.addEventListener('click', () => {
            const vaiMostrar = input.type === 'password';
            input.type = vaiMostrar ? 'text' : 'password';

            botao.setAttribute('aria-pressed', String(vaiMostrar));
            botao.setAttribute('aria-label', vaiMostrar ? 'Ocultar senha' : 'Mostrar senha');

            const icone = botao.querySelector('i');
            if (icone) {
                icone.classList.toggle('bi-eye', vaiMostrar);
                icone.classList.toggle('bi-eye-slash', !vaiMostrar);
            }
        });
    });
}

/* ---------------------------------------------------------------
   Estilo de validação (classes is-valid / is-invalid do Bootstrap)
   Só aplica classes visuais — nunca bloqueia o envio do formulário.
   Quem decide se os dados estão certos continua sendo o script de
   integração de cada tela.
--------------------------------------------------------------- */
function iniciarEstiloDeValidacao() {
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    document.querySelectorAll('input[type="email"]').forEach((input) => {
        input.addEventListener('input', () => {
            const valor = input.value.trim();
            marcarCampo(input, valor === '' ? null : regexEmail.test(valor));
        });
    });

    const nomeUserInput = document.getElementById('nomeUser');
    if (nomeUserInput) {
        nomeUserInput.addEventListener('input', () => {
            const valor = nomeUserInput.value.trim();
            marcarCampo(nomeUserInput, valor === '' ? null : valor.length >= 3);
        });
    }

    ativarIndicadorDeSenhas('password', 'confirmPsswd', 'mensagemSenha');
}

function marcarCampo(input, valido) {
    input.classList.remove('is-valid', 'is-invalid');
    if (valido === true) input.classList.add('is-valid');
    if (valido === false) input.classList.add('is-invalid');
}

/* ---------------------------------------------------------------
   Indicador de senhas iguais.
   Reaproveitável em qualquer formulário que tenha um campo de
   senha e um de confirmação — se os três ids existirem na página,
   a função já ativa sozinha (chamada dentro de
   iniciarEstiloDeValidacao). Também pode ser chamada manualmente
   passando outros ids, se uma nova tela usar nomes diferentes.
--------------------------------------------------------------- */
function ativarIndicadorDeSenhas(idSenha, idConfirmar, idMensagem) {
    const senha = document.getElementById(idSenha);
    const confirmar = document.getElementById(idConfirmar);
    const mensagem = document.getElementById(idMensagem);
    if (!senha || !confirmar || !mensagem) return;

    function atualizar() {
        if (confirmar.value === '') {
            mensagem.textContent = '';
            mensagem.classList.remove('senhasConferem');
            marcarCampo(confirmar, null);
            return;
        }
        const iguais = senha.value === confirmar.value;
        mensagem.textContent = iguais ? 'As senhas conferem' : 'As senhas ainda não são iguais';
        mensagem.classList.toggle('senhasConferem', iguais);
        marcarCampo(confirmar, iguais);
    }

    senha.addEventListener('input', atualizar);
    confirmar.addEventListener('input', atualizar);
}

/* ---------------------------------------------------------------
   Alerta temporário reutilizável.
   Ex: mostrarAlertaTemporario('errorLogin') exibe a caixa de erro
   e some sozinha depois de `duracao` ms. Os scripts de integração
   (enviar.js, enviarCadastro.js, etc) podem chamar essa função em
   vez de repetir a mesma lógica de setTimeout em cada arquivo.
--------------------------------------------------------------- */
function mostrarAlertaTemporario(id, duracao = 3800) {
    const caixa = document.getElementById(id);
    if (!caixa) return;
    caixa.style.display = 'flex';
    setTimeout(() => { caixa.style.display = 'none'; }, duracao);
}
