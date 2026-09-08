const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/insuredb').then(async () => {
  const db = mongoose.connection.db;
  const products = await db.collection('productorservicecategories').find({
    productName: { $in: ["HEALTH SUPER CHARGE", "CONTRACTORS PLANT AND MACHINERY", "MBD", "SARAL SURAKSHA BIMA"] }
  }).toArray();
  
  console.log(JSON.stringify(products, null, 2));
  process.exit(0);
});
