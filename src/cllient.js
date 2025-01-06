

const WebSocket = require('ws');


const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNsaWVudCIsImlhdCI6MTczNjE5MTE3M30.FPMsfukpdUtb3xmm7_MLG1Yu1SFH1R13OVAKc8aSgdc';


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
  console.log('Received:', data.toString());
});

// Event: When an error occurs
ws.on('error', (err) => {
  console.error('WebSocket error:', err);
});

// Event: When the WebSocket connection is closed
ws.on('close', () => {
  console.log('WebSocket connection closed');
});