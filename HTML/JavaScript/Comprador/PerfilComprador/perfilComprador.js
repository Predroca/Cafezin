/*
Perfil do comprador: dados pessoais, formulário, validações e foto.

renderCabecalho() recebe as contagens por parâmetro em vez de importar
enderecos.js e favoritas.js, o que evita dependência circular.
O main.js é quem monta essas contagens e passa o callback aoAtualizar.
*/

import { CHAVES, PERFIL_PADRAO } from "./config.js";
import { ler, salvar } from "./armazenamento.js";
import { $, avisar } from "./utilitarios.js";

/* ---------- Estado ---------- */
let perfil = Object.assign({}, PERFIL_PADRAO, ler(CHAVES.perfil, {}));

export function obterPerfil() {
    return perfil;
}

/* ---------- Cabeçalho ---------- */
export function primeiroNome(nome) {
    return nome.trim().split(/\s+/)[0] || "Cliente";
}

export function renderAvatar() {
    const avatar = $("avatar");
    avatar.textContent = "";
    if (perfil.foto) {
        const img = document.createElement("img");
        img.src = perfil.foto;
        img.alt = "";
        avatar.appendChild(img);
    } else {
        avatar.textContent = primeiroNome(perfil.nome).charAt(0).toUpperCase();
    }
}

// contagens = { pedidos, favoritas, enderecos }
export function renderCabecalho(contagens) {
    $("perfilNome").textContent = perfil.nome;
    $("perfilEmail").textContent = perfil.email;
    $("resumoPedidos").textContent = contagens.pedidos;
    $("resumoFavoritas").textContent = contagens.favoritas;
    $("resumoEnderecos").textContent = contagens.enderecos;
    renderAvatar();
}

/* ---------- Meus dados ---------- */
const formDados = $("formDados");
const camposDados = {
    nome: $("campoNome"),
    email: $("campoEmail"),
    telefone: $("campoTelefone"),
    nascimento: $("campoNascimento")
};

export function preencherForm() {
    Object.keys(camposDados).forEach(function (k) {
        camposDados[k].value = perfil[k] || "";
    });
    limparErros();
}

function mostrarErro(campo, mensagem) {
    const alvo = document.querySelector('[data-erro-para="' + campo.id + '"]');
    if (alvo) alvo.textContent = mensagem;
    campo.setAttribute("aria-invalid", mensagem ? "true" : "false");
    if (alvo) {
        campo.setAttribute("aria-describedby", alvo.id || (alvo.id = campo.id + "Erro"));
    }
}

function limparErros() {
    Object.values(camposDados).forEach((c) => mostrarErro(c, ""));
}

function formatarTelefone(valor) {
    const n = valor.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 2) return n ? "(" + n : "";
    if (n.length <= 3) return "(" + n.slice(0, 2) + ") " + n.slice(2);
    if (n.length <= 7) return "(" + n.slice(0, 2) + ") " + n.slice(2, 3) + " " + n.slice(3);
    return "(" + n.slice(0, 2) + ") " + n.slice(2, 3) + " " + n.slice(3, 7) + "-" + n.slice(7);
}

function validarDados() {
    limparErros();
    let primeiroInvalido = null;

    function falhar(campo, msg) {
        mostrarErro(campo, msg);
        if (!primeiroInvalido) primeiroInvalido = campo;
    }

    if (camposDados.nome.value.trim().length < 3) {
        falhar(camposDados.nome, "Digite seu nome completo.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(camposDados.email.value.trim())) {
        falhar(camposDados.email, "Digite um e-mail válido, como nome@email.com.");
    }
    if (camposDados.telefone.value.replace(/\D/g, "").length !== 11) {
        falhar(camposDados.telefone, "Digite o telefone com DDD e 9 dígitos.");
    }

    if (primeiroInvalido) primeiroInvalido.focus();
    return !primeiroInvalido;
}

/* ---------- Eventos ---------- */
// aoAtualizar: função chamada quando os dados do perfil mudam (o main.js redesenha o cabeçalho)
export function iniciarPerfil(aoAtualizar) {
    // Foto de perfil
    $("avatarArquivo").addEventListener("change", function () {
        const arquivo = this.files[0];
        if (!arquivo) return;

        if (arquivo.size > 1024 * 1024) {
            avisar("Escolha uma foto de até 1 MB.");
            this.value = "";
            return;
        }

        const leitor = new FileReader();
        leitor.onload = function () {
            perfil.foto = leitor.result;
            if (salvar(CHAVES.perfil, perfil)) {
                avisar("Foto atualizada.");
            } else {
                avisar("Não foi possível guardar a foto. Tente uma imagem menor.");
                perfil.foto = "";
            }
            renderAvatar();
        };
        leitor.readAsDataURL(arquivo);
    });

    // Máscara do telefone
    camposDados.telefone.addEventListener("input", function () {
        this.value = formatarTelefone(this.value);
    });

    // Salvar dados
    formDados.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!validarDados()) return;

        perfil.nome = camposDados.nome.value.trim();
        perfil.email = camposDados.email.value.trim();
        perfil.telefone = camposDados.telefone.value;
        perfil.nascimento = camposDados.nascimento.value;

        if (salvar(CHAVES.perfil, perfil)) {
            aoAtualizar();
            avisar("Dados salvos.");
        } else {
            avisar("Não foi possível salvar. Verifique o espaço do navegador.");
        }
    });

    // Descartar alterações
    $("descartarDados").addEventListener("click", function () {
        preencherForm();
        avisar("Alterações descartadas.");
    });
}
