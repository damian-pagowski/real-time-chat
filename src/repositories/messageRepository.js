const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const addMessage = async (senderUsername, recipientUsername, text, groupId = null) => {
    const data = {
        text,
        sender: {
            connect: {
                username: senderUsername,
            },
        },
        recipient: {
            connect: {
                username: recipientUsername,
            },
        },
    };

    if (groupId) {
        data.group = {
            connect: {
                id: groupId,
            },
        };
    }

    return prisma.message.create({ data });
};

const getMessagesBetweenUsers = async (user1, user2) => {
    return prisma.message.findMany({
        where: {
            OR: [
                { sender: { username: user1 }, recipient: { username: user2 } },
                { sender: { username: user2 }, recipient: { username: user1 } },
            ],
        },
        orderBy: { createdAt: 'asc' },
        include: {
            sender: { select: { username: true } },
            recipient: { select: { username: true } },
        },
    });
};

const getMessagesForGroup = async (groupId) => {
    return prisma.message.findMany({
        where: { groupId },
        orderBy: { createdAt: 'desc' },
    });
};

const markMessageAsRead = async (messageId) => {
    return prisma.message.update({
        where: { id: messageId },
        data: { read: true },
    });
};

const getUnreadMessagesForUser = async (recipientId) => {
    return prisma.message.findMany({
        where: { recipientId, read: false },
        orderBy: { createdAt: 'asc' },
    });
};

const getSenderForMessage = async (messageId) => {
    const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: { sender: true },
    });
    if (!message) {
        throw new Error(`Message with ID ${messageId} not found`);
    }
    return message.sender;
};

const getConversationUsernames = async (username) => {
    const conversations = await prisma.message.findMany({
        where: {
            OR: [
                { sender: { username } },
                { recipient: { username } },
            ],
        },
        select: {
            sender: { select: { username: true } },
            recipient: { select: { username: true } },
        },
        distinct: ["senderId", "recipientId"], // Ensures unique conversation pairs
    });

    const usernames = new Set(); // Use a set to avoid duplicates

    conversations.forEach((message) => {
        if (message.sender.username !== username) {
            usernames.add(message.sender.username);
        }
        if (message.recipient?.username && message.recipient.username !== username) {
            usernames.add(message.recipient.username);
        }
    });

    return Array.from(usernames); // Return as a list
};

const deleteMessage = async (messageId) => {
    return prisma.message.delete({
        where: { id: messageId },
    });
};

const searchMessages = async (userId, keyword) => {
    return prisma.message.findMany({
        where: {
            OR: [
                { senderId: userId, text: { contains: keyword, mode: 'insensitive' } },
                { recipientId: userId, text: { contains: keyword, mode: 'insensitive' } },
            ],
        },
        orderBy: { createdAt: 'desc' },
    });
};

module.exports = {
    addMessage,
    getMessagesBetweenUsers,
    getMessagesForGroup,
    markMessageAsRead,
    getUnreadMessagesForUser,
    getSenderForMessage,
    getConversationUsernames,
    deleteMessage,
    searchMessages,
};