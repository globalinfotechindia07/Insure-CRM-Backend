const { convertToUppercase } = require('../utils/uppercaseUtils');

const uppercasePayloadMiddleware = (req, res, next) => {
  try {
    if (req.body) {
      req.body = convertToUppercase(req.body);
    }
    if (req.query) {
      req.query = convertToUppercase(req.query);
    }
    if (req.params) {
      req.params = convertToUppercase(req.params);
    }
  } catch (error) {
    console.error('Error in uppercasePayloadMiddleware:', error);
  }
  next();
};

module.exports = uppercasePayloadMiddleware;
