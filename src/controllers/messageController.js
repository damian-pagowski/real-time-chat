const {
  getMessagesBetweenUsers,
  getMessagesForGroup,
  getConversationUsernames,
} = require('../repositories/messageRepository');
const {findGroupByName} = require('../repositories/groupRepository');
const { ServerError } = require('../utils/errors');

const getDirectMessages = async (req, reply) => {
  const { user } = req.query;
  const authenticatedUser = req.user;
  req.log.info({ user1: authenticatedUser, user2: user }, 'Fetching direct messages');
  try {
    const messages = await getMessagesBetweenUsers(authenticatedUser, user);
    req.log.info({ user1: authenticatedUser, user2: user, messageCount: messages.length }, 'Direct messages fetched successfully');
    reply.send(messages);
  } catch (error) {
    req.log.error({ error: error.message, user1: authenticatedUser, user2: user }, 'Failed to fetch direct messages');
    throw new ServerError('Failed to fetch direct messages');
  }
};

const getGroupMessages = async (req, reply) => {
  const { groupId } = req.params;
  req.log.info({ group: groupId }, 'Fetching group messages');
  try {
    const groupData = await findGroupByName(groupId);
    const messages = await getMessagesForGroup(groupData.id);
    req.log.info({ groupId: groupData.id, messageCount: messages.length }, 'Group messages fetched successfully');
    reply.send(messages);
  } catch (error) {
    req.log.error({ error: error.message, groupId }, 'Failed to fetch group messages');
    throw new ServerError('Failed to fetch group messages');
  }
};

const getUserConversationsNames = async (req, reply) => {
  const user = req.user;
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