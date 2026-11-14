const URL_CADASTRO = {
    comprador: "http://localhost:5000/register/comprador",
    loja: "http://localhost:5000/register/loja",
    entregador: "http://localhost:5000/register/entregador"
};

const TIPOS_PAGAMENTO = {
    pix: "PIX",
    transferencia: "Transferência",
    dinheiro: "Dinheiro"
};

function montarPayloadCadastro(dados) {
    const usuario = {
        email: dados.email,
        senha: dados.senha,
        nome: dados.nome,
        telefone: dados.telefone
    };

    if (dados.tipo === "comprador") {
        return {
            ...usuario,
            cpf: dados.cpf,
            data_nasc: dados.dataNascimento,
            sexo: dados.sexo
        };
    }

    if (dados.tipo === "loja") {
        return {
            ...usuario,
            cnpj: dados.cnpj,
            horario_abertura: dados.horarioAbertura,
            horario_fecha: dados.horarioFechamento,
            endereco: {
                nome_logradouro: dados.rua,
                numero: dados.numero,
                bairro: dados.bairro,
                cidade: dados.cidade,
                estado: dados.estado,
                cep: dados.cep
            }
        };
    }

    if (dados.tipo === "entregador") {
        return {
            ...usuario,
            cpf: dados.cpf,
            data_nasc: dados.dataNascimento,
            cnh: dados.cnh,
            pagamento: { tipo: TIPOS_PAGAMENTO[dados.tipoPagamento] }
        };
    }

    throw new Error("Tipo de cadastro inválido.");
}

async function cadastrarUsuario(dados) {
    const resposta = await fetch(URL_CADASTRO[dados.tipo], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(montarPayloadCadastro(dados))
    });
    const retorno = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
        const erro = new Error(retorno.error || retorno.erro || "Não foi possível concluir o cadastro.");
        erro.status = resposta.status;
        throw erro;
    }

    return retorno;
}
