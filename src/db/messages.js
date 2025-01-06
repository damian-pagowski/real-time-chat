const db = require('./index');

// Message operations
const addMessage = (sender, recipient, text, groupId = null) => {
  const stmt = db.prepare(
    'INSERT INTO messages (sender, recipient, text, group_id) VALUES (?, ?, ?, ?)'
  );
  return stmt.run(sender, recipient, text, groupId);
};

const getMessagesForGroup = (groupId) => {
  const stmt = db.prepare('SELECT * FROM messages WHERE group_id = ? ORDER BY timestamp DESC');
  return stmt.all(groupId);
};

module.exports = { addMessage, getMessagesForGroup };