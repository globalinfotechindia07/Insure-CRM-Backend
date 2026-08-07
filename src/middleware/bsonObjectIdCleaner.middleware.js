const convertBsonObjectIdToString = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(convertBsonObjectIdToString);
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data) && obj.data.length === 12) {
    return obj.data.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  if (obj.buffer && typeof obj.buffer === 'object') {
    const bufKeys = Object.keys(obj.buffer);
    if (bufKeys.length === 12) {
      let isBuffer = true;
      let hexString = '';
      for (let i = 0; i < 12; i++) {
        const val = obj.buffer[String(i)];
        if (typeof val !== 'number') {
          isBuffer = false;
          break;
        }
        hexString += val.toString(16).padStart(2, '0');
      }
      if (isBuffer) return hexString;
    }
  }

  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = convertBsonObjectIdToString(obj[key]);
    }
  }
  return newObj;
};

const bsonObjectIdCleanerMiddleware = (req, res, next) => {
  if (req.body) req.body = convertBsonObjectIdToString(req.body);
  if (req.query) req.query = convertBsonObjectIdToString(req.query);
  next();
};

module.exports = bsonObjectIdCleanerMiddleware;
