
const user = {
    email:'',
    senha:'', 
    nome:'', 
    telefone:'',
    cpf:'',
    data_nasc:'',
    sexo:''
}


const form = document.getElementById('loginForm');
form.addEventListener('submit',(e)=>{
    e.preventDefault();
    if(conferirSenhasIguais()===true)cadastrar();
})


async function cadastrar(){
    const resp = await registrarUser(user.email,user.senha,user.nomeUser,user.telefone);
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

 const proxEtapa = document.getElementById('nextStep');
proxEtapa.addEventListener('click',()=>{
    let Femail = document.getElementById('email').value;
    let Fsenha = document.getElementById('password').value;
    let ConfSenha = document.getElementById('confirmPsswd').value;
    let FnomeUser = document.getElementById('nomeUser').value;
    let Ftelefone = document.getElementById('telefone').value;
    if(Ftelefone==='')Ftelefone=null;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(regex.test(Femail) && ConfSenha===Fsenha && Fsenha!='' && FnomeUser!=''){

        //confere se o usuário entrou com um email, os campos estão preenchidos e se a senha condiz
        //com a senha confirmada

        const sec1 = document.getElementById('primeiraSessao')
        const sec2 = document.getElementById('segundaSessao')
        sec2.style.display='grid';
        sec1.style.animation='disappearLeft 0.2s linear backwards'
        sec2.style.animation='aparecerDireita 0.2s linear backwards'
        setTimeout(()=>{
            sec1.style.display='none'
            sec2.style.position='relative'
        }, 200)
    }
    
}) 
//email
//password
//nomeUser
//tipo_usuario = comprador
//telefone
//confirmPsswd (conferir se está igual à password)