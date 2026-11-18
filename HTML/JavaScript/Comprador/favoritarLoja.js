// ==========================================
// FAVORITAR CAFETERIAS
// ==========================================
// Rotas do backend (comprador_bp.py):
//   GET    /favoritas              -> lista as lojas favoritas
//   POST   /favoritas/<cod_loja>   -> favorita
//   DELETE /favoritas/<cod_loja>   -> desfavorita
//
// Os cards são criados dinamicamente por lojasPopulares.js e secoesInicio.js,
// por isso usamos delegação de eventos e um MutationObserver.

const API_URL_FAVORITOS = "http://localhost:5000";

// cod_loja das lojas já favoritadas pelo comprador logado
const lojasFavoritas = new Set();

function tokenFavoritos() {
    return localStorage.getItem("token");
}

function cabecalhosFavoritos() {
    return { "Authorization": `Bearer ${tokenFavoritos()}` };
}

// ---------- Estado inicial ----------

document.addEventListener("DOMContentLoaded", async () => {
    // Marca os corações dos cards que forem sendo criados na página
    new MutationObserver(marcarFavoritasNaTela)
        .observe(document.body, { childList: true, subtree: true });

    await carregarFavoritas();
    marcarFavoritasNaTela();
});

async function carregarFavoritas() {
    if (!tokenFavoritos()) return;

    try {
        const resposta = await fetch(`${API_URL_FAVORITOS}/favoritas`, {
            headers: cabecalhosFavoritos()
        });

        if (!resposta.ok) return;

        const lojas = await resposta.json();
        lojas.forEach(loja => lojasFavoritas.add(String(loja.cod_loja)));
    } catch (erro) {
        console.error("Erro ao carregar favoritas:", erro);
    }
}

function marcarFavoritasNaTela() {
    document.querySelectorAll(".lojaCard[data-cod-loja] .favoritar").forEach(botao => {
        const codLoja = botao.closest(".lojaCard").dataset.codLoja;
        definirEstadoFavorito(botao, lojasFavoritas.has(String(codLoja)));
    });
}

// Troca o coração vazio pelo preenchido (e vice-versa)
function definirEstadoFavorito(botao, favorito) {
    // Só mexe no DOM se algo mudou (evita loop com o MutationObserver)
    if (botao.classList.contains("favoritado") === favorito) return;

    botao.classList.toggle("favoritado", favorito);
    botao.setAttribute("aria-pressed", String(favorito));

    const icone = botao.querySelector("i");
    if (icone) {
        icone.className = favorito ? "bi bi-heart-fill" : "bi bi-heart";
    }
}

// ---------- Clique no coração ----------

document.addEventListener("click", async (evento) => {
    const botao = evento.target.closest(".lojaCard .favoritar");
    if (!botao) return;

    evento.preventDefault();
    evento.stopPropagation();

    // Evita cliques repetidos enquanto a requisição está em andamento
    if (botao.disabled) return;

    const card = botao.closest(".lojaCard");
    const codLoja = card?.dataset.codLoja;
    const nomeLoja = card?.querySelector("h3")?.textContent.trim() || "A cafeteria";

    if (!codLoja) {
        mostrarMensagemFavorito("Não foi possível identificar a cafeteria.", "erro");
        return;
    }

    if (!tokenFavoritos()) {
        mostrarMensagemFavorito("Faça login para favoritar cafeterias.", "erro");
        return;
    }

    const jaFavorita = lojasFavoritas.has(String(codLoja));

    botao.disabled = true;

    try {
        const resposta = await fetch(
            `${API_URL_FAVORITOS}/favoritas/${encodeURIComponent(codLoja)}`,
            {
                method: jaFavorita ? "DELETE" : "POST",
                headers: cabecalhosFavoritos()
            }
        );

        const dados = await resposta.json().catch(() => ({}));

        if (resposta.ok && !jaFavorita) {
            registrarFavorito(codLoja, true);
            mostrarMensagemFavorito(`${nomeLoja} foi adicionada aos seus favoritos!`, "sucesso");

        } else if (resposta.ok && jaFavorita) {
            registrarFavorito(codLoja, false);
            mostrarMensagemFavorito(`${nomeLoja} foi removida dos seus favoritos.`, "sucesso");

        } else if (resposta.status === 409) {
            // Backend já tinha o favorito: só sincroniza a tela
            registrarFavorito(codLoja, true);
            mostrarMensagemFavorito(`${nomeLoja} já está nos seus favoritos.`, "sucesso");

        } else if (resposta.status === 404 && jaFavorita) {
            // Já não era favorita no backend: sincroniza a tela
            registrarFavorito(codLoja, false);

        } else if (resposta.status === 401 || resposta.status === 422) {
            mostrarMensagemFavorito("Sua sessão expirou. Faça login novamente.", "erro");

        } else if (resposta.status === 403) {
            mostrarMensagemFavorito("Apenas compradores podem favoritar cafeterias.", "erro");

        } else {
            mostrarMensagemFavorito(
                dados.error || dados.erro || dados.mensagem || "Não foi possível atualizar o favorito.",
                "erro"
            );
        }
    } catch (erro) {
        console.error("Erro ao favoritar loja:", erro);
        mostrarMensagemFavorito("Erro de conexão com o servidor.", "erro");
    } finally {
        botao.disabled = false;
    }
});

// Atualiza o conjunto e todos os cards da mesma loja
// (a mesma loja pode aparecer em "em destaque" e em "parceiras")
function registrarFavorito(codLoja, favorito) {
    if (favorito) {
        lojasFavoritas.add(String(codLoja));
    } else {
        lojasFavoritas.delete(String(codLoja));
    }
    marcarFavoritasNaTela();
}

// ---------- Mensagem de confirmação (toast) ----------

function mostrarMensagemFavorito(texto, tipo = "sucesso") {
    garantirEstiloMensagemFavorito();

    document.querySelector(".mensagemFavorito")?.remove();

    const aviso = document.createElement("div");
    aviso.className = `mensagemFavorito ${tipo}`;
    aviso.setAttribute("role", "status");
    aviso.setAttribute("aria-live", "polite");

    const icone = document.createElement("i");
    icone.className = tipo === "sucesso"
        ? "bi bi-check-circle-fill"
        : "bi bi-exclamation-circle-fill";

    const span = document.createElement("span");
    span.textContent = texto;

    aviso.append(icone, span);
    document.body.appendChild(aviso);

    requestAnimationFrame(() => aviso.classList.add("visivel"));

    setTimeout(() => {
        aviso.classList.remove("visivel");
        setTimeout(() => aviso.remove(), 300);
    }, 3000);
}

function garantirEstiloMensagemFavorito() {
    if (document.getElementById("estiloMensagemFavorito")) return;

    const estilo = document.createElement("style");
    estilo.id = "estiloMensagemFavorito";
    estilo.textContent = `
        .mensagemFavorito {
            position: fixed;
            left: 50%;
            bottom: 24px;
            transform: translate(-50%, 20px);
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: calc(100% - 32px);
            padding: 12px 18px;
            border-radius: 12px;
            color: #fff;
            font-size: 0.95rem;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
            opacity: 0;
            transition: opacity 0.3s, transform 0.3s;
            z-index: 10000;
        }
        .mensagemFavorito.visivel {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        .mensagemFavorito.sucesso { background: #2e7d32; }
        .mensagemFavorito.erro { background: #c62828; }
        .favoritar.favoritado i { color: #e53935; }
    `;
    document.head.appendChild(estilo);
}