const {
    handleGroupMessage,
    handleJoinGroup,
    handleLeaveGroup,
} = require('../../controllers/groupController');
const {
    createGroup,
    findGroupByName,
    addMemberToGroup,
    removeMemberFromGroup,
    getGroupMembers,
} = require('../../repositories/groupRepository');
const { addMessage } = require('../../repositories/messageRepository');
const { sendMessage } = require('../../utils/socketUtils');
const { ValidationError } = require('../../utils/errors');
const validateWebSocketMessage = require('../../middleware/webSocketMessageValidationMiddleware');

jest.mock('../../repositories/groupRepository');
jest.mock('../../repositories/messageRepository');
jest.mock('../../utils/socketUtils');
jest.mock('../../middleware/webSocketMessageValidationMiddleware');

describe('Group Message Handlers', () => {
    let socket, users, groups;

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
        groups = new Map();
    });

    describe('handleGroupMessage', () => {
        test('should broadcast group message to all members', async () => {
            const message = JSON.stringify({ group: 'group1', text: 'Hello group!' });
            const username = 'user1';
            const groupData = { id: 1, name: 'group1' };
            const members = [{ username: 'user2' }, { username: 'user3' }];
            const users = new Map([
                ['user1', { send: jest.fn() }],
                ['user2', { send: jest.fn() }],
                ['user3', { send: jest.fn() }],
            ]);

            validateWebSocketMessage.mockImplementation(() => jest.fn(() => JSON.parse(message)));
            findGroupByName.mockResolvedValue(groupData);
            getGroupMembers.mockResolvedValue(members);
            addMessage.mockResolvedValue();

            await handleGroupMessage(message, username, socket, users, groups);

            expect(findGroupByName).toHaveBeenCalledWith('group1');
            expect(addMessage).toHaveBeenCalledWith('user1', null, 'Hello group!', 1);
            members.forEach((member) => {
                expect(sendMessage).toHaveBeenCalledWith(users.get(member.username), {
                    sender: username,
                    group: 'group1',
                    text: 'Hello group!',
                    timestamp: expect.any(Number),
                });
            });
        });

        test('should handle validation error', async () => {
            const message = JSON.stringify({});
            const username = 'user1';

            validateWebSocketMessage.mockImplementation(() => jest.fn(() => {
                throw new ValidationError('Invalid group message');
            }));

            await handleGroupMessage(message, username, socket, users, groups);

            expect(sendMessage).toHaveBeenCalledWith(socket, { error: 'Invalid group message' });
        });

        test('should handle DB Error', async () => {
            const message = JSON.stringify({});
            const username = 'user1';
            validateWebSocketMessage.mockImplementation(() => jest.fn(() => JSON.parse(message)));
            findGroupByName.mockRejectedValue(new Error('DB Error'));

            await handleGroupMessage(message, username, socket, users, groups);
            expect(sendMessage).toHaveBeenCalledWith(socket, { error: 'Failed to handle group message', details: 'DB Error' });
        });
        
    });

    describe('handleJoinGroup', () => {
        test('should create and join group if it does not exist', async () => {
            const message = JSON.stringify({ group: 'group1' });
            const username = 'user1';
            const groupData = { id: 1, name: 'group1' };

            validateWebSocketMessage.mockImplementation(() => jest.fn(() => JSON.parse(message)));
            findGroupByName.mockResolvedValue(null);
            createGroup.mockResolvedValue(groupData);
            addMemberToGroup.mockResolvedValue();

            await handleJoinGroup(message, username, socket, groups);

            expect(findGroupByName).toHaveBeenCalledWith('group1');
            expect(createGroup).toHaveBeenCalledWith('group1');
            expect(addMemberToGroup).toHaveBeenCalledWith(groupData.id, username);
            expect(sendMessage).toHaveBeenCalledWith(socket, { message: 'Joined group: group1' });
        });

        test('should handle validation error', async () => {
            const message = JSON.stringify({});
            const username = 'user1';

            validateWebSocketMessage.mockImplementation(() => jest.fn(() => {
                throw new ValidationError('Invalid join group message');
            }));

            await handleJoinGroup(message, username, socket, groups);

            expect(sendMessage).toHaveBeenCalledWith(socket, { error: 'Invalid join group message' });
        });
    });

    test('should handle DB Error', async () => {
        const message = JSON.stringify({});
        const username = 'user1';
        validateWebSocketMessage.mockImplementation(() => jest.fn(() => JSON.parse(message)));
        findGroupByName.mockRejectedValue(new Error('DB Error'));

        await handleJoinGroup(message, username, socket, groups);
        expect(sendMessage).toHaveBeenCalledWith(socket, { error: 'Failed to join group', details: 'DB Error' });
    });

    describe('handleLeaveGroup', () => {
        test('should remove user from group', async () => {
            const message = JSON.stringify({ group: 'group1' });
            const username = 'user1';
            const groupData = { id: 1, name: 'group1' };

            validateWebSocketMessage.mockImplementation(() => jest.fn(() => JSON.parse(message)));
            findGroupByName.mockResolvedValue(groupData);
            removeMemberFromGroup.mockResolvedValue();

            await handleLeaveGroup(message, username, socket, groups);

            expect(findGroupByName).toHaveBeenCalledWith('group1');
            expect(removeMemberFromGroup).toHaveBeenCalledWith(groupData.id, username);
            expect(sendMessage).toHaveBeenCalledWith(socket, { message: 'Left group: group1' });
        });

        test('should handle validation error', async () => {
            const message = JSON.stringify({});
            const username = 'user1';

            validateWebSocketMessage.mockImplementation(() => jest.fn(() => {
                throw new ValidationError('Invalid leave group message');
            }));

            await handleLeaveGroup(message, username, socket, groups);

            expect(sendMessage).toHaveBeenCalledWith(socket, { error: 'Invalid leave group message' });
        });

        test('should handle DB Error', async () => {
            const message = JSON.stringify({});
            const username = 'user1';
            validateWebSocketMessage.mockImplementation(() => jest.fn(() => JSON.parse(message)));
            findGroupByName.mockRejectedValue(new Error('DB Error'));
    
            await handleLeaveGroup(message, username, socket, groups);
            expect(sendMessage).toHaveBeenCalledWith(socket, { error: 'Failed to leave group', details: 'DB Error' });
        });

    });
});