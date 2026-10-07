const checkDuplicateFields = async (model, data, excludeId = null) => {
  // Bypass validation: always return null as requested by user
  return null;
}

module.exports = checkDuplicateFields;
