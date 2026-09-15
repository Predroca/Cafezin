
const olhos = document.querySelectorAll('.confPsswdEye');

olhos.forEach((olho) => {

    olho.addEventListener('click', function () {

        const psswdInput = this.parentElement.querySelector('.passwordCamp');

        if (psswdInput.type === 'password') {

            psswdInput.type = 'text';
            this.src = 'icones/FormIcons/olhoSemBarreiras.svg';

        } else {

            psswdInput.type = 'password';
            this.src = 'icones/FormIcons/psswdEye.svg';
        }
    });

});

function conferirSenhasIguais() {

    let verdadeiro = true;

    let senha = document.getElementById('password');
    let confirmSenha = document.getElementById('confirmPsswd');

    if (
        !(senha.value === confirmSenha.value) ||
        senha.value === '' && confirmSenha.value === ''
    ) {

        verdadeiro = false;

        let er = document.getElementById('diferentPsswd');

        er.style.display = 'flex';

        senha.value = '';
        confirmSenha.value = '';

        setTimeout(() => {
            er.style.display = 'none';
        }, 3800);
    }

    return verdadeiro;
}
