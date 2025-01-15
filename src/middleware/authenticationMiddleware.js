const { AuthenticationError } = require('../utils/errors');

const authenticationMiddleware = async (req, reply) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new AuthenticationError('Authorization header is missing');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new AuthenticationError('Bearer token is missing');
    }

    const decoded = req.server.jwt.verify(token);

    if (!decoded || !decoded.username || !decoded.role) {
      throw new AuthenticationError('Invalid token payload');
    }

    req.user = { username: decoded.username, role: decoded.role };
  } catch (error) {
    if (error.message === 'jwt expired') {
      throw new AuthenticationError('Token expired');
    }
    throw new AuthenticationError('Invalid token');
  }
};

module.exports = authenticationMiddleware;