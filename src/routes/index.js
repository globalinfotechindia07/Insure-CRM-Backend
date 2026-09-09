const express = require("express");

//todo: superAdmin
const superAdminRouter = require("./superAdmin.route");

// todo New Master
const bankDetailsRouter = require("./Masters/Bank-Details/bankDetails.route");
const productOrServiceCategoryRouter = require("./Masters/ProductOrServiceCategory/ProductOrServiceCategory.route");
const SubProductCategoryRouter = require("./Masters/SubProductCategory/SubProductCategory.route");
const leaveTypeRouter = require("./Masters/LeaveType/leaveType.route");
const leadReferenceRouter = require("./Masters/LeadReference/leadReference.route");
const leadStatusRouter = require("./Masters/LeadStatus/leadStatus.route");
const leadTypeRouter = require("./Masters/LeadType/leadType.route");
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
const leadStageRouter = require("./Masters/LeadStage/leadStage.route");
const priorityRouter = require("./Masters/Priority/priority.route");
const taskmanagementrouter = require("./TaskManagement/taskmanagement.route");

// todo: Client
const clientRegistrationRouter = require("./Client/clientRegistration.route");
const contactPersonRouter = require("./Client/contactPerson.route");

//todo: Customer
const customerRegistrationRouter = require("./Customer/customerRegistration.route");

//todo Customer Group
const customerGroupRouter = require("./CustomerGroup/CustomerGroup.route");
const customerRoutes = require("./customerRoutes");
//todo: type of client
const typeOfClientRouter = require("./Client/typofClient.route");

//todo: Prifix
const prefixRouter = require("./Masters/Prefix/prefix.route");

//todo: Contact
const contactRouter = require("./Contacts/contacts.route");

//todo: prospect
const companyRouter = require("./Prospect/prospect.route");

//todo: lead-management (lead)
const leadRouter = require("./Lead-management/lead.route");

//todo: gst percentage
const gstPercentageRouter = require("./Masters/GstPercentage/gstPercentage.route");

const holidayTypeRoute = require("./Masters/HolidayType/HolidayType.route");
const holidayRoute = require("./Masters/Holiday/Holiday.route");

// Old Masters
const adminRoute = require("./admin.route");
const pincodeRoute = require("./pincode.route");


const designationRoute = require("./Masters/designation.route");
const companySetupRoute = require("./companySetup.route");
const departmentRoute = require("./departmentSetup.route");
const billGroupRoute = require("./Masters/billGroup.route");
const storeRoute = require("./Masters/store.route");
const serviceDetailsRoute = require("./Masters/serviceDetails.route");
const notificationRouter = require("./Notification/Notification");

const partyMasterRoute = require("./Masters/partyMaster.route");
const productMasterRoute = require("./Masters/productMaster.route");
const paymentModeRouter = require("./Masters/payment_mode.route");
const employeeRoleRouter = require("./Masters/employee_role.route");

const ledgerRouter = require("./Masters/ladger.route");
const insuranceCompanyRouter = require("./Masters/insurance_company.route");
const gipsaaCompanyRouter = require("./Masters/gipsaa_company.route");


const departmentsRouter = require("../routes/departmentRoutes");

const appointmentSchedulingRoute = require("./Masters/appointment.route");
const consultantRoute = require("./Staffs/consultant/consultant.route");
const employeeRoute = require("./Staffs/employee/employee.route");

//hr setup
const administrativeRouter = require("./Staffs/administrative/administrative.route");
const attendanceRouter = require("./Staffs/Attendance/attendance.routes");
const support = require("./Staffs/support/support.route");
const nursingAndParamedicalRoute = require("./Staffs/nursingAndParamedical/nursingAndParamedical.route");
const medicalOfficerRoute = require("./Staffs/medicalOfficer/medicalOfficer.route");
const newConsultantRoute = require("./Staffs/newConsultant/newConsultant.route");

// OPD Patient Starts

// OPD Patient Ends
const refferByRoute = require("./Masters/refferBy.route");
const categoryRoute = require("./Masters/category.route");

//emergency
// const EmergencyRouter = require("./Emergency/emergencyRegestration.route");
const departmentTypeRouter = require("./departmentType.route");
const departmentSubTypeRouter = require("./departmentSubType.route");



// Add this line with your other imports (around line 200-250)
const renewalReminderRouter = require("../routes/renewalReminder.routes");

const companysRouter = require("../routes/companyRoutes");


