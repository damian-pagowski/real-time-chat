const db = require('./index');

// User operations
const createUser = (username, password) => {
  const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
  return stmt.run(username, password);
};

const findUserByUsername = (username) => {
  const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
  return stmt.get(username);
};

module.exports = { createUser, findUserByUsername };