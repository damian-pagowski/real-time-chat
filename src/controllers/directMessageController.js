const { sendMessage } = require('../utils/socketUtils');
const { ValidationError } = require('../utils/errors');
const {
    addMessage,
    markMessageAsRead,
    getSenderForMessage,
} = require('../db/messages');

const handleDirectMessage = (message, username, socket, users) => {
    try {
        const parsedMessage = JSON.parse(message);

        if (!parsedMessage.recipient || typeof parsedMessage.recipient !== 'string') {
            throw new ValidationError('Direct message must include a valid "recipient" field');
        }
        if (!parsedMessage.text || typeof parsedMessage.text !== 'string') {
            throw new ValidationError('Direct message must include a valid "text" field');
        }

        const { recipient, text } = parsedMessage;
        const recipientSocket = users.get(recipient);

        if (!recipientSocket) {
            sendMessage(socket, { error: `User ${recipient} is not connected` });
            return;
        }

        const { lastInsertRowid } = addMessage(username, recipient, text);

        const timestamp = Date.now();
        sendMessage(recipientSocket, {
            sender: username,
            text,
            messageId: lastInsertRowid,
            timestamp,
            type: 'direct',
        });
    } catch (err) {
        if (err instanceof ValidationError) {
            sendMessage(socket, { error: err.message }); 
        } else {
            console.error('Error handling direct message:', err);
            sendMessage(socket, { error: 'Failed to send direct message', details: err.message });
        }
    }
};

const handleReadReceipt = (message, username, socket, users) => {
    try {
        const parsedMessage = JSON.parse(message);

        if (!parsedMessage.messageId || typeof parsedMessage.messageId !== 'number') {
            throw new ValidationError('Read receipt must include a valid "messageId" field');
        }

        const { messageId } = parsedMessage;

        markMessageAsRead(messageId);

        const sender = getSenderForMessage(messageId);
        const senderSocket = users.get(sender);

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
            sendMessage(socket, { error: 'Failed to handle read receipt', details: err.message });
        }
    }
};

module.exports = {
    handleDirectMessage,
    handleReadReceipt,
};