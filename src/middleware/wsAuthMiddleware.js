const jwt = require('@fastify/jwt');
const { AuthenticationError } = require('../utils/errors');


const wsAuthMiddleware = async (req, socket, next) => {
    try {
        const token = req.query?.token;

        if (!token) {
            throw new AuthenticationError('Token is required for WebSocket authentication');
        }

        const user = await req.server.jwt.verify(token); 
        req.user = user;
        next();
    } catch (error) {
        req.log.error({ error: error.message }, 'WebSocket authentication failed');
        socket.close(4001, 'Unauthorized');
    }
};

module.exports = wsAuthMiddleware;