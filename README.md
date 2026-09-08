# Cafezin

# Cafezin — Catálogo de Produtos (estilo iFood)

Backend em **Flask + SQLAlchemy** (ORM) que lê e grava no banco MySQL `Cafezin`
(schema que você já criou). Os modelos em `models.py` mapeiam as tabelas
existentes — não é feita nenhuma migração, o SQLAlchemy só "enxerga" as
tabelas que já estão no banco.

- `/` — catálogo de produtos em grid, com chips de filtro por categoria (Café, Pão, Doces...)
- `/produto/<cod_produto>` — página estilizada do produto, com nome, preço, loja e botão de compra
- `/comprar/<cod_produto>` (GET) — página de checkout: escolher comprador + endereço de entrega, forma de pagamento e quantidade
- `/comprar/<cod_produto>` (POST) — **registra o pedido de verdade no banco**: cria um `Pagamento`, um `Pedido` e o `ItemPedido` correspondente
- `/pedido/<cod_pedido>` — página de confirmação com os dados do pedido já gravado

## 1. Instalar dependências

```bash
pip install -r requirements.txt
```

## 2. Configurar a conexão com o banco

A configuração fica em `config.py`, montada a partir de variáveis de ambiente
(com valores padrão para `localhost`/`root`). Ajuste conforme o seu MySQL:

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=sua_senha
export DB_NAME=Cafezin
```

No Windows (PowerShell):

```powershell
$env:DB_HOST="localhost"
$env:DB_USER="root"
$env:DB_PASSWORD="sua_senha"
$env:DB_NAME="Cafezin"
```

Se preferir, você também pode simplesmente editar os valores padrão direto em
`config.py` (nas linhas `os.environ.get("DB_HOST", "localhost")` etc.).

> Certifique-se de já ter rodado o script SQL que você enviou (criação das
> tabelas + inserts) no seu servidor MySQL antes de iniciar o app.

## 3. Rodar o servidor

```bash
python app.py
```

Acesse em: **http://localhost:5000**

## Estrutura do projeto

```
cafezin_backend/
├── app.py                   # rotas Flask (usando o ORM, sem SQL cru)
├── config.py                # configuração / URI de conexão do SQLAlchemy
├── extensions.py            # instância única do SQLAlchemy (db)
├── models.py                # modelos ORM mapeando todas as tabelas do schema
├── requirements.txt
├── templates/
│   ├── base.html             # header, flash messages, footer
│   ├── catalogo.html         # grid de produtos + filtro de categoria
│   ├── produto.html          # página do produto com botão de compra
│   ├── checkout.html         # escolha de comprador/endereço/pagamento/qtd
│   ├── pedido_confirmacao.html  # confirmação com os dados do pedido gravado
│   └── erro.html             # página de erro / não encontrado
└── static/
    └── css/style.css         # visual inspirado no iFood
```

## Como funciona por baixo dos panos

- **ORM em vez de SQL cru**: cada tabela do schema virou uma classe em
  `models.py` (`Produto`, `Loja`, `Usuario`, `Pedido`, etc.), com os
  relacionamentos entre elas (`db.relationship`) já declarados. Em vez de
  escrever `JOIN`s manualmente, o código usa `produto.loja.usuario.nome`,
  `pedido.itens`, `comprador.enderecos`, etc.
- Só aparecem no catálogo produtos com `disponibilidade = True`
  (`Produto.query.filter(Produto.disponibilidade.is_(True))`).
- O botão "Comprar agora" leva para `/comprar/<id>` (checkout), onde você
  escolhe **qual comprador está fazendo o pedido** e **qual dos endereços
  cadastrados dele** (via `Comprador_Endereco`) vai receber a entrega — como o
  projeto não tem login, essa tela substitui a sessão de usuário.
- Ao confirmar, o back-end cria os objetos `Pagamento` → `Pedido` → `ItemPedido`
  na sessão do SQLAlchemy (`db.session.add(...)`), usando `db.session.flush()`
  entre eles para já ter o ID gerado (ex: `pagamento.cod_pagamento`) sem
  precisar de três `commit`s separados. Só existe **um** `db.session.commit()`
  no final — se algo falhar no meio do caminho, nada é gravado (rollback
  automático via `@app.errorhandler(SQLAlchemyError)`).
- O `valor_total` é calculado como `preço × quantidade + taxa de entrega fixa
  (R$ 5,00)`.
- Depois disso você é redirecionado para `/pedido/<cod_pedido>`, que busca o
  pedido gravado (`Pedido.query.get_or_404(...)`) e navega pelos
  relacionamentos para montar a página.

## Próximos passos (se quiser evoluir)

- Adicionar sistema de login (usando o modelo `Usuario`) para não precisar
  escolher o comprador manualmente a cada compra.
- Usar Flask-Migrate (Alembic) se no futuro você quiser alterar o schema pelo
  próprio código Python em vez de SQL manual.
- Trocar o placeholder colorido por imagens reais dos produtos (ex: coluna
  `imagem_url` no modelo `Produto`).
- Permitir cadastrar um novo endereço direto na tela de checkout.
****
