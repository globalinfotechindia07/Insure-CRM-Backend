const NAME_KEYS = [
  'department',
  'insCompany',
  'insDepartment',
  'brokerName',
  'brokerBranch',
  'categoryOfOrganisation',
  'leadType',
  'leadStage',
  'leadStatus',
  'leadReference',
  'leaveType',
  'profession',
  'position',
  'fuelType',
  'vehicleType',
  'licenseValidity',
  'marineClause',
  'endorsement',
  'otherAddon',
  'riskCode',
  'financialYear',
  'incoterms',
  'subCustomerGroup',
  'prefix',
  'network',
  'priority',
  'status',
  'ticketStatus',
  'taskStatus',
  'name',
  'title',
  'label',
  'category',
  'productOrServiceCategory',
  'subProductCategory',
  'bankName',
  'accountName',
  'code',
  'description',
  'designation'
];

function sortArrayAlphabetically(arr) {
  if (!Array.isArray(arr) || arr.length <= 1) return arr;

  const first = arr[0];
  if (typeof first === 'string') {
    return [...arr].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }));
  }

  if (typeof first === 'object' && first !== null) {
    let sortKey = NAME_KEYS.find((k) => k in first && typeof first[k] === 'string' && first[k].trim() !== '');

    if (!sortKey) {
      sortKey = Object.keys(first).find(
        (k) =>
          typeof first[k] === 'string' &&
          k !== '_id' &&
          k !== 'companyId' &&
          k !== 'createdAt' &&
          k !== 'updatedAt' &&
          !k.endsWith('Id')
      );
    }

    if (sortKey) {
      return [...arr].sort((a, b) => {
        const valA = (a[sortKey] || '').toString();
        const valB = (b[sortKey] || '').toString();
        return valA.localeCompare(valB, undefined, { sensitivity: 'base', numeric: true });
      });
    }
  }

  return arr;
}

const alphabeticalMasterSortMiddleware = (req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    try {
      if (body && typeof body === 'object') {
        if (Array.isArray(body.data)) {
          body.data = sortArrayAlphabetically(body.data);
        } else if (Array.isArray(body)) {
          body = sortArrayAlphabetically(body);
        }
      }
    } catch (err) {
      console.error('Error in alphabeticalMasterSortMiddleware:', err);
    }
    return originalJson(body);
  };

  next();
};

module.exports = alphabeticalMasterSortMiddleware;
