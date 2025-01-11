const { typingMessageSchema } = require('../schemas/webSocketSchemas');
const { ValidationError } = require('../utils/errors');
const { sendMessage } = require('../utils/socketUtils');
const validateWebSocketMessage = require('../middleware/webSocketMessageValidationMiddleware');

const handleTypingIndicator = (message, username, socket, users, groups) => {
    try {
        const msg =  JSON.parse(message);
        const validatedMessage = validateWebSocketMessage(typingMessageSchema)(msg);
        const { status, recipient, group } = validatedMessage;

        if (recipient) {
            const recipientSocket = users.get(recipient);
            if (recipientSocket) {
                sendMessage(recipientSocket, {
                    type: 'typing',
                    sender: username,
                    status,
                });
            }
        } else if (group) {
            if (groups.has(group)) {
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
                        }
                    }
                });
            } else {
                throw new ValidationError(`Group "${group}" does not exist`);
            }
        }
    } catch (err) {
        if (err instanceof ValidationError) {
            sendMessage(socket, { error: err.message });
        } else {
            console.error('Error processing typing indicator:', err);
            sendMessage(socket, { error: 'Failed to process typing indicator', details: err.message });
        }
    }
};

module.exports = { handleTypingIndicator };