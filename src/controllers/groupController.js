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

const handleGroupMessage = async (message, username, socket, users, groups) => {
    try {
        const msg = JSON.parse(message);
        const validatedMessage = validateWebSocketMessage(groupMessageSchema)(msg);
        const { group, text } = validatedMessage;
        const groupData = await findGroupByName(group);
        await addMessage(username, null, text, groupData.id);

        const timestamp = Date.now();
        const members = await getGroupMembers(groupData.id);
        members.forEach((member) => {
            const recipientSocket = users.get(member.username);
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

const handleJoinGroup = async (message, username, socket, groups) => {
    try {
        const msg = JSON.parse(message);
        const validatedMessage = validateWebSocketMessage(joinGroupSchema)(msg);
        const { group } = validatedMessage;

        let groupData = await findGroupByName(group);
        if (!groupData) {
            groupData = await createGroup(group);
        }
        await addMemberToGroup(groupData.id, username);
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

const handleLeaveGroup = async (message, username, socket, groups) => {
    try {
        const msg = JSON.parse(message);
        const validatedMessage = validateWebSocketMessage(leaveGroupSchema)(msg);
        const { group } = validatedMessage;
        const groupData = await findGroupByName(group);
        await removeMemberFromGroup(groupData.id, username);
        sendMessage(socket, { message: `Left group: ${group}` });
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