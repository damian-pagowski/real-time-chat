const { createUser, findUserByUsername } = require('../db/users');

module.exports = async (fastify) => {
  fastify.post('/register', async (req, reply) => {
    const { username, password } = req.body;
    createUser(username, password);
    reply.send({ message: 'User registered successfully' });
  });

  fastify.post('/login', async (req, reply) => {
    const { username } = req.body;
    const user = findUserByUsername(username);
    if (!user) {
      reply.status(401).send({ error: 'Invalid credentials' });
      return;
    }
    const token = fastify.jwt.sign({ username });
    reply.send({ token });
  });
};