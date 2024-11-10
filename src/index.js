const express = require('express');
const redis = require('redis');
const { computeHungarian, make_cost_matrix, format_results } = require('./hungarian'); // Імпортуємо функцію обчислення

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL;

const client = redis.createClient({ url: REDIS_URL });

client.on('connect', () => {
  console.log("Main server connected to Redis");
});

client.on('error', (err) => {
  console.error("Redis connection error:", err);
});

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Main server is running');
});

app.post('/task', async (req, res) => {
  const { matrix, is_maximization } = req.body;

  if (!matrix || typeof is_maximization === 'undefined') {
    return res.status(400).json({ error: "Invalid request data" });
  }

  try {
    // Обчислюємо результат угорського методу
    const costMatrix = make_cost_matrix(matrix, is_maximization); // Функція для створення costMatrix з урахуванням мінімізації/максимізації
    const assignments = computeHungarian(costMatrix);

    // Форматуємо результат
    const { selectedElements, totalCost } = format_results(matrix, assignments);

    res.json({
      selectedElements,
      totalCost
    });
  } catch (err) {
    console.error("Error processing matrix:", err);
    res.status(500).json({ error: "Failed to process matrix" });
  }
});

app.listen(PORT, () => {
  console.log(`Main server listening on port ${PORT}`);
});
