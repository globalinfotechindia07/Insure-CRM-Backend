const express = require('express');
const router = express.Router();
const bqpPatternController = require('../../../controllers/Masters/POSAndBQP/BQPPattern.controller');

router.get('/', bqpPatternController.getPattern);
router.post('/', bqpPatternController.updatePattern);

module.exports = router;
