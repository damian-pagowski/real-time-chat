const prisma = require('./prismaTestClient');
const jwtSecret = process.env.JWT_SECRET || 'your-secure-secret';
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const testData = require('./fixtures/testData');

const generateTestToken = (username) => {
    return jwt.sign({ username }, jwtSecret, { expiresIn: '1h' });
};

const seedTestData = async () => {
    // Run raw SQL to ensure the schema is set up
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS User (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        );
    `);

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "Group" (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        );
    `);

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "_GroupMembers" (
            A INTEGER NOT NULL,
            B INTEGER NOT NULL,
            FOREIGN KEY (A) REFERENCES "Group" (id) ON DELETE CASCADE,
            FOREIGN KEY (B) REFERENCES User (id) ON DELETE CASCADE,
            PRIMARY KEY (A, B)
        );
    `);

    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS Message (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            senderId INTEGER NOT NULL,
            recipientId INTEGER,
            read BOOLEAN DEFAULT FALSE,
            groupId INTEGER,
            FOREIGN KEY (senderId) REFERENCES User (id) ON DELETE CASCADE,
            FOREIGN KEY (recipientId) REFERENCES User (id) ON DELETE CASCADE,
            FOREIGN KEY (groupId) REFERENCES "Group" (id) ON DELETE CASCADE
        );
    `);

    // Seed Users
    for (const user of testData.testUsers) {
        const hashedPassword = await bcrypt.hash(user.password, 10);

        await prisma.user.upsert({
            where: { username: user.username },
            update: { password: hashedPassword },
            create: { username: user.username, password: hashedPassword },
        });

        testData.testTokens[user.username] = generateTestToken(user.username);
    }

    // Seed Groups
    await prisma.group.upsert({
        where: { name: 'testgroup' },
        update: {},
        create: {
            name: 'testgroup',
            members: {
                connect: testData.testUsers.map((user) => ({ username: user.username })),
            },
        },
    });
       // Seed groups
       for (const group of testData.testGroups) {
        const createdGroup = await prisma.group.upsert({
            where: { name: group.name },
            update: {},
            create: { name: group.name },
        });

        // Add members to group
        for (const username of group.members) {
            const user = await prisma.user.findUnique({ where: { username } });
            await prisma.group.update({
                where: { id: createdGroup.id },
                data: {
                    members: {
                        connect: { id: user.id },
                    },
                },
            });
        }
    }
    // Seed group messages
    for (const message of testData.testGroupMessages) {
        const sender = await prisma.user.findUnique({ where: { username: message.senderUsername } });
        const group = await prisma.group.findUnique({ where: { name: message.groupName } });

        await prisma.message.create({
            data: {
                text: message.text,
                sender: { connect: { id: sender.id } },
                group: { connect: { id: group.id } },
            },
        });
    }

    // Seed Direct Messages
    for (const message of testData.testMessages) {
        const { text, senderUsername, recipientUsername } = message;

        await prisma.message.create({
            data: {
                text,
                sender: { connect: { username: senderUsername } },
                recipient: { connect: { username: recipientUsername } },
                read: false, // Default value for the `read` column
            },
        });
    }
};

module.exports = { seedTestData, generateTestToken };