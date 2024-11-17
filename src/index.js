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
  const n = matrix.length;

  for (let i = 0; i < n; i += submatrix_size) {
    for (let j = 0; j < n; j += submatrix_size) {
      const submatrix = [];
      for (let k = 0; k < submatrix_size; k++) {
        submatrix.push(matrix[i + k].slice(j, j + submatrix_size));
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
    assignments.forEach(([localRow, localCol]) => {
      const globalRow = offsetRow + localRow;
      const globalCol = offsetCol + localCol;
      const value = originalMatrix[globalRow][globalCol];
      selectedElements.push(value);
      totalCost += value;
    });
  });

  return { selectedElements, totalCost };
}

app.post('/task', async (req, res) => {
  const { matrix, is_maximization } = req.body;

  if (!matrix || typeof is_maximization === 'undefined') {
    return res.status(400).json({ error: "Invalid request data" });
  }

  // Унікальний ID для цього запиту, щоб збирати результати
  const taskId = uuidv4();
  const submatrices = split_into_submatrices(matrix, 10);

  // Розподіл підзадач серед воркерів
  for (const { submatrix, offsetRow, offsetCol } of submatrices) {
    await client.rPush('tasks', JSON.stringify({
      taskId,
      submatrix,
      offsetRow,
      offsetCol,
      is_maximization
    }));
  }

  // Перевірка завершення обробки підзадач
  let collectedResults = [];
  while (collectedResults.length < submatrices.length) {
    const result = await client.blPop(`results:${taskId}`, 0);
    collectedResults.push(JSON.parse(result[1]));
  }

  // Агрегуємо отримані результати
  const aggregatedResult = aggregateResults(collectedResults, matrix);
  res.json(aggregatedResult);
});

app.listen(PORT, () => {
  console.log(`Main server listening on port ${PORT}`);
});
