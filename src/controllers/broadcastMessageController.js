const { sendMessage } = require('../utils/socketUtils');
const { ValidationError  } = require('../utils/errors');
const { broadcastMessageSchema } = require('../schemas/webSocketSchemas');
const validateWebSocketMessage = require('../middleware/webSocketMessageValidationMiddleware');

const handleBroadcastMessage = (message, username, socket, users, logger) => {
    try {
        const msg = JSON.parse(message);
        logger.info({ username, msg }, 'Processing broadcast message');

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
        logger.info({ username, text, recipients: users.size }, 'Broadcast message dispatched');
        sendMessage(socket, { message: `Broadcast sent: ${text}` });
    } catch (err) {
        if (err instanceof ValidationError) {
            logger.warn({ username, error: err.message }, 'Validation error for broadcast message');
            sendMessage(socket, { error: err.message });
        } else {
            logger.error({ username, error: err.message, stack: err.stack }, 'Error handling broadcast message');
            sendMessage(socket, { error: 'Failed to broadcast message', details: err.message });
        }
    }
};

module.exports = { handleBroadcastMessage };