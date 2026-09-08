const express = require('express');
const router = express.Router();
const posPatternController = require('../../../controllers/Masters/POSAndBQP/POSPattern.controller');

router.get('/', posPatternController.getPattern);
router.post('/', posPatternController.updatePattern);

module.exports = router;
