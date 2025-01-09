const { getMessagesForGroup, getMessagesBetweenUsers, getConversationsForUser } = require('../db/messages');

module.exports = async (fastify) => {
  fastify.get('/messages/direct', async (req, reply) => {
    const { user1, user2 } = req.query;

    if (!user1 || !user2) {
      reply.status(400).send({ error: 'Both user1 and user2 must be specified' });
      return;
    }

    const messages = getMessagesBetweenUsers(user1, user2);
    reply.send(messages);
  });

  fastify.get('/messages/group/:groupId', async (req, reply) => {
    const { groupId } = req.params;

    if (!groupId) {
      reply.status(400).send({ error: 'Group ID must be specified' });
      return;
    }

    const messages = getMessagesForGroup(groupId);
    reply.send(messages);
  });

  fastify.get('/messages/chats', async (req, reply) => {

    const { user } = req.query;

    if (!user) {
      reply.status(400).send({ error: 'The user query parameter is required.' });
      return;
    }

    try {
      const conversations = getConversationsForUser(user);
      reply.send(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      reply.status(500).send({ error: 'Internal Server Error' });
    }
  });
};