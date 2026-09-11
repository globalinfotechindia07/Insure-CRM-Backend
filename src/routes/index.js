const express = require("express");
const { handleToken } = require("../utils/handleToken");

// Superadmin & Admin
const superAdminRouter = require("./superAdmin.route");
const adminRoute = require("./admin.route");

// Company & Department Setup
const companySetupRoute = require("./companySetup.route");
const departmentRoute = require("./departmentSetup.route");
const departmentTypeRouter = require("./departmentType.route");
const departmentSubTypeRouter = require("./departmentSubType.route");
const departmentsRouter = require("../routes/departmentRoutes");
const designationRoute = require("./Masters/designation.route");
const notificationRouter = require("./Notification/Notification");

// Masters - New
const bankDetailsRouter = require("./Masters/Bank-Details/bankDetails.route");
const productOrServiceCategoryRouter = require("./Masters/ProductOrServiceCategory/ProductOrServiceCategory.route");
const SubProductCategoryRouter = require("./Masters/SubProductCategory/SubProductCategory.route");
const leaveTypeRouter = require("./Masters/LeaveType/leaveType.route");
const leadReferenceRouter = require("./Masters/LeadReference/leadReference.route");
const leadStatusRouter = require("./Masters/LeadStatus/leadStatus.route");
const leadTypeRouter = require("./Masters/LeadType/leadType.route");
const leadStageRouter = require("./Masters/LeadStage/leadStage.route");
const CategoryOfOrganisationRouter = require("./Masters/CategoryOfOrganisation/CategoryOfOrganisation.route");
const professionRouter = require("./Masters/Profession/Profession.route");
const positionRouter = require("./Masters/Position/position.route");
const departmentRouter = require("./Masters/Department/Department.route");
const insDepartmentRouter = require("./Masters/InsDepartment/InsDepartment.route");
const insCompanyRouter = require("./Masters/InsCompany/InsCompany.route");
const brokerBranchRouter = require("./Masters/BrokerBranch/BrokerBranch.route");
const brokerageRateRouter = require("./Masters/BrokerageRate/BrokerageRate.route");
const networkRouter = require("./Masters/Network/network.route");
const statusRouter = require("./Masters/Status/status.route");
const ticketStatusRouter = require("./Masters/TicketStatus/ticketStatus.route");
const taskStatusRouter = require("./Masters/TaskStatus/taskStatus.route");
const priorityRouter = require("./Masters/Priority/priority.route");
const prefixRouter = require("./Masters/Prefix/prefix.route");
const gstPercentageRouter = require("./Masters/GstPercentage/gstPercentage.route");
const paymentModeRouter = require("./Masters/payment_mode.route");
const employeeRoleRouter = require("./Masters/employee_role.route");
const ledgerRouter = require("./Masters/ladger.route");
const insuranceCompanyRouter = require("./Masters/insurance_company.route");
const gipsaaCompanyRouter = require("./Masters/gipsaa_company.route");
const categoryRoute = require("./Masters/category.route");
const TimeIntervalMasterRouter = require("./Masters/timeInterval.route");
const fuelTypeRouter = require("./Masters/FuelType/FuelType.route");
const vehicleTypeRouter = require("./Masters/VehicleType/VehicleType.route");
const licenseValidityRouter = require("./Masters/LicenseValidity/LicenseValidity.route");
const marineClauseRouter = require("./Masters/MarineClause/marineClause.route");
const endorsementRouter = require("./Masters/Endorsement/Endorsement.route");
const otherAddonRouter = require("./Masters/OtherAddon/OtherAddon.route");
const riskCodeRouter = require("./Masters/RiskCode/RiskCode.route");
const financialYearRouter = require("./Masters/FinancialYear/FinancialYear.route");
const brokerNameRouter = require("./Masters/BrokerName/BrokerName.route");
const branchBrokerRouter = require("./Masters/BranchBroker/BranchBroker.route");
const incotermsRouter = require("./Masters/Incoterms/Incoterms.route");
const subCustomerGroupRouter = require("./Masters/SubCustomerGroup/SubCustomerGroup.route");
const holidayTypeRoute = require("./Masters/HolidayType/HolidayType.route");
const holidayRoute = require("./Masters/Holiday/Holiday.route");
const posRouter = require("./Masters/POSAndBQP/POS.route");
const bqpRouter = require("./Masters/POSAndBQP/BQP.route");
const posPatternRouter = require("./Masters/POSAndBQP/POSPattern.route");
const bqpPatternRouter = require("./Masters/POSAndBQP/BQPPattern.route");

