(() => {
  const params = new URLSearchParams(window.location.search);

  const termo = (params.get('q') || '').trim();
  const tab = params.get('tab') === '1' ? '1' : '0';

  document.getElementById('termoPesquisa').textContent = termo;
  document.getElementById('busca').value = termo;
  document.title = `Cafézin | Pesquisa por ${termo}`;

  // Navegação entre as abas
  const abas = [...document.querySelectorAll('.abaPesquisa')];
  const lojas = document.getElementById('filtrosLojas');
  const itens = document.getElementById('filtrosItens');
  const painel = document.getElementById('painelPesquisa');

  abas.forEach(aba => {
    const abaTab = aba.dataset.tipo === 'Itens' ? '1' : '0';
    const ativa = abaTab === tab;

    aba.classList.toggle('ativa', ativa);
    aba.setAttribute('aria-selected', String(ativa));

    aba.addEventListener('click', () => {
      const novaUrl = new URL(window.location.href);

      novaUrl.searchParams.set('tab', abaTab);

      window.location.href = novaUrl.href;
    });
  });


  lojas.hidden = tab === '1';
  itens.hidden = tab !== '1';

  painel.setAttribute(
    'aria-labelledby',
    tab === '1' ? 'abaItens' : 'abaLojas'
  );


  document.querySelectorAll('.filtrosPesquisa').forEach(grupo => {
    grupo.querySelectorAll(
      '.filtroPesquisa:not(.filtroLimpar)'
    ).forEach(botao => {
      botao.addEventListener('click', () => {
        const ativo =
          botao.getAttribute('aria-pressed') === 'true';

        botao.setAttribute('aria-pressed', String(!ativo));
        botao.classList.toggle('selecionado', !ativo);
      });
    });

   
    const botaoLimpar = grupo.querySelector('.filtroLimpar');

    if (botaoLimpar) {
      botaoLimpar.addEventListener('click', () => {
        grupo.querySelectorAll('.filtroPesquisa').forEach(botao => {
          botao.setAttribute('aria-pressed', 'false');
          botao.classList.remove('selecionado');
        });
      });
    }
  });


  const formulario = document.getElementById('formBusca');

  if (formulario) {
    formulario.addEventListener('submit', () => {
      let campoTab = formulario.querySelector('input[name="tab"]');

      if (!campoTab) {
        campoTab = document.createElement('input');
        campoTab.type = 'hidden';
        campoTab.name = 'tab';
        formulario.appendChild(campoTab);
      }

      campoTab.value = tab;
    });
  }
})();