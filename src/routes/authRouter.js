const { createUser, findUserByUsername } = require('../db/users');
const { ValidationError } = require('../utils/errors');
const validate = require('../middleware/validationMiddleware'); 
const { registerSchema, loginSchema } = require('../schemas/authSchemas');


module.exports = async (fastify) => {
  fastify.post(
    '/register',
    { preHandler: validate(registerSchema) }, 
    async (req, reply) => {
      const { username, password } = req.body;
      createUser(username, password);
      reply.send({ message: 'User registered successfully' });
    }
  );

  fastify.post(
    '/login',
    { preHandler: validate(loginSchema) },
    async (req, reply) => {
      const { username, password } = req.body;
      const user = findUserByUsername(username);
      if (!user) {
        throw new ValidationError('Invalid credentials', 401);
      }
      const token = fastify.jwt.sign({ username });
      reply.send({ token });
    }
  );
};