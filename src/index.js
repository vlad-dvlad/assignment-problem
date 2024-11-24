const express = require('express');
const redis = require('redis');
const { v4: uuidv4 } = require('uuid');

const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL;

const client = redis.createClient({ url: REDIS_URL });
client.connect();

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Main server is running');
});

function split_into_submatrices(matrix, submatrix_size) {
  const submatrices = [];
  const rows = matrix.length;
  const cols = matrix[0].length;

  for (let i = 0; i < rows; i += submatrix_size) {
    for (let j = 0; j < cols; j += submatrix_size) {
      const submatrix = [];

      for (let k = i; k < Math.min(i + submatrix_size, rows); k++) {
        submatrix.push(matrix[k].slice(j, Math.min(j + submatrix_size, cols)));
      }

      submatrices.push({ submatrix, offsetRow: i, offsetCol: j });
    }
  }

  return submatrices;
}



function aggregateResults(submatrixAssignments, originalMatrix) {
  let selectedElements = [];
  let totalCost = 0;

  submatrixAssignments.forEach(({ assignments, offsetRow, offsetCol }) => {
    assignments.forEach(({ row, col, value }) => {
      const globalRow = offsetRow + row;
      const globalCol = offsetCol + col;

      // Перевіряємо, чи координати в межах глобальної матриці
      if (globalRow < originalMatrix.length && globalCol < originalMatrix[0].length) {
        selectedElements.push(value);
        totalCost += value;
      }
    });
  });

  return { selectedElements, totalCost };
}



app.post('/task', async (req, res) => {
  // const { matrix, is_maximization } = req.body;
  const { split } = req.body;
  await client.flushAll();
    const startTime = Date.now(); // Початок заміру загального часу
  // if (!matrix || typeof is_maximization === 'undefined') {
  //   return res.status(400).json({ error: "Invalid request data" });
  // }
const matrix = Array.from({ length: 60 }, () => Array.from({ length: 60 }, () => Math.floor(Math.random() * 60 + 10)));
const is_maximization = false;
  const taskId = uuidv4();
  const submatrices = split_into_submatrices(matrix, split);

  for (const { submatrix, offsetRow, offsetCol } of submatrices) {
    await client.rPush('tasks', JSON.stringify({
      taskId,
      submatrix,
      offsetRow,
      offsetCol,
      is_maximization
    }));
  }

  let collectedResults = [];
  while (collectedResults.length < submatrices.length) {
    const result = await client.blPop(`results:${taskId}`, 0);
    const parsedResult = JSON.parse(result.element); // Адаптація до нової структури
    collectedResults.push(parsedResult);
  }

  const aggregatedResult = aggregateResults(collectedResults, matrix);
  const totalTime = Date.now() - startTime; // Загальний час обробки
    res.json({
    ...aggregatedResult,
    totalProcessingTime: `${totalTime} ms`, // Час обробки всієї задачі
    detailedProcessingTimes: collectedResults.map((r, i) => ({
      submatrixIndex: i,
      processingTime: r.processingTime
    })) // Час обробки кожної підзадачі
  });
});

app.get('/worker-stats', async (req, res) => {
  try {
    await client.flushAll();

    const keys = await client.keys('worker_stats:*');
    const stats = {};

    for (const key of keys) {
      const workerId = key.split(':')[1];
      const workerStats = await client.hGetAll(key);

      stats[workerId] = {
        tasksProcessed: parseInt(workerStats.tasksProcessed || 0, 10),
        totalProcessingTime: parseFloat(workerStats.totalProcessingTime || 0),
        averageProcessingTime: parseFloat(workerStats.totalProcessingTime || 0) / (parseInt(workerStats.tasksProcessed || 1, 10))
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('Error fetching worker stats:', error);
    res.status(500).json({ error: 'Failed to fetch worker stats' });
  }
});

app.listen(PORT, () => {
  console.log(`Main server listening on port ${PORT}`);
});
