async function sendDados(user, senha){
    const response = await fetch("http://localhost:5000/login",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body: JSON.stringify({
            "email": user,
            "senha": senha
        })

    })

    return response;
}

async function getAnswer(usuario, senha) {
    
    const resposta = await sendDados(usuario, senha);
    const dados = await resposta.json();
    if(dados.menssage=="bem vindo"){
        alert(`${dados.menssage}`);
    }
    else{
        alert("vc nao existe")
    }
}
