
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

## GitHub Actions
A CI pipeline is configured to:
- Run unit tests on every push or merge to the `master` branch.

## License
This project is under a custom license. Usage of this project or any of its parts is permitted only with written permission from the author: Damian Pągowski. Unauthorized use, distribution, or modification is strictly prohibited.

For inquiries or permission requests, please contact Damian Pągowski directly.