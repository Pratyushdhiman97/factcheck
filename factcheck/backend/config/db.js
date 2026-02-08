// db.js
// Database connection (MongoDB)

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/verifact";

export async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("DB connected:", MONGO_URI);
  } catch (err) {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  }
}
