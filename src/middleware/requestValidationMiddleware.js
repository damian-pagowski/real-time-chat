const { ValidationError } = require('../utils/errors');

const validate = (schema) => (req, reply, done) => {
  const validationParts = {};
  
  if (schema.body) {
    validationParts.body = schema.body.validate(req.body || {}, { abortEarly: false });
  }
  if (schema.query) {
    validationParts.query = schema.query.validate(req.query || {}, { abortEarly: false });
  }
  if (schema.params) {
    validationParts.params = schema.params.validate(req.params || {}, { abortEarly: false });
  }

  const errors = Object.entries(validationParts)
    .filter(([key, result]) => result.error)
    .map(([key, result]) => `${key}: ${result.error.details.map((d) => d.message).join(', ')}`);

  if (errors.length > 0) {
    done(new ValidationError(errors.join('; ')));
  } else {
    done();
  }
};

module.exports = validate;