// Staffs
const administrativeRouter = require("./Staffs/administrative/administrative.route");
const employeeRoute = require("./Staffs/employee/employee.route");
const support = require("./Staffs/support/support.route");
const attendanceRouter = require("./Staffs/Attendance/attendance.routes");

// Branch Settings
const branchSettingsRouter = require("./BranchSettings/BranchSettings.route");

// Client & Customer
const clientRegistrationRouter = require("./Client/clientRegistration.route");
const contactPersonRouter = require("./Client/contactPerson.route");
const typeOfClientRouter = require("./Client/typofClient.route");
const customerRegistrationRouter = require("./Customer/customerRegistration.route");
const customerGroupRouter = require("./CustomerGroup/CustomerGroup.route");
const customerRoutes = require("./customerRoutes");
const contactRouter = require("./Contacts/contacts.route");
const AdminclientRegistrationRouter = require("./Admin-client/adminClientRegistraion.route");

// Prospect, Lead, Invoice
const companyRouter = require("./Prospect/prospect.route");
const leadRouter = require("./Lead-management/lead.route");
const InvoiceRouter = require("./Invoice/Invoice.route");

// Policy Management
const policyDetailRouter = require("./PolicyManagement/PolicyDetail.route");

// Ticket & Task Management
const ticketManageRouter = require("./TicketManagement/ticketManagement.route");
const taskmanagementrouter = require("./TaskManagement/taskmanagement.route");

// Email, Surveyor, TPA, Investigator, Claim, Renewal
const emailRoutes = require("./emailRoutes");
const surveyorRouter = require("../routes/surveyor.routes");
const tpaRouter = require("../routes/tpa.routes");
const investigatorRouter = require("../routes/investigator.route");
const claimRouter = require("../routes/claim.routes");
const renewalReminderRouter = require("../routes/renewalReminder.routes");
const companysRouter = require("../routes/companyRoutes");

const router = express.Router();

