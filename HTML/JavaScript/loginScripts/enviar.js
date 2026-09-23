const form = document.getElementById("loginForm");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    takeAnswer();
});

async function takeAnswer() {
        let email = document.getElementById('email').value;
        let psswd = document.getElementById('password').value;

        const resposta = await sendDados(email, psswd)
        if(resposta.ok){
            let dados = await resposta.json();

            localStorage.setItem('token', dados.token);

            const data = JSON.parse(
                atob(localStorage.getItem('token').split('.')[1])
            );

            if(data.tipo_usuario==='Loja'){
                window.location.href='indexLoja.html';
            }
            else if(data.tipo_usuario==='Comprador'){
                window.location.href='indexComprador.html';
            }
        }
        
}