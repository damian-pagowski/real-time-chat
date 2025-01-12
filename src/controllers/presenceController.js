const broadcastPresence = (users, username, status, logger) => {
  const message = {
    type: 'presence',
    user: username,
    status,
  };
  try {
    logger.info({ username, status, userCount: users.size }, 'Broadcasting presence update');

    users.forEach((socket, user) => {
      if (user !== username) {
        try {
          socket.send(JSON.stringify(message));
          logger.info({ targetUser: user, status }, 'Presence update sent successfully');
        } catch (err) {
          logger.error({ targetUser: user, error: err.message }, 'Failed to send presence update');
        }
      }
    });
    logger.info({ username, status, userCount: users.size }, 'Presence broadcast completed');
  } catch (err) {
    logger.error({ error: err.message }, 'Failed to broadcast presence update');
  }
};

module.exports = { broadcastPresence };