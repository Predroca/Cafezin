
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.listaLojasWraper').forEach((wrapper) => {
        const lista = wrapper.querySelector('.listaLojasOut');
        const esquerda = wrapper.querySelector('.setaLojasEsquerda');
        const direita = wrapper.querySelector('.setaLojasDireita');

        if (!lista || !esquerda || !direita) {
            console.error('Lista ou botões das cafeterias não encontrados:', wrapper);
            return;
        }

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
    });
});
