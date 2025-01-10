const { createUser, findUserByUsername } = require('../db/users');
const { ValidationError, AuthenticationError } = require('../utils/errors');

module.exports = async (fastify) => {
  fastify.post('/register', async (req, reply) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new ValidationError('Username and password are required');
      }

      createUser(username, password);
      reply.send({ message: 'User registered successfully' });
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new Error('Failed to register user');
    }
  });

  fastify.post('/login', async (req, reply) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        throw new ValidationError('Username and password are required');
      }

      const user = findUserByUsername(username);
      if (!user) {
        throw new AuthenticationError('Invalid credentials');
      }

      const token = fastify.jwt.sign({ username });
      reply.send({ token });
    } catch (error) {
      if (error instanceof ValidationError || error instanceof AuthenticationError) {
        throw error; 
      }
      throw new Error('Failed to log in'); 
    }
  });
};