CREATE DATABASE Cafezin;
USE Cafezin;

CREATE TABLE Usuario (
    cod_usuario INT PRIMARY KEY auto_increment,
    email VARCHAR(100) NOT NULL,
    senha VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo_usuario VARCHAR(30) NOT NULL,
    telefone VARCHAR(20)
);

CREATE TABLE Comprador (
    cod_comprador INT PRIMARY KEY auto_increment,
    cpf CHAR(11) NOT NULL,
    data_nasc DATE,
    sexo CHAR(1),
    cod_usuario INT NOT NULL,

    FOREIGN KEY (cod_usuario)
        REFERENCES Usuario(cod_usuario)
);

CREATE TABLE Endereco (
    cod_endereco INT PRIMARY KEY auto_increment,
    nome_logradouro VARCHAR(100) NOT NULL,
    numero VARCHAR(10),
    bairro VARCHAR(50),
    cidade VARCHAR(50),
    estado CHAR(2),
    cep CHAR(8)
);

CREATE TABLE Comprador_Endereco (
    cod_comp_end INT PRIMARY KEY auto_increment,
    cod_comprador INT NOT NULL,
    cod_endereco INT NOT NULL,

    FOREIGN KEY (cod_comprador)
        REFERENCES Comprador(cod_comprador),

    FOREIGN KEY (cod_endereco)
        REFERENCES Endereco(cod_endereco)
);

CREATE TABLE Pagamento(
	cod_pagamento INT PRIMARY KEY auto_increment,
    tipo enum ('PIX','Boleto','Cartão','Dinheiro','Transferência'),
    data datetime
);


CREATE TABLE Entregador (
    cod_entregador INT PRIMARY KEY auto_increment,
    cpf CHAR(11) NOT NULL,
    data_nasc DATE,
    cnh VARCHAR(20),
    cod_pagamento INT NOT NULL,
    cod_usuario INT NOT NULL,

    FOREIGN KEY (cod_usuario)
        REFERENCES Usuario(cod_usuario),

	FOREIGN KEY (cod_pagamento)
        REFERENCES Pagamento(cod_pagamento)
);

CREATE TABLE Categoria (
	cod_categoria INT PRIMARY KEY auto_increment,
    nome_categoria VARCHAR(255)
);

CREATE TABLE Loja (
    cod_loja INT PRIMARY KEY auto_increment,
    cnpj CHAR(14) NOT NULL,
    horario_funcionamento time,
    cod_endereco INT NOT NULL,
    cod_usuario INT NOT NULL,

    FOREIGN KEY (cod_endereco)
        REFERENCES Endereco(cod_endereco),

    FOREIGN KEY (cod_usuario)
        REFERENCES Usuario(cod_usuario)
);

CREATE TABLE Pedido (
    cod_pedido INT PRIMARY KEY auto_increment,
    data_pedido DATETIME NOT NULL,

    valor_frete DECIMAL(10,2),
    valor_total DECIMAL(10,2),
	status varchar(50),
    cod_comprador INT NOT NULL,
    cod_loja INT NOT NULL,
    cod_end_entrega INT NOT NULL,
    cod_pagamento INT NOT NULL,

    FOREIGN KEY (cod_comprador)
        REFERENCES Comprador(cod_comprador),

    FOREIGN KEY (cod_loja)
        REFERENCES Loja(cod_loja),

    FOREIGN KEY (cod_end_entrega)
        REFERENCES Endereco(cod_endereco),

	FOREIGN KEY (cod_pagamento)
        REFERENCES Pagamento(cod_pagamento)
);

CREATE TABLE Produto (
    cod_produto INT PRIMARY KEY auto_increment,
    cod_loja INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    disponibilidade BOOLEAN,
	cod_categoria INT NULL,

    FOREIGN KEY (cod_loja)
        REFERENCES Loja(cod_loja),

	FOREIGN KEY (cod_categoria)
        REFERENCES Categoria(cod_categoria)
);

CREATE TABLE ItemPedido (
    cod_item INT PRIMARY KEY auto_increment,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL,

    cod_pedido INT NOT NULL,
    cod_produto INT NOT NULL,

    FOREIGN KEY (cod_pedido)
        REFERENCES Pedido(cod_pedido),

    FOREIGN KEY (cod_produto)
        REFERENCES Produto(cod_produto)
);

