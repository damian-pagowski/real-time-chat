const validate = require('../middleware/validationMiddleware'); 
const { registerSchema, loginSchema } = require('../schemas/authSchemas');
const { registerUser, loginUser } = require('../controllers/authController');


module.exports = async (fastify) => {
  fastify.post(
    '/register',
    { preHandler: validate(registerSchema) },
    registerUser
  );

  fastify.post(
    '/login',
    { preHandler: validate(loginSchema) },
    loginUser
  );
};