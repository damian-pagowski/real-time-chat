const db = require('./index');

// Group operations
const createGroup = (name) => {
  const stmt = db.prepare('INSERT INTO groups (name) VALUES (?)');
  return stmt.run(name);
};

const findGroupByName = (name) => {
  const stmt = db.prepare('SELECT * FROM groups WHERE name = ?');
  return stmt.get(name);
};

module.exports = { createGroup, findGroupByName };