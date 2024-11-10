const redis = require('redis');
const { promisify } = require('util');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const client = redis.createClient({ url: REDIS_URL });

client.on('connect', () => {
  console.log("Worker connected to Redis");
});

client.on('error', (err) => {
  console.error("Redis connection error in worker:", err);
});

// Забезпечуємо асинхронні функції
const getAsync = promisify(client.get).bind(client);
const keysAsync = promisify(client.keys).bind(client);

// Оновлена функція для обробки задач
async function processTask() {
  try {
    const keys = await keysAsync('task:*');  // Отримуємо всі ключі задач
    for (const key of keys) {
      const task = await getAsync(key);  // Отримуємо задачу по ключу
      console.log("Processing task:", task);
      // Тут обробка задачі
    }
  } catch (err) {
    console.error("Error processing task:", err);
  }
}

// Запускаємо інтервал обробки задач, перевіряючи з'єднання
function startProcessing() {
  setInterval(() => {
    if (client.isOpen) {  // Переконайтеся, що з'єднання відкрито перед виконанням
      processTask();
    } else {
      console.warn("Redis client is not open. Attempting to reconnect...");
      client.connect().catch((err) => console.error("Failed to reconnect:", err));
    }
  }, 5000);
}

// Розпочинаємо обробку задач
client.connect().then(() => {
  startProcessing();
}).catch((err) => {
  console.error("Failed to connect to Redis on start:", err);
});
