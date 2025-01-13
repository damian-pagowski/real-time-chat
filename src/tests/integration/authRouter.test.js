const fastify = require('../../app');
const { createUser, findUserByUsername } = require('../../repositories/userRepository');
const bcrypt = require('bcrypt');
jest.mock('../../repositories/userRepository');
jest.mock('bcrypt');

describe('Auth Router Tests with Mocked Database', () => {
    let mockFastify;

    beforeAll(async () => {
        mockFastify = fastify;
        await mockFastify.ready();
    });

    afterAll(async () => {
        if (mockFastify) {
            await mockFastify.close();
        }
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /register', () => {
        test('should successfully register a user', async () => {
            bcrypt.hash.mockResolvedValue('hashedPassword');
            createUser.mockResolvedValue();

            const response = await mockFastify.inject({
                method: 'POST',
                url: '/register',
                payload: {
                    username: 'testuser',
                    password: 'testpassword',
                },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toEqual({ message: 'User registered successfully' });
            expect(bcrypt.hash).toHaveBeenCalledWith('testpassword', 10);
            expect(createUser).toHaveBeenCalledWith('testuser', 'hashedPassword');
        });

        test('should return validation error if payload is invalid', async () => {
            const response = await mockFastify.inject({
                method: 'POST',
                url: '/register',
                payload: {
                    username: '', 
                    password: 'testpassword',
                },
            });

            expect(response.statusCode).toBe(400);
            expect(response.json()).toHaveProperty('error');
        });

        test('should return server error if user creation fails', async () => {
            bcrypt.hash.mockResolvedValue('hashedPassword');
            createUser.mockRejectedValue(new Error('Database error'));

            const response = await mockFastify.inject({
                method: 'POST',
                url: '/register',
                payload: {
                    username: 'testuser',
                    password: 'testpassword',
                },
            });

            expect(response.statusCode).toBe(500); 
            expect(response.json()).toHaveProperty('message', 'Failed to register user');
        });
    });

    describe('POST /login', () => {
        test('should return a token for valid credentials', async () => {
            const hashedPassword = 'hashedPassword';
            findUserByUsername.mockResolvedValue({ username: 'testuser', password: hashedPassword });
            bcrypt.compare.mockResolvedValue(true);

            const response = await mockFastify.inject({
                method: 'POST',
                url: '/login',
                payload: {
                    username: 'testuser',
                    password: 'testpassword',
                },
            });

            expect(response.statusCode).toBe(200);
            expect(response.json()).toHaveProperty('token');
            expect(findUserByUsername).toHaveBeenCalledWith('testuser');
            expect(bcrypt.compare).toHaveBeenCalledWith('testpassword', hashedPassword);
        });

        test('should return authentication error for invalid credentials', async () => {
            findUserByUsername.mockResolvedValue(null); 

            const response = await mockFastify.inject({
                method: 'POST',
                url: '/login',
                payload: {
                    username: 'testuser',
                    password: 'testpassword',
                },
            });

            expect(response.statusCode).toBe(401); 
            expect(response.json()).toHaveProperty('message', 'Invalid credentials');
        });
    });
});