const mongoose = require("mongoose");
const url = "mongodb://localhost:27017/insuredb";

mongoose.connect(url).then(async () => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.collections();
    
    const deptCol = collections.find(c => c.collectionName === 'departments');
    if (deptCol) {
      const indexes = await deptCol.indexes();
      console.log("Indexes in departments:", JSON.stringify(indexes, null, 2));
      
      // Let's also drop any index that has "name" in it or just find it.
      for (const idx of indexes) {
        if (idx.name !== '_id_' && (idx.name.includes('name') || Object.keys(idx.key).includes('name'))) {
          console.log("Dropping index:", idx.name);
          await deptCol.dropIndex(idx.name);
          console.log("Dropped", idx.name);
        }
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    mongoose.disconnect();
  }
}).catch(err => console.error("Connection error:", err));