const TimeIntervalMasterRouter = require("./Masters/timeInterval.route");
const ServiceRateRouter = require("./Masters/serviceRate.route");
const ServiceRateRouterNew = require("./Masters/serviceRateNew.route");

const branchSettingsRouter = require("./BranchSettings/BranchSettings.route");

//invoice

const InvoiceRouter = require("./Invoice/Invoice.route");
const AdminclientRegistrationRouter = require("./Admin-client/adminClientRegistraion.route");
const AdmincontactPersonRouter = require("./Admin-client/adminContactPerson.route");
const AdmintypeOfClientRouter = require("./Admin-client/adminTypeOfClient.route");

//Policy Management
const policyDetailRouter = require("./PolicyManagement/PolicyDetail.route");

//ticket management

const ticketManageRouter = require("./TicketManagement/ticketManagement.route");
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
const posRouter = require("./Masters/POSAndBQP/POS.route");
const bqpRouter = require("./Masters/POSAndBQP/BQP.route");
const posPatternRouter = require("./Masters/POSAndBQP/POSPattern.route");
const bqpPatternRouter = require("./Masters/POSAndBQP/BQPPattern.route");
// Add this line with your other imports
const emailRoutes = require("./emailRoutes");
const router = express.Router();

const surveyorRouter = require("../routes/surveyor.routes");

const tpaRouter = require("../routes/tpa.routes");

const investigatorRouter = require("../routes/investigator.route");

const claimRouter = require("../routes/claim.routes");



