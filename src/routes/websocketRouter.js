const { handleWebSocketConnection } = require('../handlers/webSocketHandler');
const { ServerError } = require('../utils/errors');
const authenticationMiddleware = require('../middleware/authenticationMiddleware');

module.exports = async (fastify) => {
    const users = new Map();
    const groups = new Map();

    fastify.get('/ws', { websocket: true }, (socket, req) => {
        handleWebSocketConnection(
            socket,
            req,
            users,
            groups,
            fastify.jwt.verify.bind(fastify.jwt)
        );
    });

    fastify.get('/users/active', { preHandler: authenticationMiddleware }, async (req, reply) => {
        try {
            const activeUsers = Array.from(users.keys());
            reply.send(activeUsers);
        } catch (error) {
            throw new ServerError('Failed to fetch active users');
        }
    });
};