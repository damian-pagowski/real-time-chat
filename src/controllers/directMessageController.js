const { sendMessage } = require('../utils/socketUtils');
const { ValidationError, ServerError } = require('../utils/errors');
const {
    addMessage,
    markMessageAsRead,
    getSenderForMessage,
} = require('../repositories/messageRepository');

const handleDirectMessage = async (message, username, socket, users) => {
    try {
        const { recipient, text } = JSON.parse(message);

        if (!recipient || typeof recipient !== 'string') {
            throw new ValidationError('Direct message must include a valid "recipient" field');
        }
        if (!text || typeof text !== 'string') {
            throw new ValidationError('Direct message must include a valid "text" field');
        }

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
        const { messageId } = JSON.parse(message);

        if (!messageId || typeof messageId !== 'number') {
            throw new ValidationError('Read receipt must include a valid "messageId" field');
        }

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