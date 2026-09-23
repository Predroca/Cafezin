CREATE DATABASE Cafezin;
USE Cafezin;

CREATE TABLE Usuario (
    cod_usuario INT PRIMARY KEY auto_increment,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    nome VARCHAR(100) NOT NULL,
    tipo_usuario ENUM('Admin','Comprador','Loja','Entregador') NOT NULL,
    telefone VARCHAR(20),
    foto_url VARCHAR(255)
);

CREATE TABLE Comprador (
    cod_comprador INT PRIMARY KEY auto_increment,
    cpf CHAR(11) NOT NULL,
    data_nasc DATE,
    sexo CHAR(1) CHECK (sexo in ('M', 'F')),
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
    tipo ENUM('PIX','Boleto','Cartão','Dinheiro','Transferência') NOT NULL,
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
    status ENUM('Pendente','Em preparo','Em andamento','Entregue','Cancelado') NOT NULL DEFAULT 'Pendente',
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
    foto_url VARCHAR(255),

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
    status ENUM('Aguardando','Em rota','Concluída','Cancelada') NOT NULL DEFAULT 'Aguardando',

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

CREATE TABLE ProdutoPopularidade (
    cod_produto INT PRIMARY KEY,
    total_vendido INT NOT NULL DEFAULT 0,
    atualizado_em DATETIME NOT NULL,
    FOREIGN KEY (cod_produto) REFERENCES Produto(cod_produto)
);

CREATE TABLE LojaPopularidade (
    cod_loja INT PRIMARY KEY,
    total_vendido INT NOT NULL DEFAULT 0,
    atualizado_em DATETIME NOT NULL,
    FOREIGN KEY (cod_loja) REFERENCES Loja(cod_loja)
);


-- =========================================================
-- USUARIO
-- (1-5: compradores | 6-8: entregadores | 9-11: donos de loja | 12: admin)
-- 13-17 entregadores | 18-26 donos de loja | 27-31 compradores
-- Usuários 1-12 mantidos igual como antes. Senhas dos novos usuários (13-31) seguem
-- o mesmo formato ( bruno.carvalho123, padaria.estreladourada123, gabriel.martins123 etc.).
-- =========================================================
INSERT INTO Usuario (email, senha, nome, tipo_usuario, telefone) VALUES
('joao.silva@email.com', 'scrypt:32768:8:1$9eN0zol7OblD6rrx$9b5b73790de84492ad61e48163c50c1c9e3af2159273cd5fdecad9ec1ef45d85a6295c73fa3d12f99d429343aeb7d5afd4f93f0fc66cf5a0e633014f3022fdeb', 'João Silva', 'Comprador', '32991027384'),
('maria.souza@email.com', 'scrypt:32768:8:1$A9O17HTDRSsNm2Qg$2f047ab698200bf2d632a034769e5aef6169570a7bca77f5e2d47600cfe686a5d88d0c9b3a5bd40064204f5843b3b1280860c653a561296d59e24dcdbd2ee4ad', 'Maria Souza', 'Comprador', '32992348821'),
('carlos.lima@email.com', 'scrypt:32768:8:1$zVaPz5qYU1y1RlmZ$64eb2297c8207eec638060290e231d0c5f6f5dc0a411d3853cd1b063de8681456879f1e405cdf2369e3118e274b5229c3e924545714a34254bc2bf624e3f47f8', 'Carlos Lima', 'Comprador', '32993451167'),
('ana.pereira@email.com', 'scrypt:32768:8:1$spJ5UpbWyFo8r3FO$7ac8c4c4a4c64b7f482c4efaad4e60e9b6c162e345b691942da9858916c6ba65267a815ccd1e4d06a7666d56b0b232118ca4db5f2f3cb7dee5839e369533992a', 'Ana Pereira', 'Comprador', '32994567290'),
('pedro.santos@email.com', 'scrypt:32768:8:1$dn6tfq8bWl0BxhKB$e9161d1ba38a3fd13223650736df3cf30e19eebd469c2976122784749eaa9481652b51ff097082355a610b01f03d726b210663b5f5ce8a38bddeb263d6adc5b7', 'Pedro Santos', 'Comprador', '32995673345'),
('lucas.oliveira@email.com', 'scrypt:32768:8:1$5JmkvptqbJK16zz6$334828d83cdcc313f51972635887ae1b3012331054c5b02d1e6e2a55e5203eccb8b573cb84cc7ae9c28b7cebe9238ffc859e6f19f6a0da1fdd20953192630b9c', 'Lucas Oliveira', 'Entregador', '32988112234'),
('fernanda.costa@email.com', 'scrypt:32768:8:1$TYbVYkkFbmCeKm2T$a7986bcc642c793bd0282a41fb7753b31a5e7380e8918a837c232b69c9f1884d8ceecde348931b6f4d82f3faab1be1eed94669dbdaa2d2476362fa4c279dd20d', 'Fernanda Costa', 'Entregador', '32987229981'),
('rafael.almeida@email.com', 'scrypt:32768:8:1$TwCMjLoNHaTAmOFe$8ff618bf2f7be522c7d3a2bd00f3dd57625364ff5c40a76d28a3776652269cbde68e9224828d19fba9c41b33610c8dc9736ee220dc6a727183b2a411a4eac3f2', 'Rafael Almeida', 'Entregador', '32986334456'),
('contato@cafeteriadorenata.com', 'scrypt:32768:8:1$DWIQqJKGrD1vkfLN$b92d0b447449cfd1733b9e3f0cc9f7cbe72463d5e4784560e7b97a6d3ae2114b5f68022a93ca51a74fabb873567a47c5b378958578126017aee733938c358889', 'Cafeteria da Renata', 'Loja', '32337122885'),
('contato@padariabomgosto.com', 'scrypt:32768:8:1$mAGz7e4S0nVhlCAc$b1d352c8fbb0033db55f16f8fdee8e79fb656476ffc30331e898d975222e4a62131f5c449b840b161e101e778ec8e2805ae8f04e4ba524722d1c9dba09bbd08b', 'Padaria Bom Gosto', 'Loja', '32337255410'),
('contato@docedecasa.com', 'scrypt:32768:8:1$RcFXefnKT8BcEOtd$8f29cb30f44de1001e606177ce3c4f5133b675302844bed76d49789ebe2a20440f86dfbb7885fb83e10596c8e1e183aca248436aae602ba94bf60a272b019ee2', 'Doce de Casa', 'Loja', '32337390877'),
('admin@cafezin.com', 'scrypt:32768:8:1$BDRpp1j6SsyiiFWG$f34ba0d55bd15c6188b7f8948218980540c49ce1500ad907b24165c14d3c3a1ca6c57c3e0d18c2f5072ef42847b0f1a5cfb72609607fc24f255b8707df7ea39c', 'Administrador Cafezin', 'Admin', NULL);

-- Novos entregadores (13-17)
INSERT INTO Usuario (email, senha, nome, tipo_usuario, telefone) VALUES
('bruno.carvalho@email.com', 'scrypt:32768:8:1$hrEi2lRQzpjnhDXm$997c7c863e29a2d008c1a24dea588e8b15c663fa325b354e5224d38250cb96875932341a76a44be61e0dba95d6800fe6cbf774881d4013bf3d28dfab9ec95130', 'Bruno Carvalho', 'Entregador', '32988445566'),
('diego.martins@email.com', 'scrypt:32768:8:1$fl5kY5RMO58Ze4tl$13eef9a9ba689ea8031ece6ccf31028200eb63fc6bcc265bb343abdc83c48922bfdfce558ca5ded7362d632184905b6dd097a41596444ac763e7d59ad06f0ed6', 'Diego Martins', 'Entregador', '32987556677'),
('juliana.ferreira@email.com', 'scrypt:32768:8:1$4FS0UiwZHDkv5FcO$2e6bfe60738f82975ebb239fc2e4ca261c86711272c1e20a4cfac6d504ec676f7df133e717545c3b4a05dc9dcf589d56f02fb9c4abb16cb228d4342c8725f01d', 'Juliana Ferreira', 'Entregador', '32986667788'),
('thiago.rocha@email.com', 'scrypt:32768:8:1$3y2jJbNc3k9fjXR5$ea319ed312121c729baceaecefd892befa878d582848a2f7b3d0cdb37e33938a3cfed6971db45bdb1c6d5781843cbc41715216ebaab3320ed3d457164a528c17', 'Thiago Rocha', 'Entregador', '32985778899'),
('camila.nunes@email.com', 'scrypt:32768:8:1$sIqsGmtmSr64KDp0$d45f71c9c291f62f861603446ddb30184975608de0618aa4a17c430aae2d7c070ecb9da993c089a1d0c7f41f8ba3b32559e9d4558123f7fb848e9566aeb0e922', 'Camila Nunes', 'Entregador', '32984889900');

-- Novos donos de loja (18-26)
INSERT INTO Usuario (email, senha, nome, tipo_usuario, telefone) VALUES
('contato@padariaestreladourada.com', 'scrypt:32768:8:1$kATYZMWCJr4PNAAi$c1eb497c4c2b905938b5e0e9c7c514c0c588fcbb4e2e84d8be489b82c22139ac101dabcccc882b81fa2a40f533e44a016a78a51ae7e2bba7919fb89a061d67a5', 'Padaria Estrela Dourada', 'Loja', '32337411223'),
('contato@cafeteriatrilhoreal.com', 'scrypt:32768:8:1$PTQCqnF9peePLmZ7$82abbcbe951bf0f618fd8173f9d1160255645ca6ec7d87156d5184c8c1a53836a02570f36da615e68cc3bb6cb7a36916af1329d361fd8025f818cf6ff67a9e54', 'Cafeteria Trilho Real', 'Loja', '32337522334'),
('contato@docesabormineiro.com', 'scrypt:32768:8:1$7KAucySgT1PmXF1R$d7c6cbb068ab55c3159d3c4651544910608dc89712fdf5175fc7674a43227d092f6e1a09c02435dcd2319b8514bfd93919fe33da63498680ca2a844aee39272c', 'Doceria Sabor Mineiro', 'Loja', '32337633445'),
('contato@point33burguer.com', 'scrypt:32768:8:1$yXOxOw2Xtg06SL0K$a2158adb1c59fac23bef5645c3bfc8bbae010cdcbb7b49615d45c035b9b7a25f26e5151385325582123b0ab3be15cb5e91a231031f04e4b2b1df4704d58b3080', 'Hamburgueria Point 33', 'Loja', '32337744556'),
('contato@gelatoreal.com', 'scrypt:32768:8:1$VWSjGlzusrq9yAK4$5adadcc170926489df42c222cf839ffb6876f9a7cb121edc62376dd0618240d6a0495af7736426e651570b7f22c9ec7b0adf57c27357c45064cf5242e7e25ac6', 'Sorveteria Gelato Real', 'Loja', '32337855667'),
('contato@theatrocafe.com', 'scrypt:32768:8:1$zwPIsABtO6adKWf9$84149db0467d1f1207b9558162cf6f12b5b59c6b08601cfd1bcc588c0749dc65468017d4c5cb96e61bc4bb432a3b0c442657135140665e223f56bace261a6a23', 'Theatro Café', 'Loja', '32337966778'),
('contato@paonosso.com', 'scrypt:32768:8:1$eG5SJlws5qw0YsY6$33134266039948ba8a809f48732aee893c9439be3f4cdadcbb19b0303310bd0470f45886aa03dbef20fb57c0b9da59c205eff0272bff168add99a29adc98f0d0', 'Pão Nosso', 'Loja', '32338077889'),
('contato@doceencanto.com', 'scrypt:32768:8:1$aG6xrLhzlp7PZvrV$a1a529322db80c4ff8b95dbeba78277877e1e9bd619a4ce00ff1a980c8d3fd4db97bb9d60e87d17e19bc4cf884b1c65990b103b8e8ab9aea5d22bf99c57a4a71', 'Confeitaria Doce Encanto', 'Loja', '32338188990'),
('contato@emporiodasbebidas.com', 'scrypt:32768:8:1$hc59cvPqOlgxnOoB$2c0493a2c85c44096f1988ea526d6ae05127698b04fca1ad97c3aa1233093657e7ad7e95adb00077688353421d4ab431767e27f5ed4c8d928f69b3245966295c', 'Empório das Bebidas', 'Loja', '32338299001');

-- Novos compradores (27-31)
INSERT INTO Usuario (email, senha, nome, tipo_usuario, telefone) VALUES
('gabriel.martins@email.com', 'scrypt:32768:8:1$CjYUwQfrxYMsARmV$79c3b87067e3ad2f0b7d3c911411e9472d875e382246f8c0e14c3b4a3fa62b53063305b4ed624fe3a21dd5bcea869822455f24abf1bcb3eb85240e3c536ebd00', 'Gabriel Martins', 'Comprador', '32996784511'),
('isabela.rocha@email.com', 'scrypt:32768:8:1$f3ZnA53To4ebWbp6$f9fdf756967d4a578e7f2967788e0a4f223794a5f68c2becd9c14387efc28792e8546c3e88552ccbf021bc0e2a5ca1dc50f15b0520b23d45c736e73c0fb105b7', 'Isabela Rocha', 'Comprador', '32997895622'),
('matheus.correia@email.com', 'scrypt:32768:8:1$awDo4sSwNQjgy0Km$5f86c2034fbeae5e3ec879b0097954c0b41f1485b5f193fe80d3ee577d3edc0f70a58a8dab93d3c582f37f9c39fd10b41f6dfbc85c5eb7630c577cad2840c2e8', 'Matheus Correia', 'Comprador', '32998906733'),
('larissa.andrade@email.com', 'scrypt:32768:8:1$mqpf5u7iLZ2qVkaa$a2985d7e207f2d5dae3ede6f41cb978994814937b8a85aaddad03929f4f6c36ec8215f87b481576e19511b44cf60b8f811a1976486d5e5bc1bd3f45fc26b1221', 'Larissa Andrade', 'Comprador', '32999017844'),
('vinicius.teixeira@email.com', 'scrypt:32768:8:1$OH5VejrRypwD5Z3D$e4d84a5bc0d13e78ae8bd81aa5db43387deefcf0e66ac483a97a47c1dfd4dbdbbff510f52c3a44b6272cba5fc71b752bff65dd129151b98fefc7df222c984f34', 'Vinicius Teixeira', 'Comprador', '32990128955');

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
('Rua Tiradentes', '502', 'Centro', 'São João del Rei', 'MG', '36307000'),
('Rua Bahia', '65', 'Centro', 'São João del Rei', 'MG', '36300050'),
('Avenida Hermílio Alves', '300', 'Fábricas', 'São João del Rei', 'MG', '36301050'),
('Rua Otoni Silva', '22', 'São Dimas', 'São João del Rei', 'MG', '36302050'),
('Rua São José', '150', 'Colônia do Marçal', 'São João del Rei', 'MG', '36304050'),
('Avenida Tancredo Neves', '1100', 'Vila Belo Horizonte', 'São João del Rei', 'MG', '36305050'),
('Rua Barão de São João del Rei', '40', 'Matosinhos', 'São João del Rei', 'MG', '36306050'),
('Praça Frei Orlando', '10', 'Centro', 'São João del Rei', 'MG', '36300080'),
('Rua Ribeiro Bastos', '210', 'Fábricas', 'São João del Rei', 'MG', '36301080'),
('Rua Cel. José Maria de Alkmin', '77', 'São Dimas', 'São João del Rei', 'MG', '36302080'),
('Rua Cel. Passos', '300', 'Centro', 'São João del Rei', 'MG', '36300100'),
('Avenida Beira Rio', '88', 'Fábricas', 'São João del Rei', 'MG', '36301100'),
('Rua Dom Pedro II', '145', 'São Dimas', 'São João del Rei', 'MG', '36302100'),
('Rua Padre Toledo', '62', 'Colônia do Marçal', 'São João del Rei', 'MG', '36304100'),
('Rua Prefeito Alaor Prata', '210', 'Vila Belo Horizonte', 'São João del Rei', 'MG', '36305100');

-- =========================================================
-- PAGAMENTO
-- =========================================================
INSERT INTO Pagamento (tipo, data) VALUES
('PIX', '2025-01-10 09:15:00'),
('Cartão', '2025-01-11 12:30:00'),
('Dinheiro', '2025-01-12 18:45:00'),
('Boleto', '2025-01-13 08:00:00'),
('Transferência', '2025-01-14 14:20:00'),
('PIX', '2025-01-15 19:05:00'),
('PIX', '2025-06-01 10:00:00'),
('Cartão', '2025-06-05 10:00:00'),
('Dinheiro', '2025-07-10 10:00:00'),
('Transferência', '2025-08-02 10:00:00'),
('PIX', '2025-09-15 10:00:00'),
('PIX', '2026-09-22 08:25:00'),
('Cartão', '2026-09-22 12:10:00'),
('Dinheiro', '2026-09-22 14:55:00'),
('Boleto', '2026-09-22 16:35:00'),
('PIX', '2026-09-22 07:05:00'),
('Transferência', '2026-09-22 18:15:00'),
('PIX', '2026-09-23 08:55:00'),
('Cartão', '2026-09-23 10:25:00'),
('Dinheiro', '2026-09-23 11:10:00'),
('PIX', '2026-09-23 11:55:00'),
('Cartão', '2026-09-22 09:40:00'),
('Boleto', '2026-09-23 14:15:00');

-- Pagamentos dos pedidos de demonstração de amanhã (24-30 => pedidos 19-25)
INSERT INTO Pagamento (tipo, data) VALUES
('PIX', '2026-09-23 07:10:00'),
('Cartão', '2026-09-23 07:55:00'),
('Dinheiro', '2026-09-23 09:05:00'),
('PIX', '2026-09-23 09:35:00'),
('Transferência', '2026-09-23 07:25:00'),
('PIX', '2026-09-23 08:40:00'),
('Boleto', '2026-09-23 09:15:00');

-- =========================================================
-- CATEGORIA
-- =========================================================
INSERT INTO Categoria (nome_categoria) VALUES
('Cafe'),
('Pao'),
('Doces'),
('Bebidas'),
('Salgados'),
('Sanduiches'),
('Sorvetes'),
('Chocolates');

-- =========================================================
-- COMPRADOR (cod_usuario 1 a 5)
-- =========================================================
INSERT INTO Comprador (cpf, data_nasc, sexo, cod_usuario) VALUES
('05827194633', '1995-03-14', 'M', 1),
('14926837051', '1998-07-22', 'F', 2),
('23847561092', '1990-11-05', 'M', 3),
('36758291047', '2000-01-30', 'F', 4),
('47869102358', '1988-09-18', 'M', 5),
('91537284066', '1994-02-11', 'M', 27),
('82649175037', '1999-08-27', 'F', 28),
('73758296148', '1987-05-03', 'M', 29),
('64869307259', '1996-12-19', 'F', 30),
('55971428360', '1992-10-08', 'M', 31);

-- =========================================================
-- COMPRADOR_ENDERECO
-- =========================================================
INSERT INTO Comprador_Endereco (cod_comprador, cod_endereco) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5),
(6, 18),
(7, 19),
(8, 20),
(9, 21),
(10, 22);

