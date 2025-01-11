const { sendMessage } = require('../utils/socketUtils');
const { ValidationError, ServerError } = require('../utils/errors');
const {
    addMessage,
    markMessageAsRead,
    getSenderForMessage,
} = require('../repositories/messageRepository');
const { directMessageSchema, readReceiptSchema } = require('../schemas/webSocketSchemas');
const validateWebSocketMessage = require('../middleware/webSocketMessageValidationMiddleware');

const handleDirectMessage = async (message, username, socket, users) => {
    try {
        const msg = JSON.parse(message);
        const { recipient, text } = validateWebSocketMessage(directMessageSchema)(msg);
        const recipientSocket = users.get(recipient);
        if (!recipientSocket) {
            sendMessage(socket, { error: `User ${recipient} is not connected` });
            return;
        }
        const savedMessage = await addMessage(username, recipient, text);
        const timestamp = Date.now();
        sendMessage(recipientSocket, {
            sender: username,
            text,
            messageId: savedMessage.id,
            timestamp,
            type: 'direct',
        });
    } catch (err) {
        if (err instanceof ValidationError) {
            sendMessage(socket, { error: err.message });
        } else {
            console.error('Error handling direct message:', err);
            throw new ServerError('Failed to send direct message', err); 
        }
    }
};

const handleReadReceipt = async (message, username, socket, users) => {
    try {
        const msg = JSON.parse(message);
        const { messageId } = validateWebSocketMessage(readReceiptSchema)(msg);
        await markMessageAsRead(messageId);
        const sender = await getSenderForMessage(messageId);
        const senderSocket = users.get(sender.username);
        if (senderSocket) {
            sendMessage(senderSocket, {
                type: 'readReceipt',
                messageId,
                reader: username,
            });
        }
    } catch (err) {
        if (err instanceof ValidationError) {
            sendMessage(socket, { error: err.message });
        } else {
            console.error('Error handling read receipt:', err);
            throw new ServerError('Failed to handle read receipt', err);
        }
    }
};

module.exports = {
    handleDirectMessage,
    handleReadReceipt,
};