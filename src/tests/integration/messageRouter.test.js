const fastify = require('../../app');
const prisma = require('../prismaTestClient');
const { seedTestData, generateTestToken } = require('../seedTestData');
const supertest = require('supertest');
const testData = require('../fixtures/testData');

describe('Message Router Tests', () => {
    let app;

    beforeAll(async () => {
        app = fastify;
        await app.ready();
        await prisma.$connect();
        await seedTestData();
    });

    afterAll(async () => {
        await prisma.$disconnect();
        await app.close();
    });

    test('GET /messages/direct should return messages between two users', async () => {
        const token = generateTestToken(testData.testUsers[0].username);

        const response = await supertest(app.server)
            .get(`/messages/direct?user1=${testData.testUsers[0].username}&user2=${testData.testUsers[1].username}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        testData.testMessages.forEach((fixtureMessage) => {
            const matchingMessage = response.body.find(
                (message) =>
                    message.text === fixtureMessage.text &&
                    message.sender.username === fixtureMessage.senderUsername &&
                    message.recipient.username === fixtureMessage.recipientUsername
            );
            expect(matchingMessage).toBeDefined();
            expect(matchingMessage).toHaveProperty('id');
            expect(matchingMessage).toHaveProperty('createdAt');
            expect(matchingMessage).toHaveProperty('read');
            expect(matchingMessage).toHaveProperty('groupId');
        });
    });

    test('GET /messages/direct should return 401 if unauthorized', async () => {
        const response = await supertest(app.server)
            .get(`/messages/direct?user1=${testData.testUsers[0].username}&user2=${testData.testUsers[1].username}`)
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message', 'Invalid token');
    });

    test('GET /messages/group/:groupId should return messages for the specified group', async () => {
        const token = generateTestToken(testData.testUsers[0].username);
        const group = await prisma.group.findUnique({ where: { name: testData.testGroups[0].name } });
        const response = await supertest(app.server)
            .get(`/messages/group/${group.id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        testData.testGroupMessages.forEach((fixtureMessage) => {
            const matchingMessage = response.body.find(
                (message) =>
                    message.text === fixtureMessage.text &&
                    message.sender.username === fixtureMessage.senderUsername
            );
            expect(matchingMessage).toBeDefined();
            expect(matchingMessage).toHaveProperty('id');
            expect(matchingMessage).toHaveProperty('createdAt');
            expect(matchingMessage).toHaveProperty('read');
            expect(matchingMessage.groupId).toBe(group.id);
        });
    });

    test('GET /messages/group/:groupId should return 401 if unauthorized', async () => {
        const group = await prisma.group.findUnique({ where: { name: testData.testGroups[0].name } });
        const response = await supertest(app.server)
            .get(`/messages/group/${group.id}`);
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message', 'Invalid token');
    });

    test('GET /messages/chats should return a list of conversation usernames', async () => {
        const token = generateTestToken(testData.testUsers[0].username);
        const response = await supertest(app.server)
            .get('/messages/chats')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body).toContain(testData.testUsers[1].username);
    });

    test('GET /messages/chats should return 401 if unauthorized', async () => {
        const response = await supertest(app.server).get('/messages/chats');
        expect(response.statusCode).toBe(401); // Unauthorized error
        expect(response.body).toHaveProperty('message', 'Invalid token');
    });
});