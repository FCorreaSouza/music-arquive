
CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE categorias (
    id_categoria SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT
);


CREATE TABLE produtos (
    id_produto SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL CHECK (preco >= 0),
    quantidade_estoque INTEGER NOT NULL DEFAULT 0
        CHECK (quantidade_estoque >= 0),
    marca VARCHAR(100),
    imagem_url VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    id_categoria INTEGER NOT NULL,

    CONSTRAINT fk_produto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categorias(id_categoria)
);


CREATE TABLE instrumentos (
    id_produto INTEGER PRIMARY KEY,

    tipo VARCHAR(100) NOT NULL,
    modelo VARCHAR(100),
    cor VARCHAR(50),
    material VARCHAR(100),

    CONSTRAINT fk_instrumento_produto
        FOREIGN KEY (id_produto)
        REFERENCES produtos(id_produto)
        ON DELETE CASCADE
);


CREATE TABLE discos_vinil (
    id_produto INTEGER PRIMARY KEY,

    artista VARCHAR(150) NOT NULL,
    album VARCHAR(150) NOT NULL,
    gravadora VARCHAR(150),
    ano_lancamento INTEGER,
    genero VARCHAR(100),
    formato VARCHAR(50),
    estado VARCHAR(50),

    CONSTRAINT fk_vinil_produto
        FOREIGN KEY (id_produto)
        REFERENCES produtos(id_produto)
        ON DELETE CASCADE
);


CREATE TABLE enderecos (
    id_endereco SERIAL PRIMARY KEY,

    id_usuario INTEGER NOT NULL,

    cep VARCHAR(10) NOT NULL,
    rua VARCHAR(150) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,

    CONSTRAINT fk_endereco_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE
);



CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,

    id_usuario INTEGER NOT NULL,
    id_endereco INTEGER NOT NULL,

    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',

    valor_total DECIMAL(10,2) NOT NULL DEFAULT 0
        CHECK (valor_total >= 0),

    CONSTRAINT fk_pedido_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario),

    CONSTRAINT fk_pedido_endereco
        FOREIGN KEY (id_endereco)
        REFERENCES enderecos(id_endereco),

    CONSTRAINT chk_status_pedido
        CHECK (
            status IN (
                'PENDENTE',
                'PAGO',
                'ENVIADO',
                'ENTREGUE',
                'CANCELADO'
            )
        )
);

CREATE TABLE itens_pedido (
    id_item SERIAL PRIMARY KEY,

    id_pedido INTEGER NOT NULL,
    id_produto INTEGER NOT NULL,

    quantidade INTEGER NOT NULL
        CHECK (quantidade > 0),

    preco_unitario DECIMAL(10,2) NOT NULL
        CHECK (preco_unitario >= 0),

    subtotal DECIMAL(10,2)
        GENERATED ALWAYS AS
        (quantidade * preco_unitario) STORED,

    CONSTRAINT fk_item_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES pedidos(id_pedido)
        ON DELETE CASCADE,

    CONSTRAINT fk_item_produto
        FOREIGN KEY (id_produto)
        REFERENCES produtos(id_produto)
);
 

CREATE TABLE pagamentos (
    id_pagamento SERIAL PRIMARY KEY,

    id_pedido INTEGER NOT NULL UNIQUE,

    metodo VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',

    valor DECIMAL(10,2) NOT NULL
        CHECK (valor >= 0),

    data_pagamento TIMESTAMP,

    CONSTRAINT fk_pagamento_pedido
        FOREIGN KEY (id_pedido)
        REFERENCES pedidos(id_pedido)
        ON DELETE CASCADE,

    CONSTRAINT chk_metodo_pagamento
        CHECK (
            metodo IN (
                'PIX',
                'CARTAO_CREDITO',
                'CARTAO_DEBITO',
                'BOLETO'
            )
        ),

    CONSTRAINT chk_status_pagamento
        CHECK (
            status IN (
                'PENDENTE',
                'APROVADO',
                'RECUSADO',
                'ESTORNADO'
            )
        )
);



CREATE TABLE avaliacoes (
    id_avaliacao SERIAL PRIMARY KEY,

    id_usuario INTEGER NOT NULL,
    id_produto INTEGER NOT NULL,

    nota INTEGER NOT NULL
        CHECK (nota BETWEEN 1 AND 5),

    comentario TEXT,

    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_avaliacao_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios(id_usuario)
        ON DELETE CASCADE,

    CONSTRAINT fk_avaliacao_produto
        FOREIGN KEY (id_produto)
        REFERENCES produtos(id_produto)
        ON DELETE CASCADE,

    CONSTRAINT usuario_produto_unico
        UNIQUE (id_usuario, id_produto)
);



CREATE INDEX idx_produtos_categoria
ON produtos(id_categoria);

CREATE INDEX idx_produtos_nome
ON produtos(nome);

CREATE INDEX idx_pedidos_usuario
ON pedidos(id_usuario);

CREATE INDEX idx_itens_pedido
ON itens_pedido(id_pedido);

CREATE INDEX idx_avaliacoes_produto
ON avaliacoes(id_produto);
