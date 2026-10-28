document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.listaLojasWraper').forEach((wrapper) => {
        const lista = wrapper.querySelector('.listaLojasOut');
        const esquerda = wrapper.querySelector('.setaLojasEsquerda');
        const direita = wrapper.querySelector('.setaLojasDireita');

        if (!lista || !esquerda || !direita) {
            console.error('Lista ou botões das cafeterias não encontrados:', wrapper);
            return;
        }

        // Liga/desliga os degradês conforme a posição do scroll
        const atualizarDegrades = () => {
            const margem = 2; // tolerância para arredondamentos de pixel
            const maxScroll = lista.scrollWidth - lista.clientWidth;

            wrapper.classList.toggle('temEsquerda', lista.scrollLeft > margem);
            wrapper.classList.toggle('temDireita', lista.scrollLeft < maxScroll - margem);
        };

        direita.addEventListener('click', () => {
            lista.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
        });

        esquerda.addEventListener('click', () => {
            lista.scrollBy({
                left: -300,
                behavior: 'smooth'
            });
        });

        // Atualiza durante o scroll (setas, trackpad ou dedo) e ao redimensionar
        lista.addEventListener('scroll', atualizarDegrades, { passive: true });
        window.addEventListener('resize', atualizarDegrades);

        // Estado inicial (e depois que as imagens carregarem e mudarem a largura)
        atualizarDegrades();
        window.addEventListener('load', atualizarDegrades);
    });
});
