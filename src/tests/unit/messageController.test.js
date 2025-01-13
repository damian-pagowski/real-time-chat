const {
    getDirectMessages,
    getGroupMessages,
    getUserConversationsNames,
} = require('../../controllers/messageController');

const {
    getMessagesBetweenUsers,
    getMessagesForGroup,
    getConversationUsernames,
} = require('../../repositories/messageRepository');

const { ServerError } = require('../../utils/errors');

jest.mock('../../repositories/messageRepository');

const mockLogger = {
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
};

describe('Message Controller', () => {
    let req, reply;

    beforeEach(() => {
        jest.clearAllMocks();
        reply = { send: jest.fn() };
    });

    describe('getDirectMessages', () => {
        test('should fetch messages between two users', async () => {
            req = { query: { user1: 'user1', user2: 'user2' }, log: mockLogger };
            const mockMessages = [{ id: 1, text: 'Hello' }];
            getMessagesBetweenUsers.mockResolvedValue(mockMessages);

            await getDirectMessages(req, reply);

            expect(getMessagesBetweenUsers).toHaveBeenCalledWith('user1', 'user2');
            expect(reply.send).toHaveBeenCalledWith(mockMessages);
        });

        test('should throw ServerError on failure', async () => {
            req = { query: { user1: 'user1', user2: 'user2' }, log: mockLogger };

            getMessagesBetweenUsers.mockRejectedValue(new Error('Database error'));

            await expect(getDirectMessages(req, reply)).rejects.toThrow(ServerError);
        });
    });

    describe('getGroupMessages', () => {
        test('should fetch messages for a group', async () => {
            req = { params: { groupId: '1' }, log: mockLogger };
            const mockMessages = [{ id: 1, text: 'Group message' }];
            getMessagesForGroup.mockResolvedValue(mockMessages);

            await getGroupMessages(req, reply);

            expect(getMessagesForGroup).toHaveBeenCalledWith(1);
            expect(reply.send).toHaveBeenCalledWith(mockMessages);
        });

        test('should throw ServerError on failure', async () => {
            req = { params: { groupId: '1' }, log: mockLogger };
            getMessagesForGroup.mockRejectedValue(new Error('Database error'));

            await expect(getGroupMessages(req, reply)).rejects.toThrow(ServerError);
        });
    });

    describe('getUserConversationsNames', () => {
        test('should fetch conversation usernames for a user', async () => {
            req = { query: { user: 'user1' }, log: mockLogger };
            const mockConversations = ['user2', 'user3'];
            getConversationUsernames.mockResolvedValue(mockConversations);

            await getUserConversationsNames(req, reply);

            expect(getConversationUsernames).toHaveBeenCalledWith('user1');
            expect(reply.send).toHaveBeenCalledWith(mockConversations);
        });

        test('should throw ServerError on failure', async () => {
            req = { query: { user: 'user1' }, log: mockLogger };
            getConversationUsernames.mockRejectedValue(new Error('Database error'));

            await expect(getUserConversationsNames(req, reply)).rejects.toThrow(ServerError);
        });
    });
});