const { handleWebSocketConnection } = require('../handlers/webSocketHandler')
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

    fastify.get('/users/active', async (req, reply) => {
        try {
            const activeUsers = Array.from(users.keys());
            reply.send(activeUsers);
        } catch (error) {
            console.error('Error fetching active users:', error);
            reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

};