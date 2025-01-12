const { sendMessage } = require('../utils/socketUtils');
const { ValidationError, ServerError } = require('../utils/errors');
const {
    addMessage,
    markMessageAsRead,
    getSenderForMessage,
} = require('../repositories/messageRepository');
const { directMessageSchema, readReceiptSchema } = require('../schemas/webSocketSchemas');
const validateWebSocketMessage = require('../middleware/webSocketMessageValidationMiddleware');

const handleDirectMessage = async (message, username, socket, users, logger) => {
    try {
        const msg = JSON.parse(message);
        logger.info({ username, msg }, 'Processing direct message');
        const { recipient, text } = validateWebSocketMessage(directMessageSchema)(msg);
        const recipientSocket = users.get(recipient);
        if (!recipientSocket) {
            logger.warn({ username, recipient }, 'Recipient is not connected');
            sendMessage(socket, { error: `User ${recipient} is not connected` });
            return;
        }
        const savedMessage = await addMessage(username, recipient, text);
        logger.info({ username, recipient, messageId: savedMessage.id }, 'Direct message saved to database');

        const timestamp = Date.now();
        sendMessage(recipientSocket, {
            sender: username,
            text,
            messageId: savedMessage.id,
            timestamp,
            type: 'direct',
        });
        logger.info({ username, recipient, messageId: savedMessage.id }, 'Direct message sent to recipient');
    } catch (err) {
        if (err instanceof ValidationError) {
            logger.warn({ username, error: err.message }, 'Validation error for direct message');
            sendMessage(socket, { error: err.message });
        } else {
            logger.error({ username, error: err.message, stack: err.stack }, 'Error handling direct message');
            throw new ServerError('Failed to send direct message', err);
        }
    }
};

const handleReadReceipt = async (message, username, socket, users, logger) => {
    try {
        const msg = JSON.parse(message);
        logger.info({ username, msg }, 'Processing read receipt');

        const { messageId } = validateWebSocketMessage(readReceiptSchema)(msg);
        await markMessageAsRead(messageId);
        logger.info({ username, messageId }, 'Marked message as read');
        const sender = await getSenderForMessage(messageId);
        const senderSocket = users.get(sender.username);
        if (senderSocket) {
            sendMessage(senderSocket, {
                type: 'readReceipt',
                messageId,
                reader: username,
            });
            logger.info({ username, sender: sender.username, messageId }, 'Read receipt sent to sender');
        } else {
            logger.warn({ username, sender: sender.username }, 'Sender is not connected for read receipt');
        }
    } catch (err) {
        if (err instanceof ValidationError) {
            logger.warn({ username, error: err.message }, 'Validation error for read receipt');
            sendMessage(socket, { error: err.message });
        } else {
            logger.error({ username, error: err.message, stack: err.stack }, 'Error handling read receipt');
            throw new ServerError('Failed to handle read receipt', err);
        }
    }
};

module.exports = {
    handleDirectMessage,
    handleReadReceipt,
};