-- =========================================================
-- ENTREGADOR (cod_usuario 6 a 8 | cod_pagamento 1 a 3)
-- NOVOS: cod_usuario 13 a 17 | cod_pagamento 7 a 11
-- =========================================================
INSERT INTO Entregador (cpf, data_nasc, cnh, cod_pagamento, cod_usuario) VALUES
('58970213467', '1993-05-20', '38452167900', 1, 6),
('69081324578', '1996-08-11', '47563289011', 2, 7),
('70192435689', '1991-12-02', '56674390122', 3, 8),
('81527364095', '1994-04-12', '61784523099', 7, 13),
('92638475106', '1997-09-25', '72895634100', 8, 14),
('63749158027', '1992-02-08', '83906745211', 9, 15),
('74850269138', '1999-06-30', '94017856322', 10, 16),
('85961370249', '1995-11-17', '15128967433', 11, 17);

-- =========================================================
-- LOJA (cod_usuario 9 a 11 | endereços 6 a 8)
-- NOVAS LOJAS: cod_usuario 18 a 26 | endereços 9 a 17
-- =========================================================
INSERT INTO Loja (cnpj, horario_funcionamento, cod_endereco, cod_usuario) VALUES
('08765432000156', '07:00:00', 6, 9),
('19876543000167', '06:30:00', 7, 10),
('27654398000178', '10:00:00', 8, 11),
('18452037000185', '06:00:00', 9, 18),  -- 4  Padaria Estrela Dourada
('27913846000162', '07:30:00', 10, 19), -- 5  Cafeteria Trilho Real
('39184756000271', '08:00:00', 11, 20), -- 6  Doceria Sabor Mineiro
('46582917000348', '11:00:00', 12, 21), -- 7  Hamburgueria Point 33
('58374920000455', '12:00:00', 13, 22), -- 8  Sorveteria Gelato Real
('61947582000523', '07:00:00', 14, 23), -- 9  Theatro Café
('73158249000617', '06:30:00', 15, 24), -- 10 Pão Nosso
('84269371000734', '09:00:00', 16, 25), -- 11 Confeitaria Doce Encanto
('95371482000819', '08:30:00', 17, 26); -- 12 Empório das Bebidas

