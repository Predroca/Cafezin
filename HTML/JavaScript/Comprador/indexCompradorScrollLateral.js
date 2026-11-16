document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.listaLojasWraper').forEach((wrapper) => {
        const lista = wrapper.querySelector('.listaLojasOut');
        const esquerda = wrapper.querySelector('.setaLojasEsquerda');
        const direita = wrapper.querySelector('.setaLojasDireita');

        if (!lista || !esquerda || !direita) {
            console.error('Lista ou botões do carrossel não encontrados:', wrapper);
            return;
        }


        const atualizarDegrades = () => {
            const margem = 2;
            const maxScroll = lista.scrollWidth - lista.clientWidth;

            wrapper.classList.toggle(
                'temEsquerda',
                lista.scrollLeft > margem
            );

            wrapper.classList.toggle(
                'temDireita',
                lista.scrollLeft < maxScroll - margem
            );
        };


        esquerda.addEventListener('click', (evento) => {
            evento.preventDefault();

            lista.scrollBy({
                left: -300,
                behavior: 'smooth'
            });
        });


        direita.addEventListener('click', (evento) => {
            evento.preventDefault();

            lista.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
        });

        lista.addEventListener('scroll', atualizarDegrades, {
            passive: true
        });

        window.addEventListener('resize', atualizarDegrades);
        window.addEventListener('load', atualizarDegrades);

        atualizarDegrades();
    });
});
