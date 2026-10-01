require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const pool = require('./config/database');

async function start() {
  await fastify.register(cors, { origin: true });
  fastify.get('/', async () => ({ nome: 'Music Archive API', status: 'online' }));
  fastify.get('/teste-banco', async (request, reply) => {
    try {
      const r = await pool.query('SELECT NOW() AS horario');
      return { conectado: true, horario: r.rows[0].horario };
    } catch (e) {
      request.log.error(e);
      return reply.code(500).send({ conectado: false, erro: 'Falha na conexão com PostgreSQL.' });
    }
  });
  for (const route of ['produtos','categorias','usuarios','instrumentos','vinis','enderecos','pedidos','avaliacoes','pagamentos']) {
    await fastify.register(require(`./routes/${route}`));
  }
  try {
    await fastify.listen({ port: Number(process.env.PORT || 3000), host: '0.0.0.0' });
  } catch (e) { fastify.log.error(e); process.exit(1); }
}
start();