-- =========================================================
-- PRODUTO
-- Loja 1 = Cafeteria da Renata | Loja 2 = Padaria Bom Gosto | Loja 3 = Doce de Casa
-- Loja 4 = Padaria Estrela Dourada | Loja 5 = Cafeteria Trilho Real
-- Loja 6 = Doceria Sabor Mineiro  | Loja 7 = Hamburgueria Point 33
-- Loja 8 = Sorveteria Gelato Real | Loja 9 = Theatro Café
-- Loja 10 = Pão Nosso             | Loja 11 = Confeitaria Doce Encanto
-- Loja 12 = Empório das Bebidas
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
(3, 'Pudim', 'Pudim de leite condensado', 7.50, TRUE, 3),
(4, 'Pão Italiano', 'Pão italiano de casca crocante, unidade', 5.50, TRUE, 2),
(4, 'Broa de Fubá', 'Broa de fubá tradicional mineira', 4.00, TRUE, 2),
(4, 'Rosca Doce', 'Rosca doce recheada com goiabada', 12.00, TRUE, 2),
(4, 'Coxinha de Frango', 'Coxinha de frango cremosa, unidade', 6.50, TRUE, 5),
(4, 'Pastel de Queijo', 'Pastel assado recheado com queijo', 7.00, TRUE, 5),
(4, 'Esfirra de Carne', 'Esfirra aberta de carne temperada', 6.00, TRUE, 5),
-- Loja 5: Cafeteria Trilho Real
(5, 'Café Coado', 'Café coado na hora, xícara', 5.00, TRUE, 1),
(5, 'Mocaccino', 'Mistura de café expresso com chocolate', 10.50, TRUE, 1),
(5, 'Chá Mate Gelado', 'Chá mate gelado com limão', 6.00, TRUE, 4),
(5, 'Vitamina de Banana', 'Vitamina de banana com leite', 8.00, TRUE, 4),
(5, 'Suco de Laranja Natural', 'Suco de laranja espremido na hora', 7.50, TRUE, 4),
(5, 'Água com Gás', 'Água mineral com gás, 500ml', 4.00, TRUE, 4),
-- Loja 6: Doceria Sabor Mineiro
(6, 'Doce de Leite', 'Doce de leite artesanal, pote 300g', 15.00, TRUE, 3),
(6, 'Bolo de Fubá com Goiabada', 'Fatia de bolo de fubá com goiabada derretida', 9.00, TRUE, 3),
(6, 'Cocada', 'Cocada branca cremosa', 5.50, TRUE, 3),
(6, 'Ambrosia', 'Doce mineiro de leite e ovos', 6.50, TRUE, 3),
(6, 'Quindim', 'Quindim tradicional, unidade', 5.00, TRUE, 3),
(6, 'Paçoca Gourmet', 'Paçoca gourmet de amendoim', 4.50, TRUE, 3),
-- Loja 7: Hamburgueria Point 33
(7, 'X-Burguer', 'Hambúrguer com queijo e molho especial', 16.00, TRUE, 6),
(7, 'X-Salada', 'Hambúrguer com queijo, alface e tomate', 18.00, TRUE, 6),
(7, 'X-Bacon', 'Hambúrguer com queijo e bacon crocante', 20.00, TRUE, 6),
(7, 'Misto Quente', 'Pão, presunto e queijo na chapa', 9.00, TRUE, 6),
(7, 'Cachorro-Quente Completo', 'Cachorro-quente com molho, milho e batata palha', 12.00, TRUE, 6),
(7, 'Batata Frita', 'Porção de batata frita crocante', 14.00, TRUE, 6),
-- Loja 8: Sorveteria Gelato Real
(8, 'Picolé de Morango', 'Picolé artesanal de morango', 5.00, TRUE, 7),
(8, 'Casquinha de Chocolate', 'Casquinha com sorvete de chocolate', 6.00, TRUE, 7),
(8, 'Açaí na Tigela', 'Açaí batido com granola e banana', 15.00, TRUE, 7),
(8, 'Sorvete de Flocos', 'Bola de sorvete de flocos', 7.00, TRUE, 7),
(8, 'Milk Shake de Morango', 'Milk shake cremoso de morango', 13.00, TRUE, 7),
-- Loja 9: Theatro Café
(9, 'Espresso Duplo', 'Dose dupla de café espresso', 7.50, TRUE, 1),
(9, 'Café Gelado', 'Café espresso servido com gelo', 9.00, TRUE, 1),
(9, 'Chocolate Quente', 'Chocolate quente cremoso', 8.50, TRUE, 1),
(9, 'Torta de Maçã', 'Fatia de torta de maçã com canela', 10.00, TRUE, 3),
(9, 'Scone com Geleia', 'Scone amanteigado com geleia de frutas vermelhas', 9.50, TRUE, 3),
-- Loja 10: Pão Nosso
(10, 'Pão de Forma Integral', 'Pão de forma integral, unidade', 8.00, TRUE, 2),
(10, 'Baguete', 'Baguete francesa crocante', 6.50, TRUE, 2),
(10, 'Pão Doce', 'Pão doce recheado com creme', 5.50, TRUE, 2),
(10, 'Rosquinha de Coco', 'Rosquinha assada com coco ralado', 4.00, TRUE, 2),
(10, 'Pão de Alho', 'Pão de alho amanteigado, porção', 12.00, TRUE, 2),
-- Loja 11: Confeitaria Doce Encanto
(11, 'Trufa de Chocolate', 'Trufa artesanal de chocolate meio amargo', 4.50, TRUE, 8),
(11, 'Bombom Recheado', 'Bombom recheado com brigadeiro', 3.50, TRUE, 8),
(11, 'Brownie', 'Brownie de chocolate com nozes', 8.00, TRUE, 3),
(11, 'Beijinho', 'Beijinho de coco, unidade', 2.80, TRUE, 3),
(11, 'Torta de Ninho com Morango', 'Fatia de torta de leite ninho com morango', 12.00, TRUE, 3),
-- Loja 12: Empório das Bebidas
(12, 'Refrigerante Lata', 'Refrigerante gelado, lata 350ml', 6.00, TRUE, 4),
(12, 'Suco de Uva Integral', 'Suco de uva integral, 300ml', 9.00, TRUE, 4),
(12, 'Energético', 'Bebida energética, lata 250ml', 10.00, TRUE, 4),
(12, 'Água Mineral', 'Água mineral sem gás, 500ml', 3.50, TRUE, 4),
(12, 'Chá Gelado de Pêssego', 'Chá gelado sabor pêssego, 300ml', 7.00, TRUE, 4),
(12, 'Café Gelado Garrafa', 'Café gelado adoçado, garrafa 300ml', 8.50, TRUE, 4);

