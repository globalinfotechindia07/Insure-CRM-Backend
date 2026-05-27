const Company = require('../models/Company');

// Create company
exports.createcompany = async (req, res) => {
    try {
        console.log("Received request body:", req.body);
        
        // Accept both 'name' and 'company' field names
        const companyName = req.body.name || req.body.company;
        
        // Check if name is provided
        if (!companyName) {
            return res.status(400).json({
                success: false,
                message: 'Company name is required'
            });
        }
        
        // Check if company already exists
        const existingCompany = await Company.findOne({ name: companyName.toUpperCase() });
        if (existingCompany) {
            return res.status(400).json({
                success: false,
                message: 'Company already exists'
            });
        }

        // Create new company
        const newCompany = new Company({
            name: companyName.toUpperCase(),
            description: req.body.description || ''
        });

        await newCompany.save();
        
        res.status(201).json({
            success: true,
            message: 'Company created successfully',
            data: newCompany
        });
    } catch (error) {
        console.error("Error creating company:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get All companies
exports.getAllcompanies = async (req, res) => {
    try {
        const companies = await Company.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: companies.length,
            data: companies
        });
    } catch (error) {
        console.error("Error fetching companies:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Single company
exports.getCompanyById = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: company
        });
    } catch (error) {
        console.error("Error fetching company:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update company
exports.updateCompany = async (req, res) => {
    try {
        const { name, description, status } = req.body;
        
        const updateData = {};
        
        // Handle both 'name' and 'company' field from frontend
        if (name) updateData.name = name.toUpperCase();
        if (req.body.company) updateData.name = req.body.company.toUpperCase();
        if (description !== undefined) updateData.description = description;
        if (status) updateData.status = status;
        
        const updatedCompany = await Company.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedCompany) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Company updated successfully',
            data: updatedCompany
        });
    } catch (error) {
        console.error("Error updating company:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete company
exports.deleteCompany = async (req, res) => {
    try {
        const deletedCompany = await Company.findByIdAndDelete(req.params.id);
        
        if (!deletedCompany) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }
        
        res.status(200).json({
            success: true,
            message: 'Company deleted successfully'
        });
    } catch (error) {
        console.error("Error deleting company:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get Active companies (for dropdown)
exports.getActiveCompanies = async (req, res) => {
    try {
        const companies = await Company.find({ status: 'active' })
            .select('name description')
            .sort({ name: 1 });
            
        res.status(200).json({
            success: true,
            data: companies
        });
    } catch (error) {
        console.error("Error fetching active companies:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};