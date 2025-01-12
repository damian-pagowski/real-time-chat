const { handleTypingIndicator } = require('../../controllers/typingIndicatorController');
const { typingMessageSchema } = require('../../schemas/webSocketSchemas');
const { sendMessage } = require('../../utils/socketUtils');
const { ValidationError } = require('../../utils/errors');
const validateWebSocketMessage = require('../../middleware/webSocketMessageValidationMiddleware');

jest.mock('../../utils/socketUtils');
jest.mock('../../middleware/webSocketMessageValidationMiddleware');

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
};
describe('handleTypingIndicator', () => {
    let socket, users, groups, username;

    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterAll(() => {
        console.error.mockRestore();
    });

    beforeEach(() => {
        jest.clearAllMocks();
        socket = { send: jest.fn() };
        users = new Map();
        groups = new Map();
        username = 'user1';
    });

    test('should notify recipient about typing status', () => {
        const message = JSON.stringify({
            status: 'typing',
            recipient: 'user2',
        });

        validateWebSocketMessage.mockReturnValue(() => ({
            status: 'typing',
            recipient: 'user2',
        }));

        const recipientSocket = { send: jest.fn() };
        users.set('user2', recipientSocket);

        handleTypingIndicator(message, username, socket, users, groups, mockLogger);

        expect(validateWebSocketMessage).toHaveBeenCalledWith(typingMessageSchema);
        expect(sendMessage).toHaveBeenCalledWith(recipientSocket, {
            type: 'typing',
            sender: username,
            status: 'typing',
        });
    });

    test('should notify group members about typing status', () => {
        const message = JSON.stringify({
            status: 'typing',
            group: 'group1',
        });

        validateWebSocketMessage.mockReturnValue(() => ({
            status: 'typing',
            group: 'group1',
        }));

        const recipientSocket1 = { send: jest.fn() };
        const recipientSocket2 = { send: jest.fn() };

        groups.set('group1', new Set(['user2', 'user3']));
        users.set('user2', recipientSocket1);
        users.set('user3', recipientSocket2);

        handleTypingIndicator(message, username, socket, users, groups, mockLogger);

        expect(validateWebSocketMessage).toHaveBeenCalledWith(typingMessageSchema);
        const expectedMessage = {
            type: 'typing',
            sender: username,
            group: 'group1',
            status: 'typing',
        };
        expect(sendMessage).toHaveBeenCalledWith(recipientSocket1, expectedMessage);
        expect(sendMessage).toHaveBeenCalledWith(recipientSocket2, expectedMessage);

    });

    test('should throw ValidationError if group does not exist', () => {
        const message = JSON.stringify({
            status: 'typing',
            group: 'invalidGroup',
        });

        validateWebSocketMessage.mockReturnValue(() => ({
            status: 'typing',
            group: 'invalidGroup',
        }));

        handleTypingIndicator(message, username, socket, users, groups, mockLogger);

        expect(sendMessage).toHaveBeenCalledWith(socket, {
            error: 'Group "invalidGroup" does not exist',
        });
    });

    test('should handle invalid message format with ValidationError', () => {
        const message = 'invalid JSON';

        handleTypingIndicator(message, username, socket, users, groups, mockLogger);

        expect(sendMessage).toHaveBeenCalledWith(socket, {
            error: 'Failed to process typing indicator',
            details: expect.any(String),
        });
    });

    test('should log and send error for unexpected errors', () => {
        const message = JSON.stringify({
            status: 'typing',
            recipient: 'user2',
        });

        validateWebSocketMessage.mockImplementation(() => {
            throw new Error('Unexpected error');
        });

        handleTypingIndicator(message, username, socket, users, groups, mockLogger);

        expect(sendMessage).toHaveBeenCalledWith(socket, {
            error: 'Failed to process typing indicator',
            details: 'Unexpected error',
        });
    });
});