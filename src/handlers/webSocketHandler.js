const { broadcastPresence } = require('../controllers/presenceController');
const { handleDirectMessage, handleReadReceipt } = require('../controllers/directMessageController');
const { handleGroupMessage, handleJoinGroup, handleLeaveGroup } = require('../controllers/groupController');
const { sendMessage } = require('../utils/socketUtils');
const { handleBroadcastMessage } = require('../controllers/broadcastMessageController');
const { handleTypingIndicator } = require('../controllers/typingIndicatorController');




const handleWebSocketConnection = (socket, req, users, groups, jwtVerify) => {
    const url = require('url');
    const rawReq = req.raw;
    const tokenFromQuery = rawReq?.url ? url.parse(rawReq.url, true).query?.token : null;
    const tokenFromHeader = rawReq?.headers?.authorization?.split(' ')[1] || null;
    const token = tokenFromQuery || tokenFromHeader;

    if (!token) {
        socket.close(4001, 'Unauthorized');
        return;
    }

    let username;
    try {
        const decoded = jwtVerify(token);
        username = decoded.username;
    } catch {
        socket.close(4002, 'Invalid token');
        return;
    }

    users.set(username, socket);
    broadcastPresence(users, username, 'online');

    socket.on('message', (message) => {
        try {
            const { type } = JSON.parse(message);
            // DO NOT DELETE!!!!!!!!!!
            console.log(message.toString('utf8'))
            switch (type) {
                case 'direct':
                    handleDirectMessage(message, username, socket, users);
                    break;
                case 'readReceipt':
                    handleReadReceipt(message, username, socket, users);
                    break;
                case 'groupMessage':
                    handleGroupMessage(message, username, socket, users, groups);
                    break;
                case 'join':
                    handleJoinGroup(message, username, socket, groups);
                    break;
                case 'leave':
                    handleLeaveGroup(message, username, socket, groups);
                    break;
                case 'broadcast':
                    handleBroadcastMessage(message, username, socket, users);
                    break;
                case 'typing':
                    handleTypingIndicator(message, username, socket, users, groups);
                    break;
                default:
                    sendMessage(socket, { error: 'Unsupported message type' });
            }
        } catch (err) {
            sendMessage(socket, { error: 'Error processing message' });
        }
    });

    socket.on('close', () => {
        users.delete(username);
        broadcastPresence(users, username, 'offline');
        groups.forEach((members) => members.delete(username));
    });
};

module.exports = { handleWebSocketConnection };