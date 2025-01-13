const WebSocket = require('ws');
const fastify = require('../../app');
const { seedTestData, generateTestToken } = require('../seedTestData');
const testData = require('../fixtures/testData');
const prisma = require('../prismaTestClient');

describe('WebSocket Message Tests', () => {
    let app;
    let wsClient1;
    let wsClient2;
    const port = process.env.PORT || 3000;
    const username1 = testData.testUsers[0].username;
    const username2 = testData.testUsers[1].username;

    beforeAll(async () => {
        app = fastify;
        await prisma.$connect();
        // Start Fastify server
        await app.listen({ port, host: '127.0.0.1' });
        const addr = app.server.address();
        console.log(`Test server running at http://127.0.0.1:${addr.port}`);
        await seedTestData();
    });

    afterAll(async () => {
        try{
            wsClient1.close();
            wsClient2.close();
        }catch(e){
            console.log(e)
        }
       
        await app.close();
    });

    beforeEach(() => {
        // Connect two WebSocket clients
        const token1 = generateTestToken(username1);
        const token2 = generateTestToken(username2);
        wsClient1 = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${token1}`);
        wsClient2 = new WebSocket(`ws://127.0.0.1:${port}/ws?token=${token2}`);
    });

    const waitForMessage = (ws) =>
        new Promise((resolve) => {
            ws.on('message', (data) => resolve(JSON.parse(data)));
        });

    test('Send and receive direct message', async () => {
        await new Promise((resolve) => wsClient1.on('open', resolve));
        await new Promise((resolve) => wsClient2.on('open', resolve));

        const directMessage = { type: 'direct', recipient: username2, text: 'test message' };
        wsClient1.send(JSON.stringify(directMessage));

        const receivedMessage = await waitForMessage(wsClient2);
        expect(receivedMessage).toMatchObject({
            type: 'direct',
            sender: username1,
            text: 'test message',
        });
    });

    test('Send and receive typing indicators', async () => {
        await new Promise((resolve) => wsClient1.on('open', resolve));
        await new Promise((resolve) => wsClient2.on('open', resolve));

        const typingStart = { type: 'typing', status: 'startTyping', recipient: username2 };
        const typingStop = { type: 'typing', status: 'stopTyping', recipient: username2 };

        wsClient1.send(JSON.stringify(typingStart));
        let receivedMessage = await waitForMessage(wsClient2);
        expect(receivedMessage).toMatchObject({
            type: 'typing',
            sender: username1,
            status: 'startTyping',
        });

        wsClient1.send(JSON.stringify(typingStop));
        receivedMessage = await waitForMessage(wsClient2);
        expect(receivedMessage).toMatchObject({
            type: 'typing',
            sender: username1,
            status: 'stopTyping',
        });
    });

    test('Send and receive read receipt', async () => {
        await new Promise((resolve) => wsClient1.on('open', resolve));
        await new Promise((resolve) => wsClient2.on('open', resolve));
    
        // 1. Username1 sends a direct message to Username2
        const directMessage = { type: 'direct', recipient: username2, text: 'test message' };
        wsClient1.send(JSON.stringify(directMessage));
    
        // Wait for the message to be received by Username2
        const receivedDirectMessage = await waitForMessage(wsClient2);
        expect(receivedDirectMessage).toMatchObject({
            type: 'direct',
            sender: username1,
            text: 'test message',
        });
    
        // Extract messageId from the received message
        const messageId = receivedDirectMessage.messageId;
        expect(messageId).toBeDefined(); // Ensure the messageId is returned
    
        // 2. Username2 sends a read receipt for the message
        const readReceipt = { type: 'readReceipt', messageId };
        wsClient2.send(JSON.stringify(readReceipt));
    
        // Wait for the read receipt to be received by Username1
        const receivedReadReceipt = await waitForMessage(wsClient1);
        expect(receivedReadReceipt).toMatchObject({
            type: 'readReceipt',
            messageId,
            reader: username2,
        });
    });

    test('Join, send group message, and leave group', async () => {
        // Yes, other group members do not get notification about others joining/leaving
        // now I think, that is typical feature of chat app. isn't it? maybe I should add it later?
        await new Promise((resolve) => wsClient1.on('open', resolve));
        await new Promise((resolve) => wsClient2.on('open', resolve));

        const joinGroup = { type: 'join', group: 'dev' };
        wsClient1.send(JSON.stringify(joinGroup));
        wsClient2.send(JSON.stringify(joinGroup));
        
        // wait for user 2 receiving group joining confirmation
        const receivedMessageJoinGroup = await waitForMessage(wsClient2);
        expect(receivedMessageJoinGroup).toMatchObject({
            message: 'Joined group: dev'
       });

       // user 1 sends group message
        const groupMessage = { type: 'groupMessage', text: 'hello group', group: 'dev' };
        wsClient1.send(JSON.stringify(groupMessage));
       // user 2 retrieves message sent by user 1 to group
        const receivedGroupMessage = await waitForMessage(wsClient2);

        expect(receivedGroupMessage).toMatchObject({
            sender: 'testuser1',
            text: 'hello group',
            group: 'dev',
        });

        // user 1 leaves group
        const leaveGroup = { type: 'leave', group: 'dev' };
        wsClient1.send(JSON.stringify(leaveGroup));
        // user 1 gets notification 
        const leaveGroupMessage = await waitForMessage(wsClient1);
        expect(leaveGroupMessage).toMatchObject({
            message: 'Left group: dev'
        });
    });

    test('Send and receive broadcast message', async () => {
        await new Promise((resolve) => wsClient1.on('open', resolve));
        await new Promise((resolve) => wsClient2.on('open', resolve));

        const broadcastMessage = { type: 'broadcast', text: 'meh broadcast message' };
        wsClient1.send(JSON.stringify(broadcastMessage));

        const receivedBroadcast = await waitForMessage(wsClient2);
        expect(receivedBroadcast).toMatchObject({
            type: 'broadcast',
            sender: 'testuser1',
            text: 'meh broadcast message',
        });
    });
});