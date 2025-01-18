const fp = require('fastify-plugin');
const client = require('prom-client');

const metricsPlugin = async (fastify, options) => {
  // Enable default metrics collection
  client.collectDefaultMetrics();

  // Custom HTTP request duration metric
  const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
  });

  // Hook to start the timer
  fastify.addHook('onRequest', async (request, reply) => {
    request.startTimer = httpRequestDuration.startTimer();
  });

  // Hook to stop the timer and record metrics
  fastify.addHook('onResponse', async (request, reply) => {
    if (request.startTimer) {
      request.startTimer({
        method: request.method,
        route: request.routerPath || 'unknown_route',
        status_code: reply.statusCode,
      });
    }
  });

  // Metrics endpoint
  fastify.get('/metrics', async (req, reply) => {
    reply.header('Content-Type', client.register.contentType);
    reply.send(await client.register.metrics());
  });
};

module.exports = fp(metricsPlugin);