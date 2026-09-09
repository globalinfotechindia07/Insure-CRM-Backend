module.exports.AdminModel = require("./admin.model");
module.exports.CompanySetupModel = require("./companySetup.model");
module.exports.DepartmentSetupModel = require("./departmentSetup.model");

//todo: Super Admin
module.exports.SuperAdminModel = require("./superAdmin.model");

// Chat

//Room Manage

//todo: New Masters
module.exports.BankDetailsModel = require("./Masters/Banking-Details/BankingDetails.model");
module.exports.ProductOrServiceCategorymodel = require("./Masters/ProductOrServiceCategory/ProductOrServiceCategory.model");
module.exports.SubProductCategoryModel = require("./Masters/SubProductCategory/SubProductCategory.model");
module.exports.leaveTypeModel = require("./Masters/LeaveType/LeaveType.model");
module.exports.leadReferenceModel = require("./Masters/LeadReference/LeadReference.model");
module.exports.leadStatusModel = require("./Masters/LeadStatus/LeadStatus.model");
module.exports.leadStageModel = require("./Masters/LeadStage/LeadStage.model");
module.exports.leadTypeModel = require("./Masters/LeadType/LeadType.model");
module.exports.categoryOfOrganisationModel = require("./Masters/CategoryOfOrganisation/CategoryOfOrganisation.model");
module.exports.professionModel = require("./Masters/Profession/Profession.model");
module.exports.positionModel = require("./Masters/Position/Position.model");
module.exports.departmentModel = require("./Masters/Department/Department.model");
module.exports.insDepartmentModel = require("./Masters/InsDepartment/InsDepartment.model");
module.exports.insCompanyModel = require("./Masters/InsCompany/InsCompany.model");
module.exports.brokerBranch = require("./Masters/BrokerBranch/BrokerBranch.model");
module.exports.brokerageRateModel = require("./Masters/BrokerageRate/BrokerageRate.model");
module.exports.vehicleTypeModel = require("./Masters/VehicleType/VehicleType.model");
module.exports.fuelTypeModel = require("./Masters/FuelType/FuelType.model");
module.exports.licenseValidityModel = require("./Masters/LicenseValidity/LicenseValidity.model");
module.exports.marineClauseModel = require("./Masters/MarineClause/MarineClause.model");
module.exports.endorsementModel = require("./Masters/Endorsement/Endorsement.model");
module.exports.otherAddonModel = require("./Masters/OtherAddon/OtherAddon.model");
module.exports.riskCodeModel = require("./Masters/RiskCode/RiskCode.model");
module.exports.financialYearModel = require("./Masters/FinacialYear/FinancialYear.model");
module.exports.policyDetailModel = require("./PolicyManagement/PolicyDetails.model");
module.exports.brokerNameModel = require("./Masters/BrokerName/BrokerName.model");
module.exports.branchBrokerModel = require("./Masters/BranchBroker/BranchBroker.model");
module.exports.incotermsModel = require("./Masters/Incoterms/Incoterms.model");
module.exports.subCustomerGroupModel = require("./Masters/SubCustomerGroup/SubCustomerGroup.model");
module.exports.NetworkModel = require("./Masters/Network/network.model");
module.exports.statusModel = require("./Masters/Status/Status.model");
module.exports.ticketStatusModel = require("./Masters/TicketStatus/TicketStatus.model");
module.exports.taskStatusModel = require("./Masters/TaskStatus/TaskStatus.model");
module.exports.priorityModel = require("./Masters/Priority/Priority.model");

module.exports.TaskModel = require("./TaskManagement/taskmanagement.model");

//todo: GST Percentage Model
module.exports.GstPercentageModel = require("./Masters/GstPercentage/GstPercentage.model");

//todo: Prefix
module.exports.PrefixModel = require("./Masters/Prefix/prefix.model");

// todo: Client
module.exports.ClientRegistrationModel = require("./Client/ClientRegistration.model");
module.exports.ContactPersonModel = require("./Client/ContactPerson.model");

//todo: Customer
module.exports.CustomerRegistrationModel = require("./Customer/CustomerRegistration.model");

//todo Customer Group
module.exports.customerGroupModel = require("./CustomerGroup/CustomerGroup.model");

//todo: Type of Client
module.exports.TypeOfClientModel = require("./Client/TypeOfClient.model");

// todo: Admin Client
module.exports.AdminClientRegistrationModel = require("./Admin-Client/AdminClientRegistration.model");
module.exports.AdminContactPersonModel = require("./Admin-Client/AdminContactPerson.model");
module.exports.AdminTypeOfClientModel = require("./Admin-Client/AdminTypeOfClient.model");

//todo: contacts
module.exports.contactModel = require("./Contacts/Contacts.model");

//todo: prospect
module.exports.prospectModel = require("./Prospect/Prospect.model");

//todo: Lead Mangement (lead)
module.exports.leadModel = require("./Lead-Management/Lead.model");

// Old Masters
module.exports.AppointmentSchedulingModel = require("./Masters/appointment.model");
module.exports.BillGroupModel = require("./Masters/billgroup.model");
module.exports.DesignationModel = require("./Masters/designation.model");
module.exports.ServiceDetailsModel = require("./Masters/serviceDetailsMaster.model");
module.exports.PaymentModeModel = require("./Masters/payment_mode.model");
module.exports.EmployeeRoleModel = require("./Masters/employee_role.model");
module.exports.LedgerModel = require("./Masters/ledger.model");
module.exports.File = require("./Masters/Template/file.model");
module.exports.SubLedgerModel = require("./Masters/sub_ledger.model");
module.exports.TPACompanyMasterModel = require("./Masters/tpa_master.model");
module.exports.InsuranceCompanyMasterModel = require("./Masters/insurance_comapny_master.model");
module.exports.GovCompanyMasterModel = require("./Masters/goverment_company_master.model");
module.exports.CoOperateCompanyMasterModel = require("./Masters/co-operate_company_master.model");

//hr setup master



//Staffs





//invoice no model
module.exports.InvoiceNoModel = require("./InvoiceNumber/invoiceNo.model");



//Role
module.exports.RoleModel = require("./roles.model");


//Category
module.exports.ParentGroupModel = require("./Masters/parentGroup.model");
module.exports.PayeeParentGroupModel = require("./Masters/payeeParent.model");
module.exports.CategoryMasterModel = require("./Masters/category.model");

// branch Settings
module.exports.branchSettingsModel = require("./BranchSettings/BranchSettings.model");

//invoice
module.exports.InvoiceModel = require("./Invoice/invoice.model");

module.exports.TicketManageModel = require("./TicketManagement/TicketManagement.model");
module.exports.CompanyModel = require("./Company");

module.exports.Administrative = require("./Staffs/administrative/administrative.model");

module.exports.EmployeeModel = require("./Staffs/employee/employee.model");

module.exports.Support = require("./Staffs/support/support.model");
