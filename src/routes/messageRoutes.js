const authenticationMiddleware = require('../middleware/authentication');
const { getMessagesForGroup, getMessagesBetweenUsers, getConversationsForUser } = require('../db/messages');
const { ValidationError, ServerError } = require('../utils/errors');

module.exports = async (fastify) => {
  fastify.get('/messages/direct', { preHandler: authenticationMiddleware }, async (req, reply) => {
    const { user1, user2 } = req.query;
    if (!user1 || !user2) {
      throw new ValidationError('Both user1 and user2 must be specified');
    }
    try {
      const messages = getMessagesBetweenUsers(user1, user2);
      reply.send(messages);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServerError('Failed to fetch direct messages');
    }
  });

  fastify.get('/messages/group/:groupId', { preHandler: authenticationMiddleware }, async (req, reply) => {
    const { groupId } = req.params;
    if (!groupId) {
      throw new ValidationError('Group ID must be specified');
    }
    try {
      const messages = getMessagesForGroup(groupId);
      reply.send(messages);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServerError('Failed to fetch group messages');
    }
  });

  fastify.get('/messages/chats', { preHandler: authenticationMiddleware }, async (req, reply) => {
    const { user } = req.query;
    if (!user) {
      throw new ValidationError('The user query parameter is required');
    }
    try {
      const conversations = getConversationsForUser(user);
      reply.send(conversations);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServerError('Failed to fetch conversations');
    }
  });
};