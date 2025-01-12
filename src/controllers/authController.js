const bcrypt = require('bcrypt');
const { createUser, findUserByUsername } = require('../repositories/userRepository');
const { ValidationError, AuthenticationError } = require('../utils/errors');

const registerUser = async (req, reply) => {
    const { username, password } = req.body;
    const logger = req.log;
    try {
        logger.info({ username }, 'Attempting to register user');
        const hashedPassword = await bcrypt.hash(password, 10);
        logger.debug({ username }, 'Password hashed successfully');
        await createUser(username, hashedPassword);
        logger.info({ username }, 'User registered successfully');
        reply.send({ message: 'User registered successfully' });
    } catch (error) {
        logger.error({ username, error: error.message }, 'Failed to register user');
        throw new ValidationError('Failed to register user');
    }
};

const loginUser = async (req, reply) => {
    const { username, password } = req.body;
    const logger = req.log;
    try {
        logger.info({ username }, 'Attempting to log in user');
        const user = await findUserByUsername(username);
        if (!user) {
            logger.warn({ username }, 'User not found during login attempt');
            throw new AuthenticationError('Invalid credentials');
        }
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            logger.warn({ username }, 'Invalid password provided');
            throw new AuthenticationError('Invalid credentials');
        }
        const token = await reply.jwtSign({ username });
        logger.info({ username }, 'User logged in successfully');
        reply.send({ token });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            logger.warn({ username, error: error.message }, 'Authentication failed');
            throw error;
        }
        logger.error({ username, error: error.message }, 'Failed to log in user');
        throw new ValidationError('Failed to log in');
    }
};

module.exports = { registerUser, loginUser };