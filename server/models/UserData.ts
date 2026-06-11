import mongoose from "mongoose";

const UserDataSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  device_id: { type: String, default: "" },
  version_name: { type: String, default: "" },
  version_code: { type: String, default: "" },
}, {
  timestamps: true,
  collection: "users_data" // Enforce the collection name "users_data"
});

export const UserDataModel = mongoose.model("UserData", UserDataSchema);
