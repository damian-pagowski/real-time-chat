
# WebSocketeer: Real-Time WebSocket Chat Application

## Overview
WebSocketeer is a real-time chat application built using Node.js, Fastify, and WebSocket. It supports user-to-user messaging, group chats, and presence tracking, offering a seamless communication experience.

## Features
- **Direct Messaging:** Send messages to specific users in real time.
- **Group Chats:** Join groups, send group messages, and manage group memberships.
- **Presence Tracking:** Track when users come online or go offline.
- **Typing Indicators:** Notify other users when someone is typing.
- **Message Persistence:** Save messages to a database for future retrieval.
- **Logging:** Centralized logging for debugging and insights.
- **Validation:** Schema validation for WebSocket messages and HTTP requests.
- **Unit Tests:** Comprehensive tests for controllers, middleware, and repositories.
- **Continuous Integration:** Automated GitHub Actions workflow for testing on every push or merge to master.

## Tech Stack
- **Backend:** Node.js, Fastify
- **WebSocket:** @fastify/websocket
- **Database:** Prisma with SQLite
- **Authentication:** JWT (JSON Web Tokens)
- **Validation:** Joi for HTTP and WebSocket messages
- **Testing:** Jest for unit tests
- **Deployment:** Ready for containerization and cloud hosting

## Getting Started

### Prerequisites
- Node.js >= 16
- npm >= 8
- SQLite installed (optional, database file is created automatically)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/WebSocketeer.git
   cd WebSocketeer
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration
1. Copy the `.env.example` to `.env` and configure environment variables:
   ```bash
   cp .env.example .env
   ```
2. Update the JWT secret and database URL in `.env`:
   ```
   JWT_SECRET=your-secure-secret
   DATABASE_URL=file:./dev.db
   ```

### Run the Application
1. Start the server:
   ```bash
   npm start
   ```
2. Access the application at `http://localhost:3000`.

### Run Tests
```bash
npm test
```

## Logging
Logging is implemented using Fastify's built-in logger. Logs include:
- Incoming WebSocket messages
- Error details for debugging
- User activity (e.g., connection and disconnection events)

### Useful Commands

1. Initialize the Database for the First Time
   ```bash
   npx prisma generate
   npx prisma db push
   ```
2. Reset the Database:
   ```bash
   npx prisma migrate reset
   ```
3. Deploy Migrations
   ```bash
   npx prisma migrate deploy
   ```
4. Generate Prisma Client
   ```bash
   npx prisma generate
   ```
5. Inspect Database with Prisma Studio
   ```bash
   npx prisma studio
   ```

## Docker

1. Optional - running cleanup tool
   ```bash
   docker system prune -a --volumes
   ```

2. Rebuild and start service
   ```bash
   docker-compose up --build  
   ```

## WebSocket Messages

The WebSocket API supports various message types for real-time communication. Below is the list of supported message types, their payload formats, and expected responses.

### 1. Direct Message
   Payload:
   ```json
   {
     "type": "direct",
     "recipient": "client",
     "text": "test message"
   }
   ```
   Response:
   ```json
   {
     "type": "direct",
     "sender": "testuser1",
     "text": "test message",
     "timestamp": 1736772049828
   }
   ```

### 2. Typing Indicator
   Start Typing Payload:
   ```json
   {
     "type": "typing",
     "status": "startTyping",
     "recipient": "client"
   }
   ```
   Stop Typing Payload:
   ```json
   {
     "type": "typing",
     "status": "stopTyping",
     "recipient": "client"
   }
   ```
   Response to Recipient:
   ```json
   {
     "type": "typing",
     "sender": "testuser1",
     "status": "startTyping"
   }
   ```

### 3. Read Receipt
   Payload:
   ```json
   {
     "type": "readReceipt",
     "messageId": 1
   }
   ```
   Response to Sender:
   ```json
   {
     "type": "readReceipt",
     "messageId": 1,
     "reader": "testuser2"
   }
   ```

### 4. Group Messages
   Join Group:
   ```json
   {
     "type": "join",
     "group": "dev"
   }
   ```
   Send Group Message:
   ```json
   {
     "type": "groupMessage",
     "text": "hello group",
     "group": "dev"
   }
   ```
   Response to Group Members:
   ```json
   {
     "type": "groupMessage",
     "sender": "testuser1",
     "group": "dev",
     "text": "hello group",
     "timestamp": 1736772049828
   }
   ```
   Leave Group:
   ```json
   {
     "type": "leave",
     "group": "dev"
   }
   ```

### 5. Broadcast Message
   Payload:
   ```json
   {
     "type": "broadcast",
     "text": "meh broadcast message"
   }
   ```
   Response to All Recipients:
   ```json
   {
     "type": "broadcast",
     "sender": "testuser1",
     "text": "meh broadcast message",
     "timestamp": 1736772049828
   }
   ```

## GitHub Actions
A CI pipeline is configured to:
- Run unit tests on every push or merge to the `master` branch.

## Prometheus
Start Prometheus with the following command:
   ```bash
   prometheus --config.file=prometheus.yml
   ```
Access the Prometheus UI at:
   ```bash
   http://localhost:9090
   ```

## License
This project is under a custom license. Usage of this project or any of its parts is permitted only with written permission from the author: Damian Pągowski. Unauthorized use, distribution, or modification is strictly prohibited.

For inquiries or permission requests, please contact Damian Pągowski directly.
