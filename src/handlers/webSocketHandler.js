const { broadcastPresence } = require('../controllers/presenceController');
const { handleDirectMessage, handleReadReceipt } = require('../controllers/directMessageController');
const { handleGroupMessage, handleJoinGroup, handleLeaveGroup } = require('../controllers/groupController');
const { sendMessage } = require('../utils/socketUtils');
const { handleBroadcastMessage } = require('../controllers/broadcastMessageController');
const { handleTypingIndicator } = require('../controllers/typingIndicatorController');

const handleWebSocketConnection = (socket, username, users, groups, logger) => {
    users.set(username, socket);
    broadcastPresence(users, username, 'online', logger);
    socket.on('message', (message) => {
        try {
            const msgString = message.toString('utf8');
            const { type } = JSON.parse(msgString);
            logger.info({ username, type, message: msgString }, 'Received WebSocket message');

            switch (type) {
                case 'direct':
                    handleDirectMessage(message, username, socket, users, logger);
                    break;
                case 'readReceipt':
                    handleReadReceipt(message, username, socket, users, logger);
                    break;
                case 'groupMessage':
                    handleGroupMessage(message, username, socket, users, groups, logger);
                    break;
                case 'join':
                    handleJoinGroup(message, username, socket, groups, logger);
                    break;
                case 'leave':
                    handleLeaveGroup(message, username, socket, groups, logger);
                    break;
                case 'broadcast':
                    handleBroadcastMessage(message, username, socket, users, logger);
                    break;
                case 'typing':
                    handleTypingIndicator(message, username, socket, users, groups, logger);
                    break;
                default:
                    sendMessage(socket, { error: 'Unsupported message type' });
                    logger.warn({ username, type }, 'Unsupported WebSocket message type');
            }
        } catch (err) {
            logger.error('Failed to process WebSocket message', { error: err.message });
            sendMessage(socket, { error: 'Error processing message' });
        }
    });

    socket.on('close', () => {
        users.delete(username);
        broadcastPresence(users, username, 'offline', logger);
        groups.forEach((members) => members.delete(username));
        fastify.log.info(`WebSocket disconnected for user: ${username}`);
    });
};

module.exports = { handleWebSocketConnection };