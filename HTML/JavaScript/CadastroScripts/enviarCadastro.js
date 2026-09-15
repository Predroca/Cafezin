const form = document.getElementById('loginForm');
form.addEventListener('submit',(e)=>{
    e.preventDefault();
    if(conferirSenhasIguais()===true)cadastrar();
})


async function cadastrar(){
    let email = document.getElementById('email').value;
    let senha = document.getElementById('password').value;
    let nomeUser = document.getElementById('nomeUser').value;
    let telefone = document.getElementById('telefone').value;
    if(telefone==='')telefone=null;

    const resp = await registrarUser(email,senha,nomeUser,telefone);
    if(!resp.ok){
        let er = document.getElementById('errorLogin');
        er.style.display='flex';
        psswdInput.value=''

        setTimeout(()=>{
            er.style.display='none';
        }, 3800)
        
    }
    else{
        alert('deu certo')
    }
}
//email
//password
//nomeUser
//tipo_usuario = comprador
//telefone
//confirmPsswd (conferir se está igual à password)