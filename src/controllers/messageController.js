const { 
    getMessagesBetweenUsers, 
    getMessagesForGroup, 
    getConversationUsernames 
  } = require('../repositories/messageRepository');
  const { ValidationError, ServerError } = require('../utils/errors');
  
  const getDirectMessages = async (req, reply) => {
    const { user1, user2 } = req.query;
    try {
      const messages = await getMessagesBetweenUsers(user1, user2);
      reply.send(messages);
    } catch (error) {
      throw new ServerError('Failed to fetch direct messages');
    }
  };
  
  const getGroupMessages = async (req, reply) => {
    const { groupId } = req.params;
    const parsedGroupId = parseInt(groupId);
    try {
      const messages = await getMessagesForGroup(parsedGroupId);
      reply.send(messages);
    } catch (error) {
      throw new ServerError('Failed to fetch group messages');
    }
  };
  
  const getUserConversationsNames = async (req, reply) => {
    const { user } = req.query;
    try {
      const conversations = await getConversationUsernames(user);
      reply.send(conversations);
    } catch (error) {
      throw new ServerError('Failed to fetch user conversations');
    }
  };
  
  module.exports = {
    getDirectMessages,
    getGroupMessages,
    getUserConversationsNames,
  };