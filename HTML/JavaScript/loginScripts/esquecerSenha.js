const form = document.getElementById("esqueciSenhaForm");
const emailInput = document.getElementById("email");
const senhaInput = document.getElementById("password");
const botao = document.getElementById("submit");
const aviso = document.getElementById("statusEsqueciSenha");

form.addEventListener("submit", async (event) => {
    event.preventDefault();
    limparAviso();

    const email = emailInput.value.trim();
    const senha = senhaInput.value;
    if (!email || !senha || !emailInput.validity.valid || senha.length < 6) {
        mostrarAviso("Informe um e-mail válido e uma senha com pelo menos 6 caracteres.", "erro");
        return;
    }

    botao.disabled = true;
    botao.querySelector("span").textContent = "Redefinindo...";

    try {
        const resposta = await fetch("http://localhost:5000/esqueci-senha", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, nova_senha: senha })
        });
        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok || dados.error || dados.erro) {
            mostrarAviso(dados.error || dados.erro || "Não foi possível redefinir a senha.", "erro");
            return;
        }

        mostrarAviso("Senha redefinida com sucesso. Redirecionando para o login...", "sucesso");
        window.setTimeout(() => { window.location.href = "login.html"; }, 1200);
    } catch (erro) {
        mostrarAviso("Não foi possível conectar ao servidor. Tente novamente em instantes.", "erro");
    } finally {
        botao.disabled = false;
        botao.querySelector("span").textContent = "Redefinir senha";
    }
});

function mostrarAviso(texto, tipo) {
    aviso.textContent = texto;
    aviso.className = `mensagemAuth ${tipo}`;
    aviso.hidden = false;
}

function limparAviso() {
    aviso.textContent = "";
    aviso.hidden = true;
    aviso.className = "mensagemAuth";
}
