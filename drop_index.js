const mongoose = require("mongoose");
const url = "mongodb://localhost:27017/insuredb";

mongoose.connect(url).then(async () => {
  console.log("Connected to MongoDB");
  try {
    const db = mongoose.connection.db;
    const collections = await db.collections();
    
    // Check if departments collection exists
    const deptCol = collections.find(c => c.collectionName === 'departments');
    if (deptCol) {
      console.log("Found departments collection");
      try {
        await deptCol.dropIndex("name_1");
        console.log("Successfully dropped name_1 index");
      } catch (err) {
        console.log("Error dropping index (maybe it does not exist):", err.message);
      }
    } else {
      console.log("Collection 'departments' not found");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    mongoose.disconnect();
  }
}).catch(err => console.error("Connection error:", err));
