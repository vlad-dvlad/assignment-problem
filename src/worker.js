const redis = require('redis');
const { computeHungarian, make_cost_matrix } = require('./hungarian');

const REDIS_URL = process.env.REDIS_URL;

const client = redis.createClient({ url: REDIS_URL });
client.connect();

console.log("Worker connected to Redis");

async function processTask() {
  while (true) {
    const task = await client.blPop('tasks', 0);
    const { taskId, submatrix, offsetRow, offsetCol, is_maximization } = JSON.parse(task[1]);

    // Обробка підзадачі
    const costMatrix = make_cost_matrix(submatrix, is_maximization);
    const assignments = computeHungarian(costMatrix);

    // Форматування результату для повернення
    const formattedResult = assignments.map(([row, col]) => {
      const value = submatrix[row][col];
      return { row, col, value };
    });

    // Відправка результату назад у Redis
    await client.rPush(`results:${taskId}`, JSON.stringify({
      assignments: formattedResult,
      offsetRow,
      offsetCol
    }));
  }
}

processTask().catch(console.error);
