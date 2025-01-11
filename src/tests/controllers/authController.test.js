const bcrypt = require('bcrypt');
const { loginUser, registerUser } = require('../../controllers/authController');
const { createUser, findUserByUsername } = require('../../repositories/userRepository');
const { ValidationError , AuthenticationError} = require('../../utils/errors');

jest.mock('bcrypt');
jest.mock('../../repositories/userRepository');

describe('registerUser', () => {
    const reply = { send: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should hash the password and create a user', async () => {
        const req = { body: { username: 'testuser', password: 'testpassword' } };
        bcrypt.hash.mockResolvedValue('hashedPassword');
        createUser.mockResolvedValue();

        await registerUser(req, reply);

        expect(bcrypt.hash).toHaveBeenCalledWith("testpassword", 10);
        expect(createUser).toHaveBeenCalledWith("testuser", "hashedPassword");
        expect(reply.send).toHaveBeenCalledWith({ "message": "User registered successfully" });
    });

    test('should throw ValidationError if createUser fails', async () => {
        const req = { body: { username: "testuser", password: "testpassword" } };
        bcrypt.hash.mockResolvedValue('hashedPassword');
        createUser.mockRejectedValue(new Error('DB Error'));
        await expect(registerUser(req, reply)).rejects.toThrow(ValidationError);
    });
});


describe('loginUser', () => {


    const reply = { send: jest.fn(), jwtSign: jest.fn() };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return a token for valid credentials', async () => {
        const req = { body: { username: 'testuser', password: 'testpassword' } };
        findUserByUsername.mockResolvedValue({ username: 'testuser', password: 'hashedpassword' });
        bcrypt.compare.mockResolvedValue(true);
        reply.jwtSign.mockResolvedValue("faketoken");

        await loginUser(req, reply);

        expect(findUserByUsername).toHaveBeenCalledWith("testuser");
        expect(bcrypt.compare).toHaveBeenCalledWith("testpassword", "hashedpassword");
        expect(reply.jwtSign).toHaveBeenCalledWith({"username": "testuser"});
        expect(reply.send).toHaveBeenCalledWith({ "token":  "faketoken" });
    });

    test('should throw ValidationError if findUserByUsername returns no user', async () => {
        const req = { body: { username: "testuser", password: "testpassword" } };
        findUserByUsername.mockResolvedValue(null);
        await expect(loginUser(req, reply)).rejects.toThrow(AuthenticationError);
    });

    test('should throw AuthenticationError if password is invalid', async () => {
        const req = { body: { username: "testuser", password: "invalidPassword" } };
        findUserByUsername.mockResolvedValue({ username: 'testuser', password: 'hashedpassword' });
        bcrypt.compare.mockResolvedValue(false);
        await expect(loginUser(req, reply)).rejects.toThrow(AuthenticationError);
    });

    test('should throw ValidationError if token fails signing', async () => {
        const req = { body: { username: "testuser", password: "testpassword" } };
        findUserByUsername.mockResolvedValue({ username: 'testuser', password: 'hashedpassword' });
        bcrypt.compare.mockResolvedValue(true);
        reply.jwtSign.mockRejectedValue(new Error('JWT Error'));
        await expect(loginUser(req, reply)).rejects.toThrow(ValidationError);
    });
});