
const broadcastPresence = (users, username, status) => {
  const message = {
    type: 'presence',
    user: username,
    status,
  };

  users.forEach((socket) => {
    socket.send(JSON.stringify(message));
  });
};

module.exports = { broadcastPresence };