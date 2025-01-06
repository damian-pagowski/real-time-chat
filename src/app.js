const fastify = require('fastify')({ logger: true });
const websocket = require('@fastify/websocket');
const jwt = require('@fastify/jwt');

fastify.register(websocket);
fastify.register(jwt, { secret: 'your-secure-secret' });

fastify.register(require('./routes/authRoutes'));
fastify.register(require('./routes/messageRoutes'));

fastify.register(require('./controllers/websocket'));

module.exports = fastify;