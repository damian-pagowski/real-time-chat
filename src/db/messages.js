const db = require('./index');

// Add a message to the database
const addMessage = (sender, recipient, text, groupId = null) => {
  const stmt = db.prepare(
    'INSERT INTO messages (sender, recipient, text, group_id) VALUES (?, ?, ?, ?)'
  );
  return stmt.run(sender, recipient, text, groupId);
};

// Get messages for a specific group
const getMessagesForGroup = (groupId) => {
  const stmt = db.prepare('SELECT * FROM messages WHERE group_id = ? ORDER BY timestamp DESC');
  return stmt.all(groupId);
};

// Mark a message as read
const markMessageAsRead = (messageId) => {
  const stmt = db.prepare('UPDATE messages SET read = TRUE WHERE id = ?');
  return stmt.run(messageId);
};

// Get unread messages for a specific user
const getUnreadMessagesForUser = (username) => {
  const stmt = db.prepare(
    'SELECT * FROM messages WHERE recipient = ? AND read = FALSE ORDER BY timestamp ASC'
  );
  return stmt.all(username);
};

const getConversationsForUser = (user) => {
  const stmt = db.prepare(`
    SELECT DISTINCT
      CASE
        WHEN sender = ? THEN recipient
        ELSE sender
      END AS username,
      MAX(timestamp) AS last_interaction,
      (
        SELECT text
        FROM messages
        WHERE (sender = ? OR recipient = ?)
        ORDER BY timestamp DESC
        LIMIT 1
      ) AS lastMessage
    FROM messages
    WHERE sender = ? OR recipient = ?
    GROUP BY username
    ORDER BY last_interaction DESC;
  `);

  return stmt.all(user, user, user, user, user); 
};

// Get all messages exchanged between two users
const getMessagesBetweenUsers = (user1, user2) => {
  const stmt = db.prepare(`
    SELECT * FROM messages 
    WHERE (sender = ? AND recipient = ?) OR (sender = ? AND recipient = ?)
    ORDER BY timestamp ASC
  `);
  return stmt.all(user1, user2, user2, user1);
};

const getSenderForMessage = (messageId) => {
  const stmt = db.prepare('SELECT sender FROM messages WHERE id = ?');
  const result = stmt.get(messageId);

  if (!result) {
    throw new Error(`Message with ID ${messageId} not found`);
  }

  return result.sender;
};

module.exports = {
  addMessage,
  getMessagesForGroup,
  markMessageAsRead,
  getUnreadMessagesForUser,
  getMessagesBetweenUsers,
  getConversationsForUser,
  getSenderForMessage
};