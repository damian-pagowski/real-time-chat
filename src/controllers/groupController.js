
// const { addMessage, findGroupByName, createGroup } = require('../repositories/groupRepository');
const { createGroup, findGroupByName } = require('../db/groups');

const {
    addMessage,
} = require('../db/messages');
// TODO - implement services, then update this ^

const { sendMessage } = require('../utils/socketUtils');

const handleGroupMessage = (message, username, socket, users, groups) => {
  try {
    const { group, text } = JSON.parse(message);

    const groupData = findGroupByName(group);
    if (!groupData) {
      sendMessage(socket, { error: `Group ${group} does not exist` });
      return;
    }

    addMessage(username, null, text, groupData.id);

    const timestamp = Date.now();
    groups.get(group).forEach((member) => {
      const recipientSocket = users.get(member);
      if (recipientSocket) {
        sendMessage(recipientSocket, { sender: username, group, text, timestamp });
      }
    });
  } catch (err) {
    sendMessage(socket, { error: 'Invalid message format for group message' });
  }
};

const handleJoinGroup = (message, username, socket, groups) => {
  try {
    const { group } = JSON.parse(message);

    if (!groups.has(group)) {
      groups.set(group, new Set());
    }
    if (!findGroupByName(group)) {
      createGroup(group);
    }

    groups.get(group).add(username);
    sendMessage(socket, { message: `Joined group: ${group}` });
  } catch (err) {
    sendMessage(socket, { error: 'Invalid message format for joining group' });
  }
};

const handleLeaveGroup = (message, username, socket, groups) => {
  try {
    const { group } = JSON.parse(message);

    if (groups.has(group)) {
      groups.get(group).delete(username);
      sendMessage(socket, { message: `Left group: ${group}` });
    } else {
      sendMessage(socket, { error: `Group ${group} does not exist` });
    }
  } catch (err) {
    sendMessage(socket, { error: 'Invalid message format for leaving group' });
  }
};

module.exports = {
  handleGroupMessage,
  handleJoinGroup,
  handleLeaveGroup,
};