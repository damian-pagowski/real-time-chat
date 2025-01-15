const validate = require('../middleware/requestValidationMiddleware');
const { registerSchema, loginSchema } = require('../schemas/authSchemas');
const { registerUser, loginUser, deleteUser, getUserInfo } = require('../controllers/userController');
const authenticationMiddleware = require('../middleware/authenticationMiddleware');
const authorizeAdminMiddleware = require('../middleware/authorizeAdminMiddleware');


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

  fastify.delete(
    '/users/:username',
    {
      preHandler: [authenticationMiddleware, authorizeAdminMiddleware],
    },
    deleteUser
  );

  fastify.get(
    '/users/:username',
    { preHandler: authenticationMiddleware },
    getUserInfo
  );

};