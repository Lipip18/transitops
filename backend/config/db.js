const mongoose = require("mongoose");

const connectDB = async () => {
  const connection = await mongoose.connect(process.env.MONGO_URI);

  console.log(`MongoDB connected: ${connection.connection.host}`);

  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error.name);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  return connection;
};

module.exports = connectDB;