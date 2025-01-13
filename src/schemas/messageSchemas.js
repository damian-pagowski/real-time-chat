const Joi = require('joi'); 

const directMessageSchema = {
  query: Joi.object({
    user: Joi.string().required(),
  }),
  body: Joi.object({}),
  params: Joi.object({}), 
};

const groupMessageSchema = {
  params: Joi.object({
    groupId: Joi.string().required(),
  }),
  query: Joi.object({}), 
  body: Joi.object({}), 
};

const chatsSchema = {
  query: Joi.object({}),
  body: Joi.object({}),
  params: Joi.object({}), 
};

module.exports = {
  directMessageSchema,
  groupMessageSchema,
  chatsSchema,
};