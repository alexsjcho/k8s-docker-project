const express = require('express');
const redis = require('redis');

const app = express();
app.use(express.json());

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const PORT = process.env.PORT || 3000;

let redisClient = null;

// Initialize Redis connection
async function initRedis() {
  try {
    redisClient = redis.createClient({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT
      }
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    await redisClient.connect();
    console.log(`Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
  } catch (err) {
    console.error('Failed to connect to Redis:', err.message);
    redisClient = null;
  }
}

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Get current count
app.get('/count', async (req, res) => {
  if (!redisClient || !redisClient.isOpen) {
    return res.status(503).json({ error: 'Redis unavailable' });
  }

  try {
    const count = await redisClient.get('count');
    const countValue = count ? parseInt(count, 10) : 0;
    console.log(`GET /count -> ${countValue}`);
    res.json({ count: countValue });
  } catch (err) {
    console.error('Error getting count:', err);
    res.status(503).json({ error: 'Redis unavailable', message: err.message });
  }
});

// Increment count
app.post('/inc', async (req, res) => {
  if (!redisClient || !redisClient.isOpen) {
    return res.status(503).json({ error: 'Redis unavailable' });
  }

  try {
    const newCount = await redisClient.incr('count');
    console.log(`POST /inc -> ${newCount}`);
    res.json({ count: newCount });
  } catch (err) {
    console.error('Error incrementing count:', err);
    res.status(503).json({ error: 'Redis unavailable', message: err.message });
  }
});

// Start server
async function start() {
  await initRedis();
  
  app.listen(PORT, () => {
    console.log(`API server listening on port ${PORT}`);
  });
}

start().catch(console.error);