-- =========================================================
-- PEDIDO
-- valor_total = soma dos itens + valor_frete (conferido item a item)
-- Pedidos 7 a 18 são novos: parte para hoje (2026-09-22) e parte para
-- amanhã (2026-09-23), incluindo pedidos já entregues em ambas as datas.
-- =========================================================
INSERT INTO Pedido (data_pedido, valor_frete, valor_total, status, cod_comprador, cod_loja, cod_end_entrega, cod_pagamento) VALUES
('2025-01-10 09:10:00', 5.00, 27.00, 'Entregue', 1, 1, 1, 1),
('2025-01-11 12:25:00', 6.00, 21.40, 'Entregue', 2, 2, 2, 2),
('2025-01-12 18:40:00', 4.50, 9.50, 'Entregue', 3, 3, 3, 3),
('2025-01-13 07:55:00', 7.00, 22.50, 'Em andamento', 4, 3, 4, 4),
('2025-01-14 14:15:00', 5.50, 12.50, 'Cancelado', 5, 1, 5, 5),
('2025-01-15 19:00:00', 4.00, 19.00, 'Entregue', 1, 3, 1, 6),
('2026-09-22 08:30:00', 4.50, 22.00, 'Entregue',     1, 5,  1, 12), 
('2026-09-22 12:15:00', 6.00, 52.00, 'Entregue',     2, 7,  2, 13), 
('2026-09-22 15:00:00', 5.00, 22.50, 'Em preparo',   3, 9,  3, 14), 
('2026-09-22 16:40:00', 5.50, 31.90, 'Pendente',     4, 11, 4, 15), 
('2026-09-22 07:10:00', 4.00, 33.50, 'Entregue',     5, 4,  5, 16), 
('2026-09-22 18:20:00', 5.00, 33.00, 'Em andamento', 1, 8,  1, 17), 
('2026-09-23 09:00:00', 4.50, 23.50, 'Pendente',     2, 12, 2, 18), 
('2026-09-23 10:30:00', 5.00, 24.00, 'Entregue',     3, 6,  3, 19), 
('2026-09-23 11:15:00', 5.00, 31.50, 'Em preparo',   4, 1,  4, 20), 
('2026-09-23 12:00:00', 6.00, 26.00, 'Pendente',     5, 2,  5, 21), 
('2026-09-22 09:45:00', 5.00, 25.00, 'Cancelado',    1, 10, 1, 22), 
('2026-09-23 14:20:00', 4.50, 22.50, 'Entregue',     2, 3,  2, 23); 

