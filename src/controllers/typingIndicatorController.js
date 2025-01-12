const { typingMessageSchema } = require('../schemas/webSocketSchemas');
const { ValidationError } = require('../utils/errors');
const { sendMessage } = require('../utils/socketUtils');
const validateWebSocketMessage = require('../middleware/webSocketMessageValidationMiddleware');

const handleTypingIndicator = (message, username, socket, users, groups, logger) => {
    try {
        const msg = JSON.parse(message);
        logger.info({ username, message: msg }, 'Received typing indicator message');

        const validatedMessage = validateWebSocketMessage(typingMessageSchema)(msg);
        const { status, recipient, group } = validatedMessage;

        if (recipient) {
            const recipientSocket = users.get(recipient);
            if (recipientSocket) {
                logger.info({ username, recipient, status }, 'Sending typing status to recipient');
                sendMessage(recipientSocket, {
                    type: 'typing',
                    sender: username,
                    status,
                });
            } else {
                logger.warn({ recipient }, 'Recipient socket not found');
            }
        } else if (group) {
            if (groups.has(group)) {
                logger.info({ username, group, status }, 'Broadcasting typing status to group');
                groups.get(group).forEach((member) => {
                    if (member !== username) {
                        const recipientSocket = users.get(member);
                        if (recipientSocket) {
                            sendMessage(recipientSocket, {
                                type: 'typing',
                                sender: username,
                                group,
                                status,
                            });
                        } else {
                            logger.warn({ member }, 'Member socket not found in group');
                        }
                    }
                });
            } else {
                logger.warn({ group }, 'Group does not exist');
                throw new ValidationError(`Group "${group}" does not exist`);
            }
        } else {
            logger.warn('Typing indicator message missing recipient or group');
        }
    } catch (err) {
        if (err instanceof ValidationError) {
            logger.warn({ error: err.message }, 'Validation error in typing indicator');
            sendMessage(socket, { error: err.message });
        } else {
            logger.error({ error: err.message }, 'Error processing typing indicator');
            sendMessage(socket, { error: 'Failed to process typing indicator', details: err.message });
        }
    }
};

module.exports = { handleTypingIndicator };