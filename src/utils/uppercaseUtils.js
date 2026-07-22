const EXCLUDED_KEYS = new Set([
  'password',
  'confirmpassword',
  'oldpassword',
  'newpassword',
  'pass',
  'token',
  'refreshtoken',
  'accesstoken',
  'jwt',
  'authorization',
  '_id',
  'image',
  'avatar',
  'file',
  'filepath',
  'filename',
  'path',
  'url',
  'logo',
  'signature',
  'pdf',
  'attachment'
]);

function shouldExcludeKey(key) {
  if (!key) return false;
  const lower = key.toLowerCase();
  return EXCLUDED_KEYS.has(lower);
}

function convertToUppercase(data, keyName = '') {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    if (
      data.startsWith('data:image/') ||
      data.startsWith('data:application/') ||
      data.startsWith('http://') ||
      data.startsWith('https://')
    ) {
      return data;
    }
    return data.toUpperCase();
  }

  if (Array.isArray(data)) {
    return data.map((item) => convertToUppercase(item, keyName));
  }

  if (typeof data === 'object' && !(data instanceof Date)) {
    const newObj = {};
    for (const key of Object.keys(data)) {
      if (shouldExcludeKey(key)) {
        newObj[key] = data[key];
      } else {
        newObj[key] = convertToUppercase(data[key], key);
      }
    }
    return newObj;
  }

  return data;
}

module.exports = {
  convertToUppercase,
  shouldExcludeKey
};
