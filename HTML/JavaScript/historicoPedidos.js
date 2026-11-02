const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function formatarReal(valor) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// "2026-11-04" -> { ano: 2026, mes: 'Novembro', dia: 4 }
// (feito com split para evitar problemas de fuso horário do new Date)
function lerData(str) {
  const [ano, mes, dia] = str.split('-').map(Number);
  return { ano, mes: MESES[mes - 1], dia };
}

// Procura o container do dia: mesmo dia da semana + dia + mês + ano
function acharContainer(diaSemana, data) {
  return $('#HistoricoDePedidos .containerPedidosDia').filter(function () {
    const $c = $(this);
    const spans = $c.find('.cabecalhoSecao p span'); // [0]=dia, [1]=mês, [2]=ano

    return (
      $c.find('.cabecalhoSecao h2').text().trim() === diaSemana &&
      Number(spans.eq(0).text()) === data.dia &&
      spans.eq(1).text().trim() === data.mes &&
      Number(spans.eq(2).text()) === data.ano
    );
  }).first();
}

// Cria um container novo caso ainda não exista o dia
function criarContainer(diaSemana, data) {
  const $container = $(`
    <div class="containerPedidosDia">
      <div class="cabecalhoSecao linha">
        <div>
          <h2></h2>
          <p><span></span> de <span></span> , <span></span></p>
        </div>
        <a class="linkSecao" href="historicoPedidos.html">
          Ver todos <i class="bi bi-arrow-right"></i>
        </a>
      </div>
      <div class="listaPedidos"></div>
    </div>
  `);

  $container.find('h2').text(diaSemana);
  const spans = $container.find('p span');
  spans.eq(0).text(String(data.dia).padStart(2, '0'));
  spans.eq(1).text(data.mes);
  spans.eq(2).text(data.ano);

  $('#HistoricoDePedidos').append($container);
  return $container;
}

// Monta o <article> de um pedido (usa .text() para evitar injeção de HTML)
function criarArticle(pedido) {
  const status = pedido.status || 'novo';
  const horario = pedido.hora ? `${pedido.dia_semana}, ${pedido.hora}` : pedido.dia_semana;
  const titulo = pedido.numero ? `Pedido #${pedido.numero} · ${pedido.nome}` : `Pedido · ${pedido.nome}`;

  const $article = $(`
    <article class="pedido">
      <div class="pedidoCabecalho">
        <time class="diaHoraEntrega"></time>
      </div>
      <h3></h3>
      <p></p>
      <div class="pedidoRodape"><strong></strong></div>
    </article>
  `).addClass(status);

  $article.find('time').text(horario);
  $article.find('h3').text(titulo);
  $article.find('p').text(pedido.produtos.join(' · '));
  $article.find('strong').text(formatarReal(pedido.valor));

  return $article;
}

// Função principal: recebe o JSON (array) e insere nos containers
function inserirPedidos(pedidos) {
  pedidos.forEach(function (pedido) {
    const data = lerData(pedido.data);

    let $container = acharContainer(pedido.dia_semana, data);
    if ($container.length === 0) {
      $container = criarContainer(pedido.dia_semana, data);
    }

    $container.find('.listaPedidos').append(criarArticle(pedido));
  });
}

// Busca o JSON do backend Python
$(function () {
  $.getJSON('/api/pedidos')
    .done(inserirPedidos)
    .fail(function () {
      console.error('Não foi possível carregar os pedidos.');
    });
});