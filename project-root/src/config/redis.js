const { Redis } = require("ioredis");
require('dotenv').config(); 

const connection = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

module.exports = connection;

// Add this at the bottom of src/config/redis.js
connection.on("connect", () => {
  console.log("✅ Successfully connected to Redis Cloud!");
});

connection.on("error", (err) => {
  console.error("❌ Redis Connection Error:", err.message);
});