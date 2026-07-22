const mongoose = require("mongoose");
require("dotenv").config();
const { convertToUppercase } = require("../utils/uppercaseUtils");

// Register global Mongoose plugin for schema-level uppercase enforcement (Database Best Practice)
mongoose.plugin((schema) => {
  schema.pre("save", function (next) {
    try {
      const doc = this;
      schema.eachPath((path, schemaType) => {
        if (schemaType.instance === "String") {
          const val = doc.get(path);
          if (typeof val === "string") {
            doc.set(path, convertToUppercase(val, path));
          }
        }
      });
    } catch (err) {
      console.error("Error in global Mongoose save hook:", err);
    }
    next();
  });

  schema.pre(["update", "updateOne", "updateMany", "findOneAndUpdate", "findByIdAndUpdate"], function (next) {
    try {
      const update = this.getUpdate();
      if (update) {
        if (update.$set) {
          update.$set = convertToUppercase(update.$set);
        } else {
          for (const key of Object.keys(update)) {
            if (!key.startsWith("$")) {
              update[key] = convertToUppercase(update[key], key);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error in global Mongoose update hook:", err);
    }
    next();
  });
});

const connection = mongoose.connect(process.env.db_url);
module.exports = connection;