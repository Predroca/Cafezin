/*
Persistência: único lugar que fala com o localStorage.
Quando a API existir, troque ler() e salvar() por chamadas fetch.
*/

export function ler(chave, padrao) {
    try {
        const bruto = localStorage.getItem(chave);
        return bruto ? JSON.parse(bruto) : padrao;
    } catch (e) {
        return padrao;
    }
}

export function salvar(chave, valor) {
    try {
        localStorage.setItem(chave, JSON.stringify(valor));
        return true;
    } catch (e) {
        return false;
    }
}
