const { ValidationError } = require('../utils/errors');
const { sendMessage } = require('../utils/socketUtils');
const {
    createGroup,
    findGroupByName,
    addMemberToGroup,
    removeMemberFromGroup,
    getGroupMembers,
} = require('../repositories/groupRepository');
const { addMessage } = require('../repositories/messageRepository');

const { groupMessageSchema, joinGroupSchema, leaveGroupSchema, } = require('../schemas/webSocketSchemas');
const validateWebSocketMessage = require('../middleware/webSocketMessageValidationMiddleware');

const handleGroupMessage = async (message, username, socket, users, groups, logger) => {
    try {
        const msg = JSON.parse(message);
        logger.info({ username, message: msg }, 'Processing group message');
        const validatedMessage = validateWebSocketMessage(groupMessageSchema)(msg);
        const { group, text } = validatedMessage;
        const groupData = await findGroupByName(group);
        await addMessage(username, null, text, parseInt(groupData.id));
                
        logger.info({ username, group, text }, 'Group message saved');

        const timestamp = Date.now();
        const members = await getGroupMembers(groupData.name);
        members.forEach((member) => {
            const recipientSocket = users.get(member.username);
            if (recipientSocket && member.username !== username) {
                sendMessage(recipientSocket, {
                    sender: username,
                    group,
                    text,
                    timestamp,
                });
            }
        });
        logger.info({ username, group, recipients: members.length }, 'Group message dispatched');
    } catch (err) {
        if (err instanceof ValidationError) {
            logger.warn({ username, error: err.message }, 'Validation error for group message');
            sendMessage(socket, { error: err.message });
        } else {
            logger.error({ username, error: err.message, stack: err.stack }, 'Error handling group message');
            sendMessage(socket, { error: 'Failed to handle group message', details: err.message });
        }
    }
};

const handleJoinGroup = async (message, username, socket, groups, logger) => {
    try {
        const msg = JSON.parse(message);
        logger.info({ username, message: msg }, 'Processing join group request');
        const validatedMessage = validateWebSocketMessage(joinGroupSchema)(msg);
        const { group } = validatedMessage;

        let groupData = await findGroupByName(group);
        if (!groupData) {
            groupData = await createGroup(group);
            logger.info({ username, group }, 'Group created');
        }
        await addMemberToGroup(groupData.id, username);
        sendMessage(socket, { message: `Joined group: ${group}` });
        logger.info({ username, group }, 'User joined group');
    } catch (err) {
        if (err instanceof ValidationError) {
            logger.warn({ username, error: err.message }, 'Validation error for join group');
            sendMessage(socket, { error: err.message });
        } else {
            logger.error({ username, error: err.message, stack: err.stack }, 'Error handling join group');
            sendMessage(socket, { error: 'Failed to join group', details: err.message });
        }
    }
};

const handleLeaveGroup = async (message, username, socket, groups, logger) => {
    try {
        const msg = JSON.parse(message);
        logger.info({ username, message: msg }, 'Processing leave group request');
        const validatedMessage = validateWebSocketMessage(leaveGroupSchema)(msg);
        const { group } = validatedMessage;
        const groupData = await findGroupByName(group);
        if (!groupData) {
            logger.warn({ username, group }, 'Group does not exist');
            throw new ValidationError(`Group "${group}" does not exist`);
        }
        await removeMemberFromGroup(groupData.id, username);
        sendMessage(socket, { message: `Left group: ${group}` });
        logger.info({ username, group }, 'User left group');

    } catch (err) {
        if (err instanceof ValidationError) {
            logger.warn({ username, error: err.message }, 'Validation error for leave group');
            sendMessage(socket, { error: err.message });
        } else {
            logger.error({ username, error: err.message, stack: err.stack }, 'Error handling leave group');
            sendMessage(socket, { error: 'Failed to leave group', details: err.message });
        }
    }
};

module.exports = {
    handleGroupMessage,
    handleJoinGroup,
    handleLeaveGroup,
};