-- =========================================================
-- Pedidos de demonstração para amanhã (2026-09-23)
-- =========================================================
INSERT INTO Pedido (data_pedido, valor_frete, valor_total, status, cod_comprador, cod_loja, cod_end_entrega, cod_pagamento) VALUES
('2026-09-23 07:15:00', 5.00, 27.00, 'Entregue',     6, 1, 18, 24), -- 19
('2026-09-23 08:00:00', 4.50, 29.50, 'Entregue',     7, 1, 19, 25), -- 20
('2026-09-23 09:10:00', 5.00, 31.50, 'Em andamento', 8, 1, 20, 26), -- 21
('2026-09-23 09:40:00', 4.00, 28.50, 'Em preparo',   9, 1, 21, 27), -- 22
('2026-09-23 07:30:00', 5.50, 16.50, 'Entregue',    10, 2, 22, 28), -- 23
('2026-09-23 08:45:00', 4.00, 19.50, 'Entregue',     6, 5, 18, 29), -- 24
('2026-09-23 09:20:00', 6.00, 36.00, 'Pendente',     9, 7, 21, 30); -- 25

-- =========================================================
-- ITEMPEDIDO
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
(2, 7.50, 6, 10),
(2, 5.00, 7, 17),   -- Café Coado
(1, 7.50, 7, 21),   -- Suco de Laranja Natural
(2, 16.00, 8, 29),  -- X-Burguer
(1, 14.00, 8, 34),  -- Batata Frita
(1, 7.50, 9, 40),   -- Espresso Duplo
(1, 10.00, 9, 43),  -- Torta de Maçã
(4, 4.50, 10, 50),  -- Trufa de Chocolate
(3, 2.80, 10, 53),  -- Beijinho
(3, 5.50, 11, 11),  -- Pão Italiano
(2, 6.50, 11, 14),  -- Coxinha de Frango
(1, 15.00, 12, 37), -- Açaí na Tigela
(1, 13.00, 12, 39), -- Milk Shake de Morango
(2, 6.00, 13, 55),  -- Refrigerante Lata
(2, 3.50, 13, 58),  -- Água Mineral
(1, 9.00, 14, 24),  -- Bolo de Fubá com Goiabada
(2, 5.00, 14, 27),  -- Quindim
(2, 9.00, 15, 2),   -- Cappuccino
(1, 8.50, 15, 4),   -- Torta de Limão
(10, 0.80, 16, 5),  -- Pão Francês
(2, 6.00, 16, 7),   -- Croissant
(1, 8.00, 17, 45),  -- Pão de Forma Integral
(3, 4.00, 17, 48),  -- Rosquinha de Coco
(4, 2.50, 18, 8),   -- Brigadeiro
(1, 8.00, 18, 9),   -- Bolo de Chocolate
(2, 6.50, 19, 1),   -- Café Expresso
(1, 9.00, 19, 2),   -- Cappuccino
(1, 7.00, 20, 3),   -- Café com Leite
(2, 9.00, 20, 2),   -- Cappuccino
(3, 6.50, 21, 1),   -- Café Expresso
(1, 7.00, 21, 3),   -- Café com Leite
(2, 9.00, 22, 2),   -- Cappuccino
(1, 6.50, 22, 1),   -- Café Expresso
(5, 0.80, 23, 5),   -- Pão Francês
(2, 3.50, 23, 6),   -- Pão de Queijo
(1, 5.00, 24, 17),  -- Café Coado
(1, 10.50, 24, 18), -- Mocaccino
(1, 16.00, 25, 29), -- X-Burguer
(1, 14.00, 25, 34); -- Batata Frita

