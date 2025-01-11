const Joi = require('joi');
const { ValidationError } = require('../utils/errors');

const validateWebSocketMessage = (schema) => (message) => {
    const { error, value } = schema.validate(message, { abortEarly: false });
    if (error) {
        throw new ValidationError(`WebSocket message validation failed: ${error.details.map((e) => e.message).join(', ')}`);
    }
    return value;
};

module.exports = validateWebSocketMessage;