CREATE TABLE Entrega (
    cod_entrega INT PRIMARY KEY auto_increment,
    distancia DECIMAL(10,2),
    data_saida DATETIME,
    data_entrega DATETIME,
    status VARCHAR(30),

    cod_pedido INT NOT NULL,
    cod_entregador INT NOT NULL,

    FOREIGN KEY (cod_pedido)
        REFERENCES Pedido(cod_pedido),

    FOREIGN KEY (cod_entregador)
        REFERENCES Entregador(cod_entregador)
);

CREATE TABLE AvaliacaoEntregador (
    cod_avaliacao_entregador INT PRIMARY KEY auto_increment,
    data DATE,
    descricao TEXT,
    nota INT,
    horario TIME,

    cod_pedido INT NOT NULL,

    FOREIGN KEY (cod_pedido)
        REFERENCES Pedido(cod_pedido)
);

CREATE TABLE AvaliacaoLoja (
    cod_avaliacao_loja INT PRIMARY KEY auto_increment,
    data DATE,
    descricao TEXT,
    nota INT,
    horario TIME,

    cod_pedido INT NOT NULL,

    FOREIGN KEY (cod_pedido)
        REFERENCES Pedido(cod_pedido)
);

CREATE TABLE AvaliacaoProduto (
    cod_avaliacao_produto INT PRIMARY KEY auto_increment,
    data DATE,
    descricao TEXT,
    nota INT,
    horario TIME,

    cod_produto INT NOT NULL,
    cod_comprador INT NOT NULL,

    FOREIGN KEY (cod_produto)
        REFERENCES Produto(cod_produto),

    FOREIGN KEY (cod_comprador)
        REFERENCES Comprador(cod_comprador)
);


-- =========================================================
-- USUARIO
-- (1-5: compradores | 6-8: entregadores | 9-11: donos de loja)
-- =========================================================
INSERT INTO Usuario (email, senha, nome, tipo_usuario, telefone) VALUES
('joao.silva@email.com', 'senha123', 'João Silva', 'Comprador', '32991027384'),
('maria.souza@email.com', 'senha123', 'Maria Souza', 'Comprador', '32992348821'),
('carlos.lima@email.com', 'senha123', 'Carlos Lima', 'Comprador', '32993451167'),
('ana.pereira@email.com', 'senha123', 'Ana Pereira', 'Comprador', '32994567290'),
('pedro.santos@email.com', 'senha123', 'Pedro Santos', 'Comprador', '32995673345'),
('lucas.oliveira@email.com', 'senha123', 'Lucas Oliveira', 'Entregador', '32988112234'),
('fernanda.costa@email.com', 'senha123', 'Fernanda Costa', 'Entregador', '32987229981'),
('rafael.almeida@email.com', 'senha123', 'Rafael Almeida', 'Entregador', '32986334456'),
('contato@cafeteriadorenata.com', 'senha123', 'Cafeteria da Renata', 'Loja', '32337122885'),
('contato@padariabomgosto.com', 'senha123', 'Padaria Bom Gosto', 'Loja', '32337255410'),
('contato@docedecasa.com', 'senha123', 'Doce de Casa', 'Loja', '32337390877');

-- =========================================================
-- ENDERECO
-- =========================================================
INSERT INTO Endereco (nome_logradouro, numero, bairro, cidade, estado, cep) VALUES
('Rua das Flores', '120', 'Centro', 'São João del Rei', 'MG', '36300000'),
('Avenida Brasil', '450', 'Fábricas', 'São João del Rei', 'MG', '36301000'),
('Rua Getúlio Vargas', '78', 'São Dimas', 'São João del Rei', 'MG', '36302000'),
('Rua XV de Novembro', '33', 'Centro', 'São João del Rei', 'MG', '36303000'),
('Rua Padre José Maria Xavier', '210', 'Colônia do Marçal', 'São João del Rei', 'MG', '36304000'),
('Avenida Presidente Tancredo Neves', '900', 'Vila Belo Horizonte', 'São João del Rei', 'MG', '36305000'),
('Rua Santo Antônio', '15', 'Matosinhos', 'São João del Rei', 'MG', '36306000'),
('Rua Tiradentes', '502', 'Centro', 'São João del Rei', 'MG', '36307000');

-- =========================================================
-- PAGAMENTO
-- =========================================================
INSERT INTO Pagamento (tipo, data) VALUES
('PIX', '2025-01-10 09:15:00'),
('Cartão', '2025-01-11 12:30:00'),
('Dinheiro', '2025-01-12 18:45:00'),
('Boleto', '2025-01-13 08:00:00'),
('Transferência', '2025-01-14 14:20:00'),
('PIX', '2025-01-15 19:05:00');

