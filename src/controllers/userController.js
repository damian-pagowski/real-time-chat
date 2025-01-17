const bcrypt = require('bcryptjs');
const { createUser, findUserByUsername, deleteUserByUsername } = require('../repositories/userRepository');
const { ServerError, AuthenticationError, ConflictError, NotFoundError } = require('../utils/errors');

const registerUser = async (req, reply) => {
    const { username, password } = req.body;
    const logger = req.log;
    try {
        logger.info({ username }, 'Attempting to register user');
        const user = await findUserByUsername(username);
        if (user) {
            logger.warn({ username }, 'User not found during login attempt');
            throw new ConflictError('Username taken');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        logger.debug({ username }, 'Password hashed successfully');
        await createUser(username, hashedPassword);
        logger.info({ username }, 'User registered successfully');
        reply.send({ message: 'User registered successfully' });
    } catch (error) {
        logger.error({ username, error: error.message }, 'Failed to register user');
        if (error instanceof ConflictError) {
            throw error
        }
        throw new ServerError('Failed to register user');
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
        const token = await reply.jwtSign({ username, role: user.role });
        logger.info({ username }, 'User logged in successfully');
        reply.send({ token });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            logger.warn({ username, error: error.message }, 'Authentication failed');
            throw error;
        }
        logger.error({ username, error: error.message }, 'Failed to log in user');
        throw new ServerError('Failed to log in');
    }
};

const deleteUser = async (req, reply) => {
    const { username } = req.params;
    const logger = req.log;

    try {
        const user = await findUserByUsername(username);
        if (!user) {
            logger.warn({ username }, 'User not found');
            throw new NotFoundError(`User ${username} not found`);
        }
        logger.info({ username }, 'Attempting to delete user');
        await deleteUserByUsername(username);
        logger.info({ username }, 'User deleted successfully');
        reply.send({ message: `User ${username} deleted successfully` });
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        logger.error({ username, error: error.message }, 'Failed to delete user');
        throw new ServerError('Failed to delete user');
    }
};

const getUserInfo = async (req, reply) => {
    const { username } = req.params;
    const logger = req.log;

    try {
        logger.info({ username }, 'Fetching user information');
        const user = await findUserByUsername(username);

        if (!user) {
            logger.warn({ username }, 'User not found');
            throw new NotFoundError(`User ${username} not found`);
        }

        const { password, ...userInfo } = user;
        reply.send(userInfo);
    } catch (error) {
        logger.error({ username, error: error.message }, 'Failed to fetch user information');
        throw new ServerError('Failed to fetch user information');
    }
};

module.exports = { registerUser, loginUser, deleteUser, getUserInfo };