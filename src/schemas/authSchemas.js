const Joi = require('joi');

const registerSchema = {
  body: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string().min(6).required(),
  }),
  query: Joi.object({}), 
  params: Joi.object({}),
};

const loginSchema = {
  body: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
  }),
  query: Joi.object({}), 
  params: Joi.object({}),
};

module.exports = {
  registerSchema,
  loginSchema,
};