module.exports.adminController = require("./admin.controller");
module.exports.companyController = require("./companySetup.controller");
module.exports.departmentController = require("./departmentSetup.controller");
//todo superAdmin
module.exports.superAdminController = require("./superAdmin.controller");



//todo: New Masters
module.exports.bankingDetailsController = require("./Masters/Banking-Details/bankingDetails.controller");
module.exports.productOrServiceCategoryController = require("./Masters/productOrServiceCategory/productOrServiceCategory.controller");
module.exports.subProductCategoryController = require("./Masters/SubProductCategory/SubProductCategory.controller");
module.exports.leaveTypeController = require("./Masters/LeaveType/leaveType.controller");
module.exports.leadReferenceController = require("./Masters/LeadReference/LeadReference.controller");
module.exports.leadStatusController = require("./Masters/LeadStatus/leadStatus.controller");
module.exports.leadStageController = require("./Masters/LeadStage/leadStage.controller");
module.exports.leadTypeController = require("./Masters/LeadType/leadType.controller");
module.exports.categoryOfOrganisationController = require("./Masters/CategoryOfOrganisation/CategoryOfOrganisation.controller");
module.exports.professionController = require("./Masters/Profession/Profession.controller");
module.exports.positionController = require("./Masters/Position/position.controller");
module.exports.departmentControllers = require("./Masters/Department/Department.controller");
module.exports.insDepartmentControllers = require("./Masters/InsDepartment/InsDepartment.controller.js");
module.exports.insCompanyControllers = require("./Masters/InsCompany/InsCompany.controller.js");
module.exports.brokerBranchControllers = require("./Masters/BrokerBranch/BrokerBranch.controller.js");
module.exports.brokerageRateControllers = require("./Masters/BrokerageRate/BrokerageRate.controller.js");
module.exports.fuelTypeControllers = require("./Masters/FuelType/FuelType.controller.js");
module.exports.vehicleTypeControllers = require("./Masters/VehicleType/VehicleType.controller.js");
module.exports.licenseValidityControllers = require("./Masters/LicenseValidity/LicenseValidity.controller.js");
module.exports.marineClauseControllers = require("./Masters/MarineClause/MarineClause.controller.js");
module.exports.endorsementControllers = require("./Masters/Endorsement/Endorsement.controller.js");
module.exports.otherAddonControllers = require("./Masters/OtherAddon/OtherAddon.controller.js");
module.exports.riskCodeControllers = require("./Masters/RiskCode/RiskCode.controller.js");
module.exports.financialYearControllers = require("./Masters/FinancialYear/FinancialYear.controller.js");
module.exports.brokerNameControllers = require("./Masters/BrokerName/BrokerName.controller.js");
module.exports.branchBrokerControllers = require("./Masters/BranchBroker/BranchBroker.controller.js");
module.exports.incotermsControllers = require("./Masters/Incoterms/Incoterms.controller.js");
module.exports.subCustomerGroupControllers = require("./Masters/SubCustomerGroup/SubCustomerGroup.controller.js");
module.exports.networkController = require("./Masters/Network/network.controller");
module.exports.statusController = require("./Masters/Status/status.controller");
module.exports.ticketStatusController = require("./Masters/TicketStatus/ticketStatus.controller.js");
module.exports.taskStatusController = require("./Masters/TaskStatus/taskStatus.controller");

//todo: Prefix
module.exports.prefixController = require("./Masters/Prefix/prefix.controller");

//todo: Client
module.exports.clientRegistrationController = require("./Client/clientRegistration.controller");
module.exports.contactPersonController = require("./Client/contactPerson.controller");

//todo: Customer
module.exports.customerRegistrationController = require("./Customer/customerRegistration.controller");

//todo Customer Group
module.exports.customerGroupControllers = require("./CustomerGroup/CustomerGroup.controller.js");

//todo Policy Management
module.exports.policyDetailControllers = require("./PolicyManagement/PolicyManagement.controller.js");

//todo: type of client
module.exports.typeOfClientController = require("./Client/TypeOfClient.controller");

// todo: Admin-Client
module.exports.AdminClientRegistration = require("./Admin-Client/adminClientRegistration.controller");

//todo: contacts
module.exports.contactsController = require("./Contacts/contact.controller");

//todo: prospect
module.exports.prospectController = require("./Prospect/prospect.controller");

// todo: lead controller
module.exports.leadController = require("./Lead-Management/lead.controller");

//todo: leave manager

//todo: GST Percentage
module.exports.gstPercentageController = require("./Masters/GstPercentage/gstPercentage.controller");

// Old Masters
module.exports.designationController = require("./Masters/designation.controller");
module.exports.PaymentModeController = require("./Masters/payment_mode.controller");
module.exports.EmployeeRoleController = require("./Masters/employee_role.controller");
module.exports.LegderMasterController = require("./Masters/ledger.controller");
module.exports.InsuranceCompanyController = require("./Masters/insurance_company.controller");

//hr setup controller
//todo: leave manager




//Staffs

//newStaffApis







// Prefix

//Category
module.exports.categoryController = require("./Masters/category.controller");

// branch settings
module.exports.BranchSettingsController = require("./BranchSettings/BranchSettings.controller");

//invoice

module.exports.InvoiceRegistrationController = require("./Invoice/InvoiceRegistration.controller");

//priority
module.exports.priorityController = require("./Masters/Priority/priority.controller");
// Task Management
module.exports.taskManagementController = require("./TaskManagement/taskmanagement.controller");

//ticket management

module.exports.ticketManagementController = require("./TicketManagement/ticketManagement.controller");

module.exports.AdministrativeController = require("./Satffs/administrative/administrative.controller");

module.exports.employeeController = require("./Satffs/employee/employeee.controller");

module.exports.SupportController = require("./Satffs/support/support.controller");

module.exports.leaveManagerController = require('./LeaveManager/leaveManager.controller');
