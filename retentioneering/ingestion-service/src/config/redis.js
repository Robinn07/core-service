const { Redis } = require("ioredis");
const { getRedisUrl } = require("../utils/config/loader");
require('dotenv').config(); 

const redis = new Redis(getRedisUrl(), {
  maxRetriesPerRequest: null,
});

redis.on("connect", () => {
  console.log("✅ Successfully connected to Redis!");
});

redis.on("error", (err) => {
  console.error("❌ Redis Connection Error:", err.message);
});

module.exports = redis;
