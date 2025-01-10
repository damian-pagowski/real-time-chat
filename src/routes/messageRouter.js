const authenticationMiddleware = require('../middleware/authenticationMiddleware');
const { getMessagesForGroup, getMessagesBetweenUsers, getConversationsForUser } = require('../db/messages');
const { directMessageSchema, groupMessageSchema, chatsSchema } = require('../schemas/messageSchemas');
const validate = require('../middleware/validationMiddleware');

module.exports = async (fastify) => {
  fastify.get(
    '/messages/direct',
    {
      preHandler: [
        authenticationMiddleware,
        validate(directMessageSchema)
      ],
    },
    async (req, reply) => {
      const { user1, user2 } = req.query;
      const messages = getMessagesBetweenUsers(user1, user2);
      reply.send(messages);
    });

  fastify.get(
    '/messages/group/:groupId',
    {
      preHandler: [
        authenticationMiddleware,
        validate(groupMessageSchema)
      ],
    },
    async (req, reply) => {
      const { groupId } = req.params;
      const messages = getMessagesForGroup(groupId);
      reply.send(messages);
    }
  );

  fastify.get(
    '/messages/chats',
    {
      preHandler: [
        authenticationMiddleware,
        validate(chatsSchema)
      ],
    },
    async (req, reply) => {
      const { user } = req.query;
      const conversations = getConversationsForUser(user);
      reply.send(conversations);
    }
  );
};