const defaultRoutes = [
  // superAdmin
  {
    path: "/superAdmin",
    route: superAdminRouter,
  },

  {
    path: "/admin",
    route: adminRoute,
  },

  {
    path: "/company-setup",
    route: companySetupRoute,
  },
  {
    path: "/department-setup",
    route: departmentRoute,
  },
  {
    path: "/department-type",
    route: departmentTypeRouter,
  },
  {
    path: "/department-sub-type",
    route: departmentSubTypeRouter,
  },
  {
    path: "/pincodes",
    route: pincodeRoute,
  },
  {
    path: "/designation-master",
    route: designationRoute,
  },
  {
    path: "/billgroup-master",
    route: billGroupRoute,
  },
  {
    path: "/store-master",
    route: storeRoute,
  },
  {
    path: "/service-details-master",
    route: serviceDetailsRoute,
  },
  
  
  
  
  {
    path: "/party-master",
    route: partyMasterRoute,
  },
  {
    path: "/product-master",
    route: productMasterRoute,
  },
  
  
  
  
  
  
  
  
  
  
  
  
  {
    path: "/appointmentSchedule-master",
    route: appointmentSchedulingRoute,
  },

  
  
  

  

  

  

  
    {
    path: "/department",
    route: departmentsRouter,  // Using new department module
  },

  
  
  
  
  

  {
    path: "/consultant",
    route: consultantRoute,
  },
  {
    path: "/employee",
    route: employeeRoute,
  },

  {
    path: "/administrative",
    route: administrativeRouter,
  },

  {
    path: "/support",
    route: support,
  },

  {
    path: "/nursingAndParamedical",
    route: nursingAndParamedicalRoute,
  },

  {
    path: "/medicalOfficer",
    route: medicalOfficerRoute,
  },

  {
    path: "/newConsultant",
    route: newConsultantRoute,
  },

  
  
  
  {
    path: "/notification",
    route: notificationRouter,
  },
  
  {
    path: "/payment-mode",
    route: paymentModeRouter,
  },
  {
    path: "/employee-role",
    route: employeeRoleRouter,
  },
  
  
  
  

  
  
  
  

  
  
  

  {
    path: "/ledger",
    route: ledgerRouter,
  },
  {
    path: "/insurance-company",
    route: insuranceCompanyRouter,
  },
  {
    path: "/gipsaa-company",
    route: gipsaaCompanyRouter,
  },
  
  
  
  
  // OPD/Patient Start
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  

  

  // OPD/Patient Ends
  
  

  {
    path: "/refferBy",
    route: refferByRoute,
  },
  {
    path: "/category",
    route: categoryRoute,
  },
  


  

  {
    path: "/time-interval",
    route: TimeIntervalMasterRouter,
  },
  
  {
    path: "/service-rate",
    route: ServiceRateRouter,
  },
  {
    path: "/service-rate-new",
    route: ServiceRateRouterNew,
  },

  
  

  
  
  
  
  
  
  //todo: New Masters
  {
    path: "/bankDetails",
    route: bankDetailsRouter,
  },
  {
    path: "/productOrServiceCategory",
    route: productOrServiceCategoryRouter,
  },
  {
    path: "/SubProductCategory",
    route: SubProductCategoryRouter,
  },
  {
    path: "/leaveType",
    route: leaveTypeRouter,
  },
  {
    path: "/leadReference",
    route: leadReferenceRouter,
  },
  {
    path: "/leadStatus",
    route: leadStatusRouter,
  },
  {
    path: "/leadStage",
    route: leadStageRouter,
  },
  {
    path: "/leadType",
    route: leadTypeRouter,
  },
  {
    path: "/CategoryOfOrganisation",
    route: CategoryOfOrganisationRouter,
  },
  {
    path: "/profession",
    route: professionRouter,
  },
  {
    path: "/attendance",
    route: attendanceRouter,
  },
  {
    path: "/position",
    route: positionRouter,
  },
  {
    path: "/branchSettings",
    route: branchSettingsRouter,
  },
  {
    path: "/insCompany",
    route: insCompanyRouter,
  },
  {
    path: "/insDepartment",
    route: insDepartmentRouter,
  },
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
  { path: "/policyDetail", route: policyDetailRouter },
  { path: "/brokerName", route: brokerNameRouter },
  { path: "/branchBroker", route: branchBrokerRouter },
  { path: "/incoterms", route: incotermsRouter },
  { path: "/subCustomerGroup", route: subCustomerGroupRouter },
  {
    path: "/department",
    route: departmentRouter,
  },
  {
    path: "/network",
    route: networkRouter,
  },
  {
    path: "/status",
    route: statusRouter,
  },
  {
    path: "/ticketStatus",
    route: ticketStatusRouter,
  },
  {
    path: "/taskStatus",
    route: taskStatusRouter,
  },
  {
    path: "/priority",
    route: priorityRouter,
  },

  //todo: Client
  {
    path: "/clientRegistration",
    route: clientRegistrationRouter,
  },
  {
    path: "/customerRegistration",
    route: customerRegistrationRouter,
  },
  {
    path: "/customerGroup",
    route: customerGroupRouter,
  },
  {
    path: "/contactPerson",
    route: contactPersonRouter,
  },
  //todo: type of client
  {
    path: "/typeOfClient",
    route: typeOfClientRouter,
  },

  //todo: admin-client
  {
    path: "/admin-clientRegistration",
    route: AdminclientRegistrationRouter,
  },
  {
    path: "/admin-contactPerson",
    route: AdmincontactPersonRouter,
  },
  {
    path: "/admin-typeOfClient",
    route: AdmintypeOfClientRouter,
  },

  //todo: prefix
  {
    path: "/prefix",
    route: prefixRouter,
  },
  //todo: contacts
  {
    path: "/contact",
    route: contactRouter,
  },
  //todo: prospect
  {
    path: "/prospect",
    route: companyRouter,
  },
  //todo: lead
  {
    path: "/lead",
    route: leadRouter,
  },
  //todo: gst percentage
  {
    path: "/gst-percentage",
    route: gstPercentageRouter,
  },
  {
    path: "/invoiceRegistration",
    route: InvoiceRouter,
  },
  {
    path: "/holidayType",
    route: holidayTypeRoute,
  },
  {
    path: "/holiday",
    route: holidayRoute,
  },
  //ticket management
  {
    path: "/ticket-management",
    route: ticketManageRouter,
  },
  {
    path: "/task-manager",
    route: taskmanagementrouter,
  },
  
{
  path: "/email",
  route: emailRoutes,
},
{
  path: "/customers",
  route: customerRoutes,
},
{
  path: "/surveyor",
  route: surveyorRouter,
},

{
  path: "/tpa",
  route: tpaRouter,
},

{
  path: "/investigator",
  route: investigatorRouter,
},

{
  path: "/claim",
  route: claimRouter,
},

  {
    path: "/renewal-reminder",
    route: renewalReminderRouter,
  },
    {
    path: "/company",
    route: companysRouter,
  },
  {
    path: "/pos",
    route: posRouter,
  },
  {
    path: "/pos-pattern",
    route: posPatternRouter,
  },
  {
    path: "/bqp",
    route: bqpRouter,
  },
  {
    path: "/bqp-pattern",
    route: bqpPatternRouter,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
