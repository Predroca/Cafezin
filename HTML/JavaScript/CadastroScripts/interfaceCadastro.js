// interfaceCadastro.js
// -----------------------------------------------------------------
// Responsável apenas pela navegação "voltar" entre as etapas e pela
// sincronização do indicador visual de progresso (stepDot/stepLinha).
//
// O olho de senha e a validação visual de campos agora vêm de
// formsFunctionality.js (reaproveitados em qualquer formulário do
// site). O avanço da etapa 1 -> 2 e o envio ao servidor continuam
// 100% em enviarCadastro.js / cadastrar.js, sem nenhuma alteração
// feita por este arquivo.
// -----------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

    const dot1 = document.querySelector('.stepDot[data-step="1"]');
    const dot2 = document.querySelector('.stepDot[data-step="2"]');
    const linha = document.getElementById('stepLinha');
    const secao1 = document.getElementById('primeiraSessao');
    const secao2 = document.getElementById('segundaSessao');

    function irParaEtapa2(){
        if(dot1) { dot1.classList.remove('ativo'); dot1.classList.add('concluido'); }
        if(dot2) dot2.classList.add('ativo');
        if(linha) linha.classList.add('preenchida');
    }
    function irParaEtapa1(){
        if(dot1) { dot1.classList.add('ativo'); dot1.classList.remove('concluido'); }
        if(dot2) dot2.classList.remove('ativo');
        if(linha) linha.classList.remove('preenchida');
    }

    // enviarCadastro.js (não alterado) troca segundaSessao.style.display
    // ao validar a etapa 1. Aqui apenas observamos essa mudança para
    // manter o indicador de progresso em sincronia, sem duplicar
    // nenhuma regra de negócio.
    if(secao2){
        const observer = new MutationObserver(() => {
            const visivel = secao2.style.display && secao2.style.display !== 'none';
            if(visivel) irParaEtapa2();
        });
        observer.observe(secao2, { attributes: true, attributeFilter: ['style'] });
    }

    /* ---------- Botão voltar (etapa 2 -> etapa 1) ---------- */
    const botaoVoltar = document.getElementById('prevStep');
    if(botaoVoltar && secao1 && secao2){
        botaoVoltar.addEventListener('click', () => {
            secao2.style.animation = 'disappearRight 0.2s linear backwards';
            secao1.style.display = 'flex';
            secao1.style.animation = 'aparecerLado 0.2s linear backwards';
            irParaEtapa1();
            setTimeout(() => {
                secao2.style.display = 'none';
                secao1.style.position = 'static';
            }, 200);
        });
    }

});
