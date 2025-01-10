const { sendMessage } = require('../utils/socketUtils');

const handleBroadcastMessage = (message, username, socket, users) => {
    try {
        const { text } = JSON.parse(message);

        const timestamp = Date.now();
        users.forEach((recipientSocket, user) => {
            if (user !== username) {
                sendMessage(recipientSocket, { 
                    sender: username, 
                    text, 
                    timestamp, 
                    type: "broadcast" 
                });
            }
        });

        sendMessage(socket, { message: `Broadcast sent: ${text}` });
    } catch (err) {
        sendMessage(socket, { error: 'Invalid message format for broadcast', details: err.message });
    }
};

module.exports = { handleBroadcastMessage };