const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');

// Routes
router.post('/', companyController.createcompany);           // Create
router.get('/', companyController.getAllcompanies);          // Get all
router.get('/active', companyController.getActiveCompanies); // Get active only
router.get('/:id', companyController.getCompanyById);        // Get single
router.put('/:id', companyController.updateCompany);         // Update
router.delete('/:id', companyController.deleteCompany);      // Delete

module.exports = router;