-- =========================================================
-- ENTREGA
-- =========================================================
INSERT INTO Entrega (distancia, data_saida, data_entrega, status, cod_pedido, cod_entregador) VALUES
(3.2, '2025-01-10 09:20:00', '2025-01-10 09:45:00', 'Concluída', 1, 1),
(5.0, '2025-01-11 12:35:00', '2025-01-11 13:05:00', 'Concluída', 2, 2),
(2.1, '2025-01-12 18:50:00', '2025-01-12 19:10:00', 'Concluída', 3, 3),
(4.4, '2025-01-13 08:05:00', NULL, 'Em rota', 4, 1),
(2.8, '2026-09-22 08:35:00', '2026-09-22 08:55:00', 'Concluída', 7, 2),
(4.1, '2026-09-22 12:20:00', '2026-09-22 12:50:00', 'Concluída', 8, 4),
(1.9, '2026-09-22 07:15:00', '2026-09-22 07:35:00', 'Concluída', 11, 5),
(3.5, '2026-09-23 10:35:00', '2026-09-23 11:00:00', 'Concluída', 14, 6),
(2.2, '2026-09-23 14:25:00', '2026-09-23 14:50:00', 'Concluída', 18, 7),
(5.3, '2026-09-22 18:25:00', NULL, 'Em rota', 12, 8),
(2.5, '2026-09-23 07:20:00', '2026-09-23 07:40:00', 'Concluída', 19, 3),
(3.0, '2026-09-23 08:05:00', '2026-09-23 08:25:00', 'Concluída', 20, 1),
(3.8, '2026-09-23 09:15:00', NULL, 'Em rota', 21, 6),
(2.0, '2026-09-23 07:35:00', '2026-09-23 07:55:00', 'Concluída', 23, 2),
(4.6, '2026-09-23 08:50:00', '2026-09-23 09:10:00', 'Concluída', 24, 4);

