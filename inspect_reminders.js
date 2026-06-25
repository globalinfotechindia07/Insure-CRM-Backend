const mongoose = require('mongoose');
const connection = require('./src/config/config');
const RenewalReminder = require('./src/models/renewalReminder.model');

async function main() {
  await connection;
  console.log("Connected to MongoDB successfully!");

  const count = await RenewalReminder.countDocuments({});
  console.log(`Total renewal reminders: ${count}`);

  const sample = await RenewalReminder.find({}).limit(5);
  console.log("=== Sample Reminders ===");
  console.log(JSON.stringify(sample, null, 2));

  mongoose.connection.close();
}

main().catch(err => {
  console.error("Error:", err);
  mongoose.connection.close();
});
