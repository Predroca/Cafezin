const form = document.getElementById("loginForm");
const aviso = document.getElementById("errorLogin");
const mensagem = document.getElementById("errorLoginMensagem");
const botao = document.getElementById("submit");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("password").value;
    if (!email || !senha) {
        mostrarErroLogin("Informe seu e-mail e sua senha.");
        return;
    }

    aviso.style.display = "none";
    botao.disabled = true;
    botao.querySelector("span").textContent = "Entrando...";

    try {
        const resposta = await fetch("http://localhost:5000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });
        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            mostrarErroLogin(dados.erro || dados.error || "E-mail ou senha inválidos. Tente novamente.");
            return;
        }
        if (!dados.token) {
            mostrarErroLogin("O servidor não retornou uma sessão válida. Tente novamente.");
            return;
        }

        const segmento = dados.token.split(".")[1];
        const base64 = segmento.replace(/-/g, "+").replace(/_/g, "/");
        const preenchido = base64 + "=".repeat((4 - base64.length % 4) % 4);
        const bytes = Uint8Array.from(atob(preenchido), caractere => caractere.charCodeAt(0));
        const claims = JSON.parse(new TextDecoder().decode(bytes));
        const destinos = {
            Loja: "indexLoja.html",
            Comprador: "indexComprador.html",
            Entregador: "indexEntregador.html",
            Admin: "indexAdministrador.html"
        };
        const destino = destinos[claims.tipo_usuario];

        if (!destino) {
            mostrarErroLogin("O tipo desta conta não é reconhecido.");
            return;
        }

        localStorage.setItem("token", dados.token);
        window.location.href = destino;
    } catch (erro) {
        mostrarErroLogin("Não foi possível conectar ao servidor. Tente novamente em instantes.");
    } finally {
        botao.disabled = false;
        botao.querySelector("span").textContent = "Entrar";
    }
});

function mostrarErroLogin(texto) {
    mensagem.textContent = texto;
    aviso.style.display = "flex";
}
