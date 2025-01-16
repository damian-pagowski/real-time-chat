const fastify = require('../../app');
const supertest = require('supertest');
const WebSocket = require('ws');
const prisma = require('../prismaTestClient');
const { generateTestToken, seedTestData } = require('../seedTestData');
const testData = require('../fixtures/testData');

describe('WebSocket Route Tests', () => {
    let app;
    const port = 3001;

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
        await prisma.$disconnect();
        await app.close();
    });

    test('WebSocket connection should establish successfully', async () => {
        const token = generateTestToken(testData.testUsers[0].username);

        const wsUrl = `ws://127.0.0.1:${port}/ws?token=${token}`;
        const ws = new WebSocket(wsUrl);

        await new Promise((resolve, reject) => {
            ws.on('open', () => {
                expect(ws.readyState).toBe(WebSocket.OPEN);
                resolve();
            });

            ws.on('error', (err) => reject(err));
        });

        ws.close();
    });

    test('WebSocket connection should fail with invalid token', async () => {
        const invalidToken = 'invalid_token';
        const wsUrl = `ws://127.0.0.1:${port}/ws?token=${invalidToken}`;

        const ws = new WebSocket(wsUrl);

        await new Promise((resolve, reject) => {
            ws.on('close', (code) => {
                expect(code).toBe(4001); // Unauthorized
                resolve();
            });

            ws.on('error', (err) => reject(err));
        });
    });

    test('GET /ws/active-users should return active WebSocket users', async () => {
        const token = generateTestToken(testData.testUsers[0].username);

        const wsUrl = `ws://127.0.0.1:${port}/ws?token=${token}`;

        const ws = new WebSocket(wsUrl);

        await new Promise((resolve, reject) => {
            ws.on('open', resolve);
            ws.on('error', reject);
        });

        const response = await supertest(app.server)
            .get('/ws/active-users')
            .set('Authorization', `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body).toContain(testData.testUsers[0].username);

        ws.close();
    });

    test('GET /ws/active-users should fail without a token', async () => {
        const response = await supertest(app.server).get('/ws/active-users');
        expect(response.statusCode).toBe(401);
        expect(response.body).toHaveProperty('message', 'Invalid token');
    });
});