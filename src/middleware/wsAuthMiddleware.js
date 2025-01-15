const jwt = require('@fastify/jwt');
const { AuthenticationError } = require('../utils/errors');


const wsAuthMiddleware = async (req, socket, next) => {
    try {
        const token = req.query?.token;

        if (!token) {
            throw new AuthenticationError('Token is required for WebSocket authentication');
        }

        const decoded = req.server.jwt.verify(token);

        if (!decoded || !decoded.username || !decoded.role) {
          throw new AuthenticationError('Invalid token payload');
        }
        req.user = { username: decoded.username, role: decoded.role };
        next();
    } catch (error) {
        req.log.error({ error: error.message }, 'WebSocket authentication failed');
        socket.close(4001, 'Unauthorized');
    }
};

module.exports = wsAuthMiddleware;