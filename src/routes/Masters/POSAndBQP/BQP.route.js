const express = require('express');
const router = express.Router();
const bqpController = require('../../../controllers/Masters/POSAndBQP/BQP.controller');

router.post('/', bqpController.createBQP);
router.get('/', bqpController.getAllBQP);
router.get('/:id', bqpController.getBQPById);
router.put('/:id', bqpController.updateBQP);
router.delete('/:id', bqpController.deleteBQP);

module.exports = router;
