const { sendMessage } = require('../utils/socketUtils');
const { ValidationError  } = require('../utils/errors');

const handleBroadcastMessage = (message, username, socket, users) => {
    try {
        const parsedMessage = JSON.parse(message);
        if (!parsedMessage.text || typeof parsedMessage.text !== 'string') {
            throw new ValidationError('Broadcast message must include a valid "text" field');
        }
        const { text } = parsedMessage;
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