const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bqpController = require('../../../controllers/Masters/POSAndBQP/BQP.controller');

const uploadDir = path.resolve(__dirname, 'uploadBQPCsv');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, file.originalname)
});

const upload = multer({ storage });

router.post('/import-csv', (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) return res.status(400).json({ error: err.message });
        next();
    });
}, bqpController.importCsv);

router.get('/export-csv', bqpController.exportCsv);

router.post('/', bqpController.createBQP);
router.get('/', bqpController.getAllBQP);
router.get('/:id', bqpController.getBQPById);
router.put('/:id', bqpController.updateBQP);
router.delete('/:id', bqpController.deleteBQP);

module.exports = router;
