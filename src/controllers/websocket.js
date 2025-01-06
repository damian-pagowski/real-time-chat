const {
    addMessage,
    markMessageAsRead,
    getMessagesForGroup,
    getMessagesBetweenUsers,
    getSenderForMessage
  } = require('../db/messages');


const { createGroup, findGroupByName } = require('../db/groups');
const { findUserByUsername } = require('../db/users');

const sendMessage = (socket, message) => {
    socket.send(JSON.stringify(message));
};

const handleDirectMessage = (message, username, socket, users) => {
    try {
      const { recipient, text } = JSON.parse(message);
      const recipientSocket = users.get(recipient);
  
      if (!recipientSocket) {
        sendMessage(socket, { error: `User ${recipient} is not connected` });
        return;
      }
  
      // Save the message to the database
      const { lastInsertRowid } = addMessage(username, recipient, text);
  
      // Send the message to the recipient
      const timestamp = Date.now();
      sendMessage(recipientSocket, { sender: username, text, messageId: lastInsertRowid, timestamp });
    } catch (err) {
      sendMessage(socket, { error: 'Invalid message format for direct message' });
    }
  };
  
  const handleReadReceipt = (message, username, socket, users) => {
    try {
      const { messageId } = JSON.parse(message);
  
      // Mark the message as read in the database
      markMessageAsRead(messageId);
  
      // Notify the sender about the read receipt
      const sender = getSenderForMessage(messageId); // Fetch sender from the database
      const senderSocket = users.get(sender);
  
      if (senderSocket) {
        sendMessage(senderSocket, { type: 'readReceipt', messageId, reader: username });
      }
    } catch (err) {
      sendMessage(socket, { error: 'Invalid message format for read receipt' });
    }
  };

const handleBroadcastMessage = (message, username, socket, users) => {
    try {
        const { text } = JSON.parse(message);

        // Broadcast to all connected users except the sender
        const timestamp = Date.now();
        users.forEach((recipientSocket, user) => {
            if (user !== username) {
                sendMessage(recipientSocket, { sender: username, text, timestamp });
            }
        });

        // Optionally save the broadcast to the database if needed
        sendMessage(socket, { message: `Broadcast sent: ${text}` });
    } catch (err) {
        sendMessage(socket, { error: 'Invalid message format for broadcast' });
    }
};

const handleGroupMessage = (message, username, socket, users, groups) => {
    try {
        const { group, text } = JSON.parse(message);

        // Validate the group exists
        const groupData = findGroupByName(group);
        if (!groupData) {
            sendMessage(socket, { error: `Group ${group} does not exist` });
            return;
        }

        // Save the message to the database
        addMessage(username, null, text, groupData.id);

        // Send the message to all members of the group
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

        // Create the group if it doesn't exist
        if (!groups.has(group)) {
            groups.set(group, new Set());
        }
        if(!findGroupByName(group)){
            createGroup(group);
        }

        // Add the user to the group
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

// WebSocket route handler
module.exports = async (fastify) => {
    fastify.get('/ws', { websocket: true }, (socket, req) => {
        const token = req.headers.authorization;

        if (!token) {
            socket.close(4001, 'Unauthorized');
            return;
        }

        // Validate token and extract username
        let username;
        try {
            const decoded = fastify.jwt.verify(token.replace('Bearer ', ''));
            username = decoded.username;
        } catch (err) {
            socket.close(4002, 'Invalid token');
            return;
        }

        // Track the user's connection
        const users = fastify.users || new Map();
        fastify.users = users;
        users.set(username, socket);

        // Track groups
        const groups = fastify.groups || new Map();
        fastify.groups = groups;

        // Handle incoming messages
        socket.on('message', (message) => {
            try {
                const { type } = JSON.parse(message);

                switch (type) {
                    case 'direct':
                        handleDirectMessage(message, username, socket, users);
                        break;
                    case 'broadcast':
                        handleBroadcastMessage(message, username, socket, users);
                        break;
                    case 'groupMessage':
                        handleGroupMessage(message, username, socket, users, groups);
                        break;
                    case 'join':
                        handleJoinGroup(message, username, socket, groups);
                        break;
                    case 'leave':
                        handleLeaveGroup(message, username, socket, groups);
                        break;
                    case 'readReceipt':
                        handleReadReceipt(message, username, socket, users);
                        break;
                    default:
                        sendMessage(socket, { error: 'Unsupported message type' });
                }
            } catch (err) {
                sendMessage(socket, { error: 'Error processing message' });
            }
        });

        // Handle disconnection
        socket.on('close', () => {
            users.delete(username);
            groups.forEach((members) => members.delete(username));
            console.log(`${username} disconnected`);
        });
    });
};