const sendMessage = (socket, message) => {
    socket.send(JSON.stringify(message));
};

module.exports = {
    sendMessage,
};