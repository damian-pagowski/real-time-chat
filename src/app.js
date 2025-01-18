const fastify = require('fastify')({ logger: true });
const fastifyCors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const websocket = require('@fastify/websocket');
const jwt = require('@fastify/jwt');
const errorHandler = require('./middleware/errorHandlerMiddleware');
const metricsPlugin = require('./plugins/metrics');
// security
fastify.register(helmet);
fastify.register(fastifyCors, { origin: '*' });
fastify.register(websocket);
//auth
const jwtSecret = process.env.JWT_SECRET || 'your-secure-secret';
fastify.register(jwt, { secret: jwtSecret });
// app routes
fastify.register(require('./routes/userRouter'));
fastify.register(require('./routes/messageRouter'));
fastify.register(require('./routes/websocketRouter'));
// metrics
fastify.register(metricsPlugin);
// health
fastify.get('/health', async (req, reply) => {
    return { status: 'ok' };
});

fastify.setErrorHandler(errorHandler);

module.exports = fastify;