const { sendMessage } = require('../utils/socketUtils');

const handleTypingIndicator = (message, username, socket, users, groups) => {
    try {
        const { status, recipient, group } = JSON.parse(message);

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
                sendMessage(socket, { error: `Group ${group} does not exist`, message });
            }
        } else {
            sendMessage(socket, { error: 'Invalid typing indicator format', message });
        }
    } catch (err) {
        sendMessage(socket, { error: 'Error processing typing indicator', message });
    }
};

module.exports = { handleTypingIndicator };