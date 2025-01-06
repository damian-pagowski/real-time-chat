const fastify = require('fastify')({ logger: true });
const websocket = require('@fastify/websocket');
const jwt = require('@fastify/jwt');

// Register plugins
fastify.register(websocket);
fastify.register(jwt, { secret: 'your-secure-secret' });

// In-memory storage for users and groups
const users = new Map(); 
const groups = new Map(); 

function sendMessage(socket, message) {
  socket.send(JSON.stringify(message));
}

function directMessage(message, username, socket) {
  try {
    const { recipient, text } = JSON.parse(message);
    const recipientSocket = users.get(recipient);

    if (recipientSocket) {
      const timestamp = Date.now();
      sendMessage(recipientSocket, { sender: username, text, timestamp });
    } else {
      sendMessage(socket, { error: `User ${recipient} not connected` });
    }
  } catch (err) {
    sendMessage(socket, { error: 'Invalid message format' });
  }
}

function broadcastMessage(message, username, socket) {
  try {
    const { text } = JSON.parse(message);
    const timestamp = Date.now();

    users.forEach((recipientSocket, user) => {
      if (user !== username) {
        sendMessage(recipientSocket, { sender: username, text, timestamp });
      }
    });

    sendMessage(socket, { message: `Broadcast message from ${username}: ${text}` });
  } catch (err) {
    sendMessage(socket, { error: 'Invalid message format' });
  }
}

function joinGroup(message, username, socket) {
  try {
    const { group } = JSON.parse(message);

    if (!groups.has(group)) {
      groups.set(group, new Set());
    }

    groups.get(group).add(username);
    sendMessage(socket, { message: `Joined group: ${group}` });
  } catch (err) {
    sendMessage(socket, { error: 'Invalid message format or group not specified' });
  }
}

function leaveGroup(message, username, socket) {
  try {
    const { group } = JSON.parse(message);

    if (groups.has(group)) {
      groups.get(group).delete(username);
      sendMessage(socket, { message: `Left group: ${group}` });
    }
  } catch (err) {
    sendMessage(socket, { error: 'Invalid message format or group not specified' });
  }
}

function handleGroupMessage(message, username, socket) {
  try {
    const { group, text } = JSON.parse(message);

    if (groups.has(group)) {
      const timestamp = Date.now();
      groups.get(group).forEach((member) => {
        const recipientSocket = users.get(member);
        if (recipientSocket) {
          sendMessage(recipientSocket, { sender: username, group, text, timestamp });
        }
      });
    } else {
      sendMessage(socket, { error: `Group ${group} does not exist` });
    }
  } catch (err) {
    sendMessage(socket, { error: 'Invalid message format or group not specified' });
  }
}


function validateToken(fastify, token) {
  try {
    return fastify.jwt.verify(token.replace('Bearer ', ''));
  } catch (err) {
    throw new Error('Invalid token');
  }
}

fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (socket, req) => {
    const token = req.headers.authorization;
    if (!token) {
      socket.close(4001, 'Unauthorized');
      return;
    }
    let username;
    try {
      const decoded = validateToken(fastify, token);
      username = decoded.username;
      users.set(username, socket);
      console.log(`${username} connected`);
    } catch (err) {
      socket.close(4002, err.message);
      return;
    }
    
      socket.on('close', () => {
        users.delete(username);
        groups.forEach((members) => members.delete(username));
        console.log(`${username} disconnected`);
      });

      socket.on('message', message => {
        const { type } = JSON.parse(message);

        switch (type) {
          case 'broadcast':
            broadcastMessage(message, username, socket);
            break;
          case 'direct':
            directMessage(message, username, socket);
            break;
          case 'join':
            joinGroup(message, username, socket);
            break;
          case 'leave':
            leaveGroup(message, username, socket);
            break;
          case 'groupMessage':
            handleGroupMessage(message, username, socket);
            break;
          default:
            sendMessage(socket, { error: 'Unsupported message type' });
        }
    
      })

  })
})

// REST API routes
fastify.get('/', async () => ({ status: 'up' }));
fastify.register(require('./routes/authRoutes'));


module.exports = fastify;