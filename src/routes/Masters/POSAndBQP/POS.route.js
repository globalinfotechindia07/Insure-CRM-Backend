const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const posController = require('../../../controllers/Masters/POSAndBQP/POS.controller');
// const { verifyToken } = require('../../../middleware/auth.middleware'); // Assuming token middleware is used

// Apply auth middleware if needed
// router.use(verifyToken);

const uploadDir = path.resolve(__dirname, 'uploadPOSCsv');
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
}, posController.importCsv);

router.get('/export-csv', posController.exportCsv);

router.post('/', posController.createPOS);
router.get('/', posController.getAllPOS);
router.get('/:id', posController.getPOSById);
router.put('/:id', posController.updatePOS);
router.delete('/:id', posController.deletePOS);

module.exports = router;