-- =========================================================
-- CATEGORIA
-- =========================================================
INSERT INTO Categoria (nome_categoria) VALUES
('Cafe'),
('Pao'),
('Doces');

-- =========================================================
-- COMPRADOR (cod_usuario 1 a 5)
-- =========================================================
INSERT INTO Comprador (cpf, data_nasc, sexo, cod_usuario) VALUES
('05827194633', '1995-03-14', 'M', 1),
('14926837051', '1998-07-22', 'F', 2),
('23847561092', '1990-11-05', 'M', 3),
('36758291047', '2000-01-30', 'F', 4),
('47869102358', '1988-09-18', 'M', 5);

-- =========================================================
-- COMPRADOR_ENDERECO
-- =========================================================
INSERT INTO Comprador_Endereco (cod_comprador, cod_endereco) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5);

-- =========================================================
-- ENTREGADOR (cod_usuario 6 a 8 | cod_pagamento 1 a 3)
-- =========================================================
INSERT INTO Entregador (cpf, data_nasc, cnh, cod_pagamento, cod_usuario) VALUES
('58970213467', '1993-05-20', '38452167900', 1, 6),
('69081324578', '1996-08-11', '47563289011', 2, 7),
('70192435689', '1991-12-02', '56674390122', 3, 8);

-- =========================================================
-- LOJA (cod_usuario 9 a 11 | endereços 6 a 8)
-- =========================================================
INSERT INTO Loja (cnpj, horario_funcionamento, cod_endereco, cod_usuario) VALUES
('08765432000156', '07:00:00', 6, 9),
('19876543000167', '06:30:00', 7, 10),
('27654398000178', '10:00:00', 8, 11);

-- =========================================================
-- PRODUTO
-- Loja 1 = Cafeteria da Renata | Loja 2 = Padaria Bom Gosto | Loja 3 = Doce de Casa
-- =========================================================
INSERT INTO Produto (cod_loja, nome, descricao, preco, disponibilidade, cod_categoria) VALUES
(1, 'Café Expresso', 'Café expresso tradicional', 6.50, TRUE, 1),
(1, 'Cappuccino', 'Cappuccino cremoso com canela', 9.00, TRUE, 1),
(1, 'Café com Leite', 'Café com leite quente', 7.00, TRUE, 1),
(1, 'Torta de Limão', 'Fatia de torta de limão', 8.50, FALSE, 3),
(2, 'Pão Francês', 'Pão francês fresquinho, unidade', 0.80, TRUE, 2),
(2, 'Pão de Queijo', 'Pão de queijo mineiro tradicional', 3.50, TRUE, 2),
(2, 'Croissant', 'Croissant amanteigado', 6.00, TRUE, 2),
(3, 'Brigadeiro', 'Brigadeiro gourmet, unidade', 2.50, TRUE, 3),
(3, 'Bolo de Chocolate', 'Fatia de bolo de chocolate', 8.00, TRUE, 3),
(3, 'Pudim', 'Pudim de leite condensado', 7.50, TRUE, 3);

-- =========================================================
-- PEDIDO
-- valor_total = soma dos itens + valor_frete (conferido item a item)
-- =========================================================
INSERT INTO Pedido (data_pedido, valor_frete, valor_total, status, cod_comprador, cod_loja, cod_end_entrega, cod_pagamento) VALUES
('2025-01-10 09:10:00', 5.00, 27.00, 'Entregue', 1, 1, 1, 1),
('2025-01-11 12:25:00', 6.00, 21.40, 'Entregue', 2, 2, 2, 2),
('2025-01-12 18:40:00', 4.50, 9.50, 'Entregue', 3, 3, 3, 3),
('2025-01-13 07:55:00', 7.00, 22.50, 'Em andamento', 4, 3, 4, 4),
('2025-01-14 14:15:00', 5.50, 12.50, 'Cancelado', 5, 1, 5, 5),
('2025-01-15 19:00:00', 4.00, 19.00, 'Entregue', 1, 3, 1, 6);

-- =========================================================
-- ITEMPEDIDO
-- (produtos sempre da mesma loja do respectivo pedido)
-- =========================================================
INSERT INTO ItemPedido (quantidade, preco_unitario, cod_pedido, cod_produto) VALUES
(2, 6.50, 1, 1),
(1, 9.00, 1, 2),
(3, 0.80, 2, 5),
(2, 3.50, 2, 6),
(1, 6.00, 2, 7),
(2, 2.50, 3, 8),
(1, 8.00, 4, 9),
(1, 7.50, 4, 10),
(1, 7.00, 5, 3),
(2, 7.50, 6, 10);