-- =========================================================
-- AVALIACAOENTREGADOR
-- =========================================================
INSERT INTO AvaliacaoEntregador (data, descricao, nota, horario, cod_pedido) VALUES
('2025-01-10', 'Entregador muito rápido e educado', 5, '09:50:00', 1),
('2025-01-11', 'Entrega dentro do prazo', 4, '13:10:00', 2),
('2025-01-12', 'Um pouco atrasado, mas produto intacto', 3, '19:15:00', 3),
('2026-09-22', 'Chegou rapidinho e o café ainda estava quente', 5, '09:00:00', 7),
('2026-09-22', 'Entrega ok, só atrasou uns minutinhos', 4, '12:55:00', 8),
('2026-09-22', 'Entregador super gentil', 5, '07:40:00', 11),
('2026-09-23', 'Tudo certinho', 4, '11:05:00', 14),
('2026-09-23', 'Muito rápido, chegou antes do previsto', 5, '14:55:00', 18),
('2026-09-23', 'Rápido e simpático logo cedo', 5, '07:45:00', 19),
('2026-09-23', 'Boa entrega, só achei meio corrido', 4, '08:55:00', 24);

-- =========================================================
-- AVALIACAOLOJA
-- =========================================================
INSERT INTO AvaliacaoLoja (data, descricao, nota, horario, cod_pedido) VALUES
('2025-01-10', 'Ótimo atendimento e café delicioso', 5, '10:00:00', 1),
('2025-01-11', 'Padaria muito boa, recomendo', 5, '13:20:00', 2),
('2025-01-12', 'Doces bons, mas demorou um pouco', 4, '19:25:00', 3),
('2026-09-22', 'Café delicioso da Trilho Real', 5, '09:05:00', 7),
('2026-09-22', 'Hambúrguer bom, mas veio meio frio', 4, '13:00:00', 8),
('2026-09-22', 'Pão fresquinho, recomendo demais', 5, '07:45:00', 11),
('2026-09-23', 'Doces maravilhosos, voltarei a comprar', 5, '11:10:00', 14),
('2026-09-23', 'Brigadeiro gostoso, chegou bem embalado', 4, '15:00:00', 18),
('2026-09-23', 'Cafézinho impecável logo cedo, começou bem o dia', 5, '07:45:00', 19),
('2026-09-23', 'Café coado maravilhoso, super querido', 5, '08:55:00', 24);

