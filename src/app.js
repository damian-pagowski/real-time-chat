const fastify = require('fastify')({ logger: true });
const fastifyCors = require('@fastify/cors');

const websocket = require('@fastify/websocket');
const jwt = require('@fastify/jwt');
const errorHandler = require('./middleware/errorHandler');

fastify.register(fastifyCors, { origin: '*' });
fastify.register(websocket);
fastify.register(jwt, { secret: 'your-secure-secret' });

fastify.register(require('./routes/authRoutes'));
fastify.register(require('./routes/messageRoutes'));


fastify.register(require('./routes/websocketRouter'));
fastify.setErrorHandler(errorHandler);

module.exports = fastify;