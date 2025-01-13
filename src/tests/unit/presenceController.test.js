const {broadcastPresence } = require('../../controllers/presenceController');

describe('broadcastPresence', () => {
    let users;
    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
    };
    beforeEach(() => {
        users = new Map();
        users.set('user1', { send: jest.fn() });
        users.set('user2', { send: jest.fn() });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should broadcast presence to all connected users', () => {
        const username = 'testUser';
        const status = 'online';

        broadcastPresence(users, username, status, mockLogger);

        const expectedMessage = JSON.stringify({
            type: 'presence',
            user: username,
            status,
        });

        users.forEach((socket) => {
            expect(socket.send).toHaveBeenCalledWith(expectedMessage);
        });
    });

    test('should not throw error if users map is empty', () => {
        users = new Map();
        const username = 'testUser';
        const status = 'online';

        expect(() => broadcastPresence(users, username, status, mockLogger)).not.toThrow();
    });
});