const db = require('../config/database');
const bcrypt = require('bcrypt');

module.exports = async app => {
  app.get('/usuarios', async () => {
    const r = await db.query(
      'SELECT id_usuario,nome,email,telefone,cpf,data_cadastro FROM usuarios ORDER BY id_usuario'
    );
    return r.rows;
  });

  app.post('/usuarios', async (req, rep) => {
    const { nome, email, senha, telefone = null, cpf = null } = req.body || {};
    if (!nome || !email || !senha) {
      return rep.code(400).send({ erro: 'nome, email e senha são obrigatórios' });
    }

    try {
      const hash = await bcrypt.hash(senha, 10);
      const r = await db.query(
        'INSERT INTO usuarios(nome,email,senha,telefone,cpf) VALUES($1,$2,$3,$4,$5) RETURNING id_usuario,nome,email,telefone,cpf',
        [nome, email, hash, telefone, cpf]
      );
      return rep.code(201).send(r.rows[0]);
    } catch (e) {
      return rep.code(400).send({ erro: 'Email/CPF já cadastrado ou dados inválidos' });
    }
  });

  app.post('/login', async (req, rep) => {
    const { email, senha } = req.body || {};

    if (!email || !senha) {
      return rep.code(400).send({ erro: 'E-mail e senha são obrigatórios.' });
    }

    try {
      const result = await db.query(
        'SELECT id_usuario,nome,email,senha,telefone,cpf FROM usuarios WHERE LOWER(email)=LOWER($1) LIMIT 1',
        [email]
      );
      const user = result.rows[0];

      if (!user || !(await bcrypt.compare(senha, user.senha))) {
        return rep.code(401).send({ erro: 'E-mail ou senha inválidos.' });
      }

      return {
        id_usuario: user.id_usuario,
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        cpf: user.cpf
      };
    } catch (e) {
      req.log.error(e);
      return rep.code(500).send({ erro: 'Erro ao realizar login.' });
    }
  });
};
