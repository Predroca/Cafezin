const form = $("#esqueciSenhaForm")

form.on('submit',(e)=>{
    e.preventDefault();
    let email = $("#email").val()
    let senha = $("#password").val()
    if(email === '' || senha ===''){
        alert('preencha todos os campos corretamente')
    }
    else{
        sendRequestChangePsswd(email, senha)
    }
    
})

async function sendRequestChangePsswd(email, senha){
    const resposta = await fetch('http://localhost:5000/esqueci-senha',{
        method:'POST',
        headers:{
            'Content-Type':'application/json'
        },
        body:JSON.stringify({
            'email':email,
            'nova_senha': senha
        })
    })
    if(resposta.ok){
        alert('senha redefinida');
        window.location.href='login.html';
    }
    else{
        alert('Email não encontrado');
    }
}