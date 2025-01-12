const {
  getMessagesBetweenUsers,
  getMessagesForGroup,
  getConversationUsernames
} = require('../repositories/messageRepository');
const { ServerError } = require('../utils/errors');

const getDirectMessages = async (req, reply) => {
  const { user1, user2 } = req.query;
  req.log.info({ user1, user2 }, 'Fetching direct messages');
  try {
    const messages = await getMessagesBetweenUsers(user1, user2);
    req.log.info({ user1, user2, messageCount: messages.length }, 'Direct messages fetched successfully');
    reply.send(messages);
  } catch (error) {
    req.log.error({ error: error.message, user1, user2 }, 'Failed to fetch direct messages');
    throw new ServerError('Failed to fetch direct messages');
  }
};

const getGroupMessages = async (req, reply) => {
  const { groupId } = req.params;
  const parsedGroupId = parseInt(groupId);
  req.log.info({ groupId: parsedGroupId }, 'Fetching group messages');
  try {
    const messages = await getMessagesForGroup(parsedGroupId);
    req.log.info({ groupId: parsedGroupId, messageCount: messages.length }, 'Group messages fetched successfully');
    reply.send(messages);
  } catch (error) {
    req.log.error({ error: error.message, groupId: parsedGroupId }, 'Failed to fetch group messages');
    throw new ServerError('Failed to fetch group messages');
  }
};

const getUserConversationsNames = async (req, reply) => {
  const { user } = req.query;
  req.log.info({ user }, 'Fetching user conversations');
  try {
    const conversations = await getConversationUsernames(user);
    req.log.info({ user, conversationCount: conversations.length }, 'User conversations fetched successfully');
    reply.send(conversations);
  } catch (error) {
    req.log.error({ error: error.message, user }, 'Failed to fetch user conversations');
    throw new ServerError('Failed to fetch user conversations');
  }
};

module.exports = {
  getDirectMessages,
  getGroupMessages,
  getUserConversationsNames,
};