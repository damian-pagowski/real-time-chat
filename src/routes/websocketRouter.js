const { handleWebSocketConnection } = require('../handlers/webSocketHandler');
const { ServerError } = require('../utils/errors');
const authenticationMiddleware = require('../middleware/authenticationMiddleware');
const wsAuthMiddleware = require('../middleware/wsAuthMiddleware');

module.exports = async (fastify) => {
    const users = new Map();
    const groups = new Map();

    fastify.get('/ws', { websocket: true }, async (socket, req) => {
        try {
            await wsAuthMiddleware(req, socket, () => {
                const username = req.user.username;
                fastify.log.info(`WebSocket connection established for user: ${username} from IP: ${req.ip}`);

                handleWebSocketConnection(
                    socket,
                    username,
                    users,
                    groups,
                    fastify.log
                );
            });
        } catch (error) {
            fastify.log.error({ error }, 'WebSocket authentication failed');
            socket.close(4001, 'Unauthorized');
        }
    });

    fastify.get('/users/active', { preHandler: authenticationMiddleware }, async (req, reply) => {
        try {
            const activeUsers = Array.from(users.keys());
            fastify.log.info(`Active users requested by: ${req.user}, count: ${activeUsers.length}`);
            reply.send(activeUsers);
        } catch (error) {
            fastify.log.error({ error }, 'Failed to fetch active users');
            throw new ServerError('Failed to fetch active users');
        }
    });
    setInterval(() => {
        fastify.log.info(`Current active users: ${users.size}, Groups: ${groups.size}`);
    }, 60000);
};