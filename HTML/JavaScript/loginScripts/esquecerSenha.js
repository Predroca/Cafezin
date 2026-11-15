const form = document.getElementById("esqueciSenhaForm");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("password");
const botao = document.getElementById("submit");
const aviso = document.getElementById("errorEsqueciSenha");
const mensagem = document.getElementById("mensagemEsqueciSenha");
let timerErro;

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    esconderErro();
    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!email || !senha || !emailInput.validity.valid || senha.length < 6) {
        mostrarErro("Informe um e-mail válido e uma senha com pelo menos 6 caracteres.");
        return;
    }

    botao.disabled = true;
    botao.querySelector("span").textContent = "Redefinindo...";
    try {
        const resposta = await fetch("http://localhost:5000/esqueci-senha", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ "email" : email, "nova_senha": senha })
        });
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok || dados.error || dados.erro) {
            mostrarErro(dados.error || dados.erro || "Não foi possível redefinir a senha. Tente novamente.");
            return;
        }
        window.location.href = "login.html";
    } catch (erro) {
        mostrarErro("Não foi possível conectar ao servidor. Tente novamente em instantes.");
    } finally {
        botao.disabled = false;
        botao.querySelector("span").textContent = "Redefinir senha";
    }
});

function mostrarErro(texto) {
    window.clearTimeout(timerErro);
    mensagem.textContent = texto;
    aviso.style.display = "flex";
    timerErro = window.setTimeout(esconderErro, 4000);
}

function esconderErro() {
    window.clearTimeout(timerErro);
    aviso.style.display = "none";
}
