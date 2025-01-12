const fastify = require('fastify')({ logger: true });
const fastifyCors = require('@fastify/cors');
const helmet = require('@fastify/helmet');

const websocket = require('@fastify/websocket');
const jwt = require('@fastify/jwt');
const errorHandler = require('./middleware/errorHandlerMiddleware');
fastify.register(helmet);
fastify.register(fastifyCors, { origin: '*' });
fastify.register(websocket);
fastify.register(jwt, { secret: 'your-secure-secret' });

fastify.register(require('./routes/authRouter'));
fastify.register(require('./routes/messageRouter'));


fastify.register(require('./routes/websocketRouter'));
fastify.setErrorHandler(errorHandler);

module.exports = fastify;