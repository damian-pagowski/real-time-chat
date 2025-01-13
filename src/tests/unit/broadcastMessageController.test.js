const { handleBroadcastMessage } = require('../../controllers/broadcastMessageController');
const { sendMessage } = require('../../utils/socketUtils');
const { ValidationError } = require('../../utils/errors');
const { broadcastMessageSchema } = require('../../schemas/webSocketSchemas');
const validateWebSocketMessage = require('../../middleware/webSocketMessageValidationMiddleware');

jest.mock('../../utils/socketUtils', () => ({
    sendMessage: jest.fn(),
}));

jest.mock('../../middleware/webSocketMessageValidationMiddleware', () => jest.fn());

describe('handleBroadcastMessage', () => {
    const socket = { send: jest.fn() };
    const users = new Map([
        ['user1', { send: jest.fn() }],
        ['user2', { send: jest.fn() }],
        ['user3', { send: jest.fn() }],
    ]);
    const mockLogger = {
        info: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
    };

    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {}); 
    });
    
    afterAll(() => {
        console.error.mockRestore(); 
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should broadcast message to all users except the sender', () => {
        const message = JSON.stringify({ text: 'Hello World' });
        const username = 'user1';
        validateWebSocketMessage.mockImplementation(() => (msg) => msg); 

        handleBroadcastMessage(message, username, socket, users, mockLogger);

        expect(validateWebSocketMessage).toHaveBeenCalledWith(broadcastMessageSchema);
        expect(sendMessage).toHaveBeenCalledTimes(3); // 2 recipients + sender confirmation
        expect(sendMessage).toHaveBeenCalledWith(users.get('user2'), expect.objectContaining({ text: 'Hello World' }));
        expect(sendMessage).toHaveBeenCalledWith(users.get('user3'), expect.objectContaining({ text: 'Hello World' }));
        expect(sendMessage).toHaveBeenCalledWith(socket, expect.objectContaining({ message: 'Broadcast sent: Hello World' }));
    });

    test('should send ValidationError if message validation fails', () => {
        const message = JSON.stringify({}); 
        const username = 'user1';
        validateWebSocketMessage.mockImplementation(() => {
            throw new ValidationError('Invalid message format');
        });

        handleBroadcastMessage(message, username, socket, users, mockLogger);

        expect(validateWebSocketMessage).toHaveBeenCalledWith(broadcastMessageSchema);
        expect(sendMessage).toHaveBeenCalledWith(socket, { error: 'Invalid message format' });
        expect(sendMessage).toHaveBeenCalledTimes(1);
    });

    test('should handle unexpected errors gracefully', () => {
        const message = JSON.stringify({ text: 'Hello World' });
        const username = 'user1';
        validateWebSocketMessage.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        handleBroadcastMessage(message, username, socket, users, mockLogger);

        expect(sendMessage).toHaveBeenCalledWith(socket, {
            error: 'Failed to broadcast message',
            details: 'Unexpected error',
        });
        expect(sendMessage).toHaveBeenCalledTimes(1); // Only sender gets error
    });
});