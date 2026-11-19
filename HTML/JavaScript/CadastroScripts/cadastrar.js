const API_URL = 'http://localhost:5000';

// tipo: 'comprador' | 'loja' | 'entregador' (mesmo nome usado na rota /register/<tipo>)
async function registrarCadastro(tipo, dados) {
    const response = await fetch(`${API_URL}/register/${tipo}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dados)
    });

    return response;
}