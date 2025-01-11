const bcrypt = require('bcrypt');
const { createUser, findUserByUsername } = require('../repositories/userRepository');
const { ValidationError, AuthenticationError } = require('../utils/errors');

const registerUser = async (req, reply) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await createUser(username, hashedPassword);
        reply.send({ message: 'User registered successfully' });
    } catch (error) {
        throw new ValidationError('Failed to register user');
    }
};

const loginUser = async (req, reply) => {
    const { username, password } = req.body;
    try {
        const user = await findUserByUsername(username);

        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new AuthenticationError('Invalid credentials');
        }
        const token = await reply.jwtSign({ username });
        reply.send({ token });
    } catch (error) {
        if (error instanceof AuthenticationError) {
            throw error;
        }
        throw new ValidationError('Failed to log in');
    }
};

module.exports = { registerUser, loginUser };