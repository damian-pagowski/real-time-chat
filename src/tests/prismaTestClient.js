const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db', // Use an in-memory SQLite database
    },
  },
});

module.exports = prisma;