const defaultRoutes = [
  // Admin & Setup
  { path: "/superAdmin", route: superAdminRouter },
  { path: "/admin", route: adminRoute },
  { path: "/company-setup", route: companySetupRoute },
  { path: "/department-setup", route: departmentRoute },
  { path: "/department-type", route: departmentTypeRouter },
  { path: "/department-sub-type", route: departmentSubTypeRouter },
  { path: "/department", route: departmentRouter },
  { path: "/designation-master", route: designationRoute },
  { path: "/notification", route: notificationRouter },

  // Staff
  { path: "/administrative", route: administrativeRouter },
  { path: "/employee", route: employeeRoute },
  { path: "/support", route: support },
  { path: "/attendance", route: attendanceRouter },
  { path: "/employee-role", route: employeeRoleRouter },

  // Masters
  { path: "/bankDetails", route: bankDetailsRouter },
  { path: "/productOrServiceCategory", route: productOrServiceCategoryRouter },
  { path: "/SubProductCategory", route: SubProductCategoryRouter },
  { path: "/leaveType", route: leaveTypeRouter },
  { path: "/leadReference", route: leadReferenceRouter },
  { path: "/leadStatus", route: leadStatusRouter },
  { path: "/leadStage", route: leadStageRouter },
  { path: "/leadType", route: leadTypeRouter },
  { path: "/CategoryOfOrganisation", route: CategoryOfOrganisationRouter },
  { path: "/profession", route: professionRouter },
  { path: "/position", route: positionRouter },
  { path: "/branchSettings", route: branchSettingsRouter },
  { path: "/insCompany", route: insCompanyRouter },
  { path: "/insDepartment", route: insDepartmentRouter },
  { path: "/brokerBranch", route: brokerBranchRouter },
  { path: "/brokerageRate", route: brokerageRateRouter },
  { path: "/fuelType", route: fuelTypeRouter },
  { path: "/vehicleType", route: vehicleTypeRouter },
  { path: "/licenseValidity", route: licenseValidityRouter },
  { path: "/marineClause", route: marineClauseRouter },
  { path: "/endorsement", route: endorsementRouter },
  { path: "/otherAddon", route: otherAddonRouter },
  { path: "/riskCode", route: riskCodeRouter },
  { path: "/financialYear", route: financialYearRouter },
  { path: "/brokerName", route: brokerNameRouter },
  { path: "/branchBroker", route: branchBrokerRouter },
  { path: "/incoterms", route: incotermsRouter },
  { path: "/subCustomerGroup", route: subCustomerGroupRouter },
  { path: "/network", route: networkRouter },
  { path: "/status", route: statusRouter },
  { path: "/ticketStatus", route: ticketStatusRouter },
  { path: "/taskStatus", route: taskStatusRouter },
  { path: "/priority", route: priorityRouter },
  { path: "/prefix", route: prefixRouter },
  { path: "/payment-mode", route: paymentModeRouter },
  { path: "/ledger", route: ledgerRouter },
  { path: "/insurance-company", route: insuranceCompanyRouter },
  { path: "/gipsaa-company", route: gipsaaCompanyRouter },
  { path: "/category", route: categoryRoute },
  { path: "/time-interval", route: TimeIntervalMasterRouter },
  { path: "/holidayType", route: holidayTypeRoute },
  { path: "/holiday", route: holidayRoute },
  { path: "/policyDetail", route: policyDetailRouter },
  { path: "/pos", route: posRouter },
  { path: "/pos-pattern", route: posPatternRouter },
  { path: "/bqp", route: bqpRouter },
  { path: "/bqp-pattern", route: bqpPatternRouter },

  // Client & Customer
  { path: "/clientRegistration", route: clientRegistrationRouter },
  { path: "/customerRegistration", route: customerRegistrationRouter },
  { path: "/customerGroup", route: customerGroupRouter },
  { path: "/contactPerson", route: contactPersonRouter },
  { path: "/typeOfClient", route: typeOfClientRouter },
  { path: "/admin-clientRegistration", route: AdminclientRegistrationRouter },
  { path: "/prefix", route: prefixRouter },
  { path: "/contact", route: contactRouter },
  { path: "/customers", route: customerRoutes },

  // Prospect, Lead, Invoice, GST
  { path: "/prospect", route: companyRouter },
  { path: "/lead", route: leadRouter },
  { path: "/gst-percentage", route: gstPercentageRouter },
  { path: "/invoiceRegistration", route: InvoiceRouter },

  // Ticket & Task
  { path: "/ticket-management", route: ticketManageRouter },
  { path: "/task-manager", route: taskmanagementrouter },

  // Email, CRM Core
  { path: "/email", route: emailRoutes },
  { path: "/surveyor", route: surveyorRouter },
  { path: "/tpa", route: tpaRouter },
  { path: "/investigator", route: investigatorRouter },
  { path: "/claim", route: claimRouter },
  { path: "/renewal-reminder", route: renewalReminderRouter },
  { path: "/company", route: companysRouter },
  { path: "/leaveManager", route: require("./LeaveManager/leaveManager.route") },
];
const publicRoutes = [
  "/superAdmin/login",
  "/superAdmin/register",
  "/admin/login",
  "/admin/register",
  "/admin/auth/send-otp",
  "/admin/reset-password",
  "/clientRegistration/login",
  "/admin-clientRegistration/login",
  "/administrative/staff-login"
];

// Global Authentication Middleware
router.use((req, res, next) => {
  // Check if the current path matches any of the public routes
  const isPublic = publicRoutes.some(route => req.path.startsWith(route));
  
  if (isPublic) {
    return next();
  }
  
  // Otherwise, require a valid token
  return handleToken(req, res, next);
});

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
