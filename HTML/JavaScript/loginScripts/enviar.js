const form = document.getElementById("loginForm");

form.addEventListener("submit", async (event) => {

    event.preventDefault();

    takeAnswer();
});

async function takeAnswer() {

    let usuario = document.getElementById('email').value;
    let senha = document.getElementById('password').value;

    const resposta = await sendDados(usuario, senha);

    if (!resposta.ok) {

        let er = document.getElementById('errorLogin');
        let psswdInput = document.getElementById('password');

        er.style.display = 'flex';
        psswdInput.value = '';

        setTimeout(() => {
            er.style.display = 'none';
        }, 3800);

    } else {

        let dados = await resposta.json();

        localStorage.setItem('token', dados.token);

        const data = JSON.parse(
            atob(localStorage.getItem('token').split('.')[1])
        );

        alert(data.nome);
    }
}