const Department = require('../models/Department');

// Create Department
exports.createDepartment = async (req, res) => {
    try {
        const { name, description } = req.body;
        
        // Check if department already exists
        const existingDept = await Department.findOne({ name: name.toUpperCase() });
        if (existingDept) {
            return res.status(400).json({
                success: false,
                message: 'Department already exists'
            });
        }

        const department = new Department({
            name: name.toUpperCase(),
            description
        });

        await department.save();
        
        res.status(201).json({
            success: true,
            message: 'Department created successfully',
            data: department
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get All Departments
exports.getAllDepartments = async (req, res) => {
    try {
        const departments = await Department.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: departments.length,
            data: departments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Single Department
exports.getDepartmentById = async (req, res) => {
    try {
        const department = await Department.findById(req.params.id);
        
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: department
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update Department
exports.updateDepartment = async (req, res) => {
    try {
        const { name, description, status } = req.body;
        
        const updateData = {};
        if (name) updateData.name = name.toUpperCase();
        if (description !== undefined) updateData.description = description;
        if (status) updateData.status = status;
        updateData.updatedAt = Date.now();
        
        const department = await Department.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Department updated successfully',
            data: department
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete Department
exports.deleteDepartment = async (req, res) => {
    try {
        const department = await Department.findByIdAndDelete(req.params.id);
        
        if (!department) {
            return res.status(404).json({
                success: false,
                message: 'Department not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Department deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Active Departments (for dropdown)
exports.getActiveDepartments = async (req, res) => {
    try {
        const departments = await Department.find({ status: 'active' })
            .select('name description')
            .sort({ name: 1 });
            
        res.status(200).json({
            success: true,
            data: departments
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};