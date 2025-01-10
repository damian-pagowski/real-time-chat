const { ValidationError } = require('../utils/errors');
const { sendMessage } = require('../utils/socketUtils');
const { createGroup, findGroupByName } = require('../db/groups');
const { addMessage } = require('../db/messages');

const handleGroupMessage = (message, username, socket, users, groups) => {
    try {
        const parsedMessage = JSON.parse(message);

        if (!parsedMessage.group || typeof parsedMessage.group !== 'string') {
            throw new ValidationError('Group message must include a valid "group" field');
        }
        if (!parsedMessage.text || typeof parsedMessage.text !== 'string') {
            throw new ValidationError('Group message must include a valid "text" field');
        }

        const { group, text } = parsedMessage;

        const groupData = findGroupByName(group);
        if (!groupData) {
            throw new ValidationError(`Group "${group}" does not exist`);
        }

        addMessage(username, null, text, groupData.id);

        const timestamp = Date.now();
        groups.get(group)?.forEach((member) => {
            const recipientSocket = users.get(member);
            if (recipientSocket) {
                sendMessage(recipientSocket, {
                    sender: username,
                    group,
                    text,
                    timestamp,
                });
            }
        });
    } catch (err) {
        if (err instanceof ValidationError) {
            sendMessage(socket, { error: err.message });
        } else {
            console.error('Error handling group message:', err);
            sendMessage(socket, { error: 'Failed to handle group message', details: err.message });
        }
    }
};

const handleJoinGroup = (message, username, socket, groups) => {
    try {
        const parsedMessage = JSON.parse(message);

        if (!parsedMessage.group || typeof parsedMessage.group !== 'string') {
            throw new ValidationError('Join group message must include a valid "group" field');
        }

        const { group } = parsedMessage;

        if (!groups.has(group)) {
            groups.set(group, new Set());
        }
        if (!findGroupByName(group)) {
            createGroup(group);
        }

        groups.get(group).add(username);
        sendMessage(socket, { message: `Joined group: ${group}` });
    } catch (err) {
        if (err instanceof ValidationError) {
            sendMessage(socket, { error: err.message });
        } else {
            console.error('Error handling join group:', err);
            sendMessage(socket, { error: 'Failed to join group', details: err.message });
        }
    }
};

const handleLeaveGroup = (message, username, socket, groups) => {
    try {
        const parsedMessage = JSON.parse(message);

        if (!parsedMessage.group || typeof parsedMessage.group !== 'string') {
            throw new ValidationError('Leave group message must include a valid "group" field');
        }

        const { group } = parsedMessage;

        if (groups.has(group)) {
            groups.get(group).delete(username);
            sendMessage(socket, { message: `Left group: ${group}` });
        } else {
            throw new ValidationError(`Group "${group}" does not exist`);
        }
    } catch (err) {
        if (err instanceof ValidationError) {
            sendMessage(socket, { error: err.message });
        } else {
            console.error('Error handling leave group:', err);
            sendMessage(socket, { error: 'Failed to leave group', details: err.message });
        }
    }
};

module.exports = {
    handleGroupMessage,
    handleJoinGroup,
    handleLeaveGroup,
};