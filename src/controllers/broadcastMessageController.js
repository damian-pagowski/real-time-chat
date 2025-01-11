const { sendMessage } = require('../utils/socketUtils');
const { ValidationError  } = require('../utils/errors');
const { broadcastMessageSchema } = require('../schemas/webSocketSchemas');
const validateWebSocketMessage = require('../middleware/webSocketMessageValidationMiddleware');

const handleBroadcastMessage = (message, username, socket, users) => {
    try {
        const msg = JSON.parse(message);
        const { text } = validateWebSocketMessage(broadcastMessageSchema)(msg);
        const timestamp = Date.now();
        users.forEach((recipientSocket, user) => {
            if (user !== username) {
                sendMessage(recipientSocket, {
                    sender: username,
                    text,
                    timestamp,
                    type: "broadcast",
                });
            }
        });
        sendMessage(socket, { message: `Broadcast sent: ${text}` });
    } catch (err) {
        if (err instanceof ValidationError) {
            sendMessage(socket, { error: err.message });
        } else {
            console.error('Error handling broadcast message:', err);
            sendMessage(socket, { error: 'Failed to broadcast message', details: err.message });
        }
    }
};

module.exports = { handleBroadcastMessage };