-- =========================================================
-- AVALIACAOPRODUTO
-- =========================================================
INSERT INTO AvaliacaoProduto (data, descricao, nota, horario, cod_produto, cod_comprador) VALUES
('2025-01-10', 'Café bem encorpado, gostei muito', 5, '10:05:00', 1, 1),
('2025-01-11', 'Pão de queijo fresquinho e saboroso', 5, '13:25:00', 6, 2),
('2025-01-12', 'Brigadeiro muito doce para o meu gosto', 3, '19:30:00', 8, 3),
('2025-01-13', 'Bolo de chocolate úmido, ficou ótimo', 4, '11:00:00', 9, 4),
('2026-09-22', 'Café bem forte, gostei bastante', 5, '09:10:00', 17, 1),
('2026-09-22', 'Bom, mas achei um pouco salgado', 4, '13:05:00', 29, 2),
('2026-09-22', 'Crocante por fora e macio por dentro', 5, '07:50:00', 11, 5),
('2026-09-23', 'Sabor de infância, muito bom', 5, '11:15:00', 24, 3),
('2026-09-23', 'Bem docinho, recomendo', 4, '15:05:00', 8, 2),
('2026-09-23', 'Excelente para começar o dia', 5, '07:50:00', 1, 6),
('2026-09-23', 'Cappuccino cremoso, adorei', 5, '08:05:00', 2, 7),
('2026-09-23', 'Muito bom, mas achei meio doce', 4, '08:55:00', 18, 6);
