const submit = document.getElementById('submitBttn');
submit.addEventListener('click', ()=>{
    let usuario = document.getElementById('inputEmail').value;
    let senha = document.getElementById('inputSenha').value;
    if(usuario=='' || senha=='')alert("adicione os dados ao formulario");
    else{
        getAnswer(usuario, senha)
    }
})