-- =========================================================
-- ENTREGA
-- =========================================================
INSERT INTO Entrega (distancia, data_saida, data_entrega, status, cod_pedido, cod_entregador) VALUES
(3.2, '2025-01-10 09:20:00', '2025-01-10 09:45:00', 'Concluída', 1, 1),
(5.0, '2025-01-11 12:35:00', '2025-01-11 13:05:00', 'Concluída', 2, 2),
(2.1, '2025-01-12 18:50:00', '2025-01-12 19:10:00', 'Concluída', 3, 3),
(4.4, '2025-01-13 08:05:00', NULL, 'Em rota', 4, 1);

-- =========================================================
-- AVALIACAOENTREGADOR
-- =========================================================
INSERT INTO AvaliacaoEntregador (data, descricao, nota, horario, cod_pedido) VALUES
('2025-01-10', 'Entregador muito rápido e educado', 5, '09:50:00', 1),
('2025-01-11', 'Entrega dentro do prazo', 4, '13:10:00', 2),
('2025-01-12', 'Um pouco atrasado, mas produto intacto', 3, '19:15:00', 3);

-- =========================================================
-- AVALIACAOLOJA
-- =========================================================
INSERT INTO AvaliacaoLoja (data, descricao, nota, horario, cod_pedido) VALUES
('2025-01-10', 'Ótimo atendimento e café delicioso', 5, '10:00:00', 1),
('2025-01-11', 'Padaria muito boa, recomendo', 5, '13:20:00', 2),
('2025-01-12', 'Doces bons, mas demorou um pouco', 4, '19:25:00', 3);

-- =========================================================
-- AVALIACAOPRODUTO
-- =========================================================
INSERT INTO AvaliacaoProduto (data, descricao, nota, horario, cod_produto, cod_comprador) VALUES
('2025-01-10', 'Café bem encorpado, gostei muito', 5, '10:05:00', 1, 1),
('2025-01-11', 'Pão de queijo fresquinho e saboroso', 5, '13:25:00', 6, 2),
('2025-01-12', 'Brigadeiro muito doce para o meu gosto', 3, '19:30:00', 8, 3),
('2025-01-13', 'Bolo de chocolate úmido, ficou ótimo', 4, '11:00:00', 9, 4);


-- =============================================================================================
-- 													4										  --
-- Gerar um relatório dos comentários das avaliações de um produto com a nota maior ou igual a 3
-- =============================================================================================

SELECT descricao
FROM AvaliacaoProduto
WHERE nota>= 3;

-- =========================================================================================
-- 											5 											  --
-- Gerar um relatório de todos os compradores que tiveram o status da entrega como 'Em rota'
-- =========================================================================================

select c.*
FROM comprador c, entrega e, pedido p
where p.cod_comprador = c.cod_comprador AND p.cod_pedido = e.cod_pedido AND e.status='Em rota';

-- =================================================================================
-- 											6									  --
-- Gerar um relatório do valor total gasto por cada comprador do sistema em produtos 
-- =================================================================================

SELECT u.nome, sum(p.valor_total) gastoTotal
FROM usuario u, pedido p, comprador c
WHERE u.cod_usuario = c.cod_usuario AND c.cod_comprador = p.cod_comprador
GROUP BY 1;

-- =================================================================================================
-- 											2
--  selecionar o nome do comprador e a quantidade de produtos dos top 5 que mais gastaram no sistema
-- 									GUILHERME ALVES LOBIANCO
-- =================================================================================================

create view topCompradores(nome, valorGasto) as 
select u.nome, sum(p.valor_total+p.valor_frete) valorGasto
from usuario u join comprador c on c.cod_usuario = u.cod_usuario join pedido p on p.cod_comprador = c.cod_comprador
group by u.nome
order by valorGasto desc
limit 5;



 -- drop view topCompradores;
select * from topCompradores;

-- ===========================================================================
-- 									3
--  O usuário João percebeu que inseriu o nome errado, então decidiu trocá-lo
-- 						GUILHERME ALVES LOBIANCO
-- ===========================================================================

update topCompradores
set nome = "João Silva Pereira Costa"
where nome = 'João Silva';

