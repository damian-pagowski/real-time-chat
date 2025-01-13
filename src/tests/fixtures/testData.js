module.exports = {
    testUsers: [
        { username: 'testuser1', password: 'password123' },
        { username: 'testuser2', password: 'password456' },
    ],
    testTokens: {},
    testMessages: [
        {
            text: 'Hello from user1 to user2!',
            senderUsername: 'testuser1',
            recipientUsername: 'testuser2',
        },
        {
            text: 'Hello back from user2 to user1!',
            senderUsername: 'testuser2',
            recipientUsername: 'testuser1',
        },
    ],
    testGroups: [
        { name: 'testgroup1', members: ['testuser1', 'testuser2'] },
    ],
    testGroupMessages: [
        {
            text: 'Message in group from user1',
            senderUsername: 'testuser1',
            groupName: 'testgroup1',
        },
        {
            text: 'Reply in group from user2',
            senderUsername: 'testuser2',
            groupName: 'testgroup1',
        },
    ],
};