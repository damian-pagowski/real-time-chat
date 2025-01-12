const { 
  getDirectMessages, 
  getGroupMessages, 
  getUserConversationsNames 
} = require('../controllers/messageController');
const authenticationMiddleware = require('../middleware/authenticationMiddleware');
const validate = require('../middleware/requestValidationMiddleware');
const { directMessageSchema, groupMessageSchema, chatsSchema } = require('../schemas/messageSchemas');

module.exports = async (fastify) => {
  fastify.get(
    '/messages/direct',
    {
      preHandler: [
        authenticationMiddleware,
        validate(directMessageSchema),
      ],
    },
    getDirectMessages
  );

  fastify.get(
    '/messages/group/:groupId',
    {
      preHandler: [
        authenticationMiddleware,
        validate(groupMessageSchema),
      ],
    },
    getGroupMessages
  );

  fastify.get(
    '/messages/chats',
    {
      preHandler: [
        authenticationMiddleware,
        validate(chatsSchema),
      ],
    },
    getUserConversationsNames
  );
};