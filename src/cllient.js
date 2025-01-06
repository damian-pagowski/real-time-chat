

const WebSocket = require('ws');


const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNsaWVudCIsImlhdCI6MTczNjIwMzc1OX0.ump-Y0VngFGkkDwfaD5flx3SoJahoO8pwCYFhofxaZE';



const ws = new WebSocket(`ws://localhost:3000/ws`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Event: When the WebSocket connection is opened
ws.on('open', () => {
  console.log(`Connected to WebSocket server`);
});

// Event: When a message is received
ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('Received:', message);

  // Check if the message has an ID to send a read receipt
  if (message.messageId) {
    const ack = JSON.stringify({
      type: 'readReceipt',
      messageId: message.messageId,
    });

    ws.send(ack);
    console.log(`Acknowledgment sent for messageId: ${message.messageId}`);
  }
});

// Event: When an error occurs
ws.on('error', (err) => {
  console.error('WebSocket error:', err);
});

// Event: When the WebSocket connection is closed
ws.on('close', () => {
  console.log('WebSocket connection closed');
});