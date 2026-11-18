document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const secao1 = document.getElementById('primeiraSessao');
    const secao2 = document.getElementById('segundaSessao');
    const dot1 = document.querySelector('.stepDot[data-step="1"]');
    const dot2 = document.querySelector('.stepDot[data-step="2"]');
    const linha = document.getElementById('stepLinha');
    const duracao = 300;
    let transitando = false;

    function atualizarIndicador(etapa) {
        if (etapa === 2) {
            dot1?.classList.remove('ativo');
            dot1?.classList.add('concluido');
            dot2?.classList.add('ativo');
            linha?.classList.add('preenchida');
        } else {
            dot1?.classList.add('ativo');
            dot1?.classList.remove('concluido');
            dot2?.classList.remove('ativo');
            linha?.classList.remove('preenchida');
        }
    }

    window.transicionarCadastro = function (indoParaSegundaEtapa) {
        if (transitando || !form || !secao1 || !secao2) return;
        transitando = true;
        const saindo = indoParaSegundaEtapa ? secao1 : secao2;
        const entrando = indoParaSegundaEtapa ? secao2 : secao1;
        const classeSaida = indoParaSegundaEtapa ? 'saindoEsquerda' : 'saindoDireita';
        const classeEntrada = indoParaSegundaEtapa ? 'entrandoDireita' : 'entrandoEsquerda';
        const alturaAtual = form.offsetHeight;
        const topo = saindo.offsetTop;
        const esquerda = saindo.offsetLeft;
        const largura = saindo.offsetWidth;

        entrando.style.display = indoParaSegundaEtapa ? 'grid' : 'flex';
        entrando.style.visibility = 'hidden';
        const alturaNova = entrando.offsetHeight;
        entrando.style.visibility = '';
        entrando.style.setProperty('--etapa-topo', `${topo}px`);
        entrando.style.setProperty('--etapa-esquerda', `${esquerda}px`);
        entrando.style.setProperty('--etapa-largura', `${largura}px`);
        saindo.style.setProperty('--etapa-topo', `${topo}px`);
        saindo.style.setProperty('--etapa-esquerda', `${esquerda}px`);
        saindo.style.setProperty('--etapa-largura', `${largura}px`);
        saindo.classList.add('etapaEmTransicao', classeSaida);
        entrando.classList.add('etapaEmTransicao', classeEntrada);
        form.style.height = `${alturaAtual}px`;
        form.getBoundingClientRect();
        form.style.height = `${alturaAtual + alturaNova - saindo.offsetHeight}px`;
        saindo.inert = true;
        entrando.inert = false;
        atualizarIndicador(indoParaSegundaEtapa ? 2 : 1);

        window.setTimeout(() => {
            saindo.style.display = 'none';
            [saindo, entrando].forEach((etapa) => {
                etapa.classList.remove('etapaEmTransicao', classeSaida, classeEntrada);
                etapa.style.removeProperty('--etapa-topo');
                etapa.style.removeProperty('--etapa-esquerda');
                etapa.style.removeProperty('--etapa-largura');
            });
            entrando.style.height = '';
            form.style.height = '';
            saindo.inert = true;
            entrando.inert = false;
            transitando = false;
        }, duracao);
    };

    secao2.inert = true;
    document.getElementById('prevStep')?.addEventListener('click', () => window.transicionarCadastro(false));
});
