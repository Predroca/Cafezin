/*
Funções genéricas usadas por vários módulos.
*/

// Cria elementos sem innerHTML, para nunca interpretar texto digitado como HTML.
export function el(tag, classe, texto) {
    const no = document.createElement(tag);
    if (classe) no.className = classe;
    if (texto !== undefined) no.textContent = texto;
    return no;
}

export function icone(nome) {
    const i = el("i", "bi bi-" + nome);
    i.setAttribute("aria-hidden", "true");
    return i;
}

export function $(id) {
    return document.getElementById(id);
}

let temporizadorAviso;
export function avisar(mensagem) {
    const aviso = $("aviso");
    aviso.textContent = mensagem;
    aviso.classList.add("visivel");
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => aviso.classList.remove("visivel"), 2800);
}

export function estadoVazio(nomeIcone, titulo, texto, rotuloLink, href) {
    const li = el("li", "estadoVazio");
    li.appendChild(icone(nomeIcone));
    li.appendChild(el("strong", "", titulo));
    li.appendChild(el("span", "", texto));
    if (rotuloLink) {
        const a = el("a", "", rotuloLink);
        a.href = href;
        li.appendChild(a);
    }
    return li;
}
