// TODO const { addMessage, getSenderForMessage, markMessageAsRead } = require('../repositories/messageRepository');
const { sendMessage } = require('../utils/socketUtils');

// TODO replace with services later
const {
    addMessage,
    markMessageAsRead,
    getSenderForMessage
} = require('../db/messages');

const handleDirectMessage = (message, username, socket, users) => {
  try {
    const { recipient, text } = JSON.parse(message);
    const recipientSocket = users.get(recipient);

    if (!recipientSocket) {
      sendMessage(socket, { error: `User ${recipient} is not connected` });
      return;
    }

    const { lastInsertRowid } = addMessage(username, recipient, text);
    const timestamp = Date.now();
    sendMessage(recipientSocket, { sender: username, text, messageId: lastInsertRowid, timestamp, type: 'direct' });
  } catch (err) {
    sendMessage(socket, { error: 'Invalid message format for direct message' });
  }
};

const handleReadReceipt = (message, username, socket, users) => {
  try {
    const { messageId } = JSON.parse(message);
    markMessageAsRead(messageId);

    const sender = getSenderForMessage(messageId);
    const senderSocket = users.get(sender);

    if (senderSocket) {
      sendMessage(senderSocket, { type: 'readReceipt', messageId, reader: username });
    }
  } catch (err) {
    sendMessage(socket, { error: 'Invalid message format for read receipt' });
  }
};

module.exports = {
  handleDirectMessage,
  handleReadReceipt,
};