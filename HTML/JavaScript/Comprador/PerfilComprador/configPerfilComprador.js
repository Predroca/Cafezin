/*
Configurações gerais e dados de exemplo do perfil do comprador.
Só constantes, sem funções. Os demais módulos importam daqui.
*/

export const CHAVES = {
    perfil: "cafezinPerfil",
    enderecos: "cafezinEnderecos",
    favoritas: "cafezinFavoritas",
    sessao: "cafezinSessao"
};

export const PAGINA_INICIAL_DESLOGADO = "index.html";
export const PAGINA_INICIAL_COMPRADOR = "indexComprador.html";

/* ---------- Dados de exemplo (substitua pelos dados reais do back-end) ---------- */
export const PERFIL_PADRAO = {
    nome: "Ana",
    email: "ana@email.com",
    telefone: "(34) 9 9999-9999",
    nascimento: "",
    foto: ""
};

export const ENDERECOS_PADRAO = [
    { id: 1, apelido: "Casa", rua: "Rua das Flores", numero: "120", bairro: "Centro", cidade: "Barbacena", principal: true }
];

export const FAVORITAS_PADRAO = [
    { id: 1, nome: "Boutique dos Pães", tipo: "Padaria · Cafeteria", sigla: "BP", nota: "4,9", cor: "" },
    { id: 2, nome: "Café Retiro", tipo: "Cafeteria artesanal", sigla: "CR", nota: "4,9", cor: "escura" },
    { id: 3, nome: "Café de OOO", tipo: "Cafeteria Temática", sigla: "CO", nota: "4,9", cor: "escura" }
];

export const PEDIDOS = [
    { codigo: "#1042", loja: "Empório do Café", itens: "Chocolate quente cremoso, Pão de queijo", data: "Hoje, 08:40", total: "R$ 27,50", status: "caminho" },
    { codigo: "#1031", loja: "Boutique dos Pães", itens: "Café coado, Croissant de queijo", data: "28 de setembro", total: "R$ 24,90", status: "entregue" },
    { codigo: "#1017", loja: "Grão & Cia", itens: "Cappuccino, Bolo de cenoura", data: "21 de setembro", total: "R$ 31,00", status: "entregue" },
    { codigo: "#1009", loja: "Café Retiro", itens: "Espresso duplo", data: "14 de setembro", total: "R$ 9,00", status: "cancelado" }
];

export const ROTULO_STATUS = { caminho: "A caminho", entregue: "Entregue", cancelado: "Cancelado" };
