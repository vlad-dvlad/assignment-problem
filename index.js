const express = require('express');
const axios = require('axios');
const redis = require('redis');
const app = express();
app.use(express.json());

const { solveAssignment } = require('./src/services/assigment');

const port = process.env.PORT || 3000;
const redisClient = redis.createClient({ url: process.env.REDIS_URL });

app.post('/solve-assignment', solveAssignment(redisClient, axios));

redisClient.on('error', (err) => {
    console.error('Redis client error:', err);
});

(async () => {
    await redisClient.connect(); // Ensure the client is connected
})();

app.listen(port, () => {
    console.log(`Main server listening on port ${port}`);
});
