const Joi = require('joi');

// Schema for 'direct' messages
const directMessageSchema = Joi.object({
    type: Joi.string().valid('direct').required(),
    recipient: Joi.string().required().messages({
        'string.base': '"recipient" must be a string',
        'string.empty': '"recipient" is required',
    }),
    text: Joi.string().min(1).required().messages({
        'string.base': '"text" must be a string',
        'string.empty': '"text" is required',
        'string.min': '"text" cannot be empty',
    }),
});

// Schema for 'readReceipt' messages
const readReceiptSchema = Joi.object({
    type: Joi.string().valid('readReceipt').required(),
    messageId: Joi.number().integer().positive().required().messages({
        'number.base': '"messageId" must be a number',
        'number.integer': '"messageId" must be an integer',
        'number.positive': '"messageId" must be a positive number',
        'any.required': '"messageId" is required',
    }),
});

// Schema for 'groupMessage' messages
const groupMessageSchema = Joi.object({
    type: Joi.string().valid('groupMessage').required(), 
    group: Joi.string().required().messages({
        'string.base': '"group" must be a string',
        'string.empty': '"group" is required',
    }),
    text: Joi.string().min(1).required().messages({
        'string.base': '"text" must be a string',
        'string.empty': '"text" is required',
        'string.min': '"text" cannot be empty',
    }),
});

// Schema for 'join' messages
const joinGroupSchema = Joi.object({
    type: Joi.string().valid('join').required(), 
    group: Joi.string().required().messages({
        'string.base': '"group" must be a string',
        'string.empty': '"group" is required',
    }),
});

// Schema for 'leave' messages
const leaveGroupSchema = Joi.object({
    type: Joi.string().valid('leave').required(), 
    group: Joi.string().required().messages({
        'string.base': '"group" must be a string',
        'string.empty': '"group" is required',
    }),
});

const broadcastMessageSchema = Joi.object({
    type: Joi.string().valid('broadcast').required().messages({
        'string.base': '"type" must be a string',
        'any.only': '"type" must be "broadcast"',
        'any.required': '"type" is required',
    }),
    text: Joi.string().min(1).required().messages({
        'string.base': '"text" must be a string',
        'string.empty': '"text" is required',
        'string.min': '"text" cannot be empty',
    }),
});

// Schema for 'typing' messages
const typingMessageSchema = Joi.object({
    type: Joi.string().valid('typing').required().messages({
        'string.base': '"type" must be a string',
        'any.only': '"type" must be "typing"',
        'any.required': '"type" is required',
    }),
    status: Joi.string().valid('startTyping', 'stopTyping').required().messages({
        'string.base': '"status" must be a string',
        'any.only': '"status" must be one of ["startTyping", "stopTyping"]',
        'any.required': '"status" is required',
    }),
    recipient: Joi.string().optional().messages({
        'string.base': '"recipient" must be a string',
    }),
    group: Joi.string().optional().messages({
        'string.base': '"group" must be a string',
    }),
}).xor('recipient', 'group').messages({
    'object.missing': 'Either "recipient" or "group" must be provided',
    'object.xor': 'Only one of "recipient" or "group" can be specified',
});

module.exports = {
    directMessageSchema,
    groupMessageSchema,
    readReceiptSchema,
    joinGroupSchema,
    leaveGroupSchema,
    broadcastMessageSchema,
    typingMessageSchema
};