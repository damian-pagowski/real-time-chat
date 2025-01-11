const {
    handleDirectMessage,
    handleReadReceipt,
} = require('../../controllers/directMessageController');
const { sendMessage } = require('../../utils/socketUtils');
const {
    addMessage,
    markMessageAsRead,
    getSenderForMessage,
} = require('../../repositories/messageRepository');
const { ValidationError, ServerError } = require('../../utils/errors');
const validateWebSocketMessage = require('../../middleware/webSocketMessageValidationMiddleware');
const { directMessageSchema, readReceiptSchema } = require('../../schemas/webSocketSchemas');

jest.mock('../../utils/socketUtils');
jest.mock('../../repositories/messageRepository');
jest.mock('../../middleware/webSocketMessageValidationMiddleware');

describe('Message Handlers', () => {
    let socket, users;

    beforeAll(() => {
        jest.spyOn(console, 'error').mockImplementation(() => {}); 
    });
    
    afterAll(() => {
        console.error.mockRestore(); 
    });

    beforeEach(() => {
        jest.clearAllMocks();
        socket = { send: jest.fn() };
        users = new Map();
        users.set('recipientUser', { send: jest.fn() });
    });

    describe('handleDirectMessage', () => {
        test('should send a direct message to the recipient', async () => {
            const message = JSON.stringify({
                recipient: 'recipientUser',
                text: 'Hello!',
            });
            const username = 'senderUser';
            const savedMessage = { id: 1 };

            validateWebSocketMessage.mockImplementation(() => jest.fn(() => JSON.parse(message)));
            addMessage.mockResolvedValue(savedMessage);

            await handleDirectMessage(message, username, socket, users);

            expect(addMessage).toHaveBeenCalledWith(username, 'recipientUser', 'Hello!');
            expect(sendMessage).toHaveBeenCalledWith(users.get('recipientUser'), {
                sender: username,
                text: 'Hello!',
                messageId: savedMessage.id,
                timestamp: expect.any(Number),
                type: 'direct',
            });
        });

        test('should handle recipient not connected', async () => {
            const message = JSON.stringify({
                recipient: 'disconnectedUser',
                text: 'Hello!',
            });
            const username = 'senderUser';

            validateWebSocketMessage.mockImplementation(() => jest.fn(() => JSON.parse(message)));

            await handleDirectMessage(message, username, socket, users);

            expect(sendMessage).toHaveBeenCalledWith(socket, {
                error: 'User disconnectedUser is not connected',
            });
        });

        test('should handle validation error', async () => {
            const message = JSON.stringify({ recipient: 'recipientUser' });
            const username = 'senderUser';

            validateWebSocketMessage.mockImplementation(() => jest.fn(() => {
                throw new ValidationError('Direct message must include a valid "text" field');
            }));

            await handleDirectMessage(message, username, socket, users);

            expect(sendMessage).toHaveBeenCalledWith(socket, {
                error: 'Direct message must include a valid "text" field',
            });
        });

        test('should handle server error', async () => {
            const message = JSON.stringify({
                recipient: 'recipientUser',
                text: 'Hello!',
            });
            const username = 'senderUser';

            validateWebSocketMessage.mockImplementation(() => jest.fn(() => JSON.parse(message)));
            addMessage.mockRejectedValue(new Error('Database Error'));

            await expect(handleDirectMessage(message, username, socket, users)).rejects.toThrow(ServerError);

            expect(sendMessage).not.toHaveBeenCalledWith(users.get('recipientUser'), expect.any(Object));
        });
    });

    describe('handleReadReceipt', () => {
        test('should notify sender about read receipt', async () => {
            const message = JSON.stringify({ messageId: 1 });
            const username = 'readerUser';
            const senderUser = { username: 'senderUser' };
            users.set('senderUser', { send: jest.fn() });

            validateWebSocketMessage.mockImplementation(() => jest.fn(() => JSON.parse(message)));
            getSenderForMessage.mockResolvedValue(senderUser);

            await handleReadReceipt(message, username, socket, users);

            expect(markMessageAsRead).toHaveBeenCalledWith(1);
            expect(sendMessage).toHaveBeenCalledWith(users.get('senderUser'), {
                type: 'readReceipt',
                messageId: 1,
                reader: username,
            });
        });

        test('should handle sender not connected', async () => {
            const message = JSON.stringify({ messageId: 1 });
            const username = 'readerUser';

            validateWebSocketMessage.mockImplementation(() => jest.fn(() => JSON.parse(message)));
            getSenderForMessage.mockResolvedValue({ username: 'disconnectedUser' });

            await handleReadReceipt(message, username, socket, users);

            expect(markMessageAsRead).toHaveBeenCalledWith(1);
            expect(sendMessage).not.toHaveBeenCalledWith(users.get('disconnectedUser'), expect.any(Object));
        });

        test('should handle validation error', async () => {
            const message = JSON.stringify({});
            const username = 'readerUser';

            validateWebSocketMessage.mockImplementation(() => jest.fn(() => {
                throw new ValidationError('Read receipt must include a valid "messageId" field');
            }));

            await handleReadReceipt(message, username, socket, users);

            expect(sendMessage).toHaveBeenCalledWith(socket, {
                error: 'Read receipt must include a valid "messageId" field',
            });
        });

        test('should handle server error', async () => {
            const message = JSON.stringify({ messageId: 1 });
            const username = 'readerUser';

            validateWebSocketMessage.mockImplementation(() => jest.fn(() => JSON.parse(message)));
            getSenderForMessage.mockRejectedValue(new Error('Database Error'));

            await expect(handleReadReceipt(message, username, socket, users)).rejects.toThrow(ServerError);

            expect(sendMessage).not.toHaveBeenCalledWith(users.get('senderUser'), expect.any(Object));
        });
    });
});