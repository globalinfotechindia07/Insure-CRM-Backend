const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');

// Routes
router.post('/', departmentController.createDepartment);           // Create
router.get('/', departmentController.getAllDepartments);           // Get all
router.get('/active', departmentController.getActiveDepartments);  // Get active only
router.get('/:id', departmentController.getDepartmentById);        // Get single
router.put('/:id', departmentController.updateDepartment);         // Update
router.delete('/:id', departmentController.deleteDepartment);      // Delete

module.exports = router;