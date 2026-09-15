async function registrarUser(email,senha,nome,telefone){
    const response = await fetch('http://localhost:5000/register',{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify({
            "email":email,
            "senha":senha,
            "nome":nome,
            "tipo_usuario":"Comprador",
            "telefone":telefone
        })
    })

    return response
}

