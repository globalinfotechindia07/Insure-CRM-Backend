const express = require('express');
const router = express.Router();
const posController = require('../../../controllers/Masters/POSAndBQP/POS.controller');
// const { verifyToken } = require('../../../middleware/auth.middleware'); // Assuming token middleware is used

// Apply auth middleware if needed
// router.use(verifyToken);

router.post('/', posController.createPOS);
router.get('/', posController.getAllPOS);
router.get('/:id', posController.getPOSById);
router.put('/:id', posController.updatePOS);
router.delete('/:id', posController.deletePOS);

module.exports = router;
