const mongoose = require('mongoose');
const connection = require('./src/config/config');
const CustomerRegistrationModel = require('./src/models/Customer/CustomerRegistration.model');
const Customer = require('./src/models/Customer');

async function main() {
  await connection;
  console.log("Connected to MongoDB successfully!");

  const regCount = await CustomerRegistrationModel.countDocuments({});
  console.log(`Total CustomerRegistration: ${regCount}`);

  const legacyCount = await Customer.countDocuments({});
  console.log(`Total legacy Customer: ${legacyCount}`);

  const sample = await Customer.find({}).sort({ createdAt: -1 }).limit(10);
  console.log("=== Last 10 legacy Customers ===");
  console.log(JSON.stringify(sample, null, 2));

  mongoose.connection.close();
}

main().catch(err => {
  console.error("Error:", err);
  mongoose.connection.close();
});
