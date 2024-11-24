const redis = require('redis');
const { computeHungarian, make_cost_matrix } = require('./hungarian');

const REDIS_URL = process.env.REDIS_URL;

const client = redis.createClient({ url: REDIS_URL });
client.connect();

console.log("Worker connected to Redis");

async function processTask() {
  const workerId = `worker-${Math.random().toString(36).substr(2, 5)}`; // Унікальний ID воркера
  while (true) {
    try {
      const startTime = Date.now();
      const task = await client.blPop('tasks', 0);
      const parsedTask = JSON.parse(task.element);

      console.log(`[${workerId}] Processing task:`, parsedTask.taskId);

      const costMatrix = make_cost_matrix(parsedTask.submatrix, parsedTask.is_maximization);
      const assignments = computeHungarian(costMatrix);

      const formattedResult = assignments.map(([row, col]) => {
        const value = parsedTask.submatrix[row][col];
        return { row, col, value };
      });

      const processingTime = Date.now() - startTime;

      await client.rPush(`results:${parsedTask.taskId}`, JSON.stringify({
        assignments: formattedResult,
        offsetRow: parsedTask.offsetRow,
        offsetCol: parsedTask.offsetCol,
        processingTime: `${processingTime} ms`
      }));

      // Оновлення статистики воркера
      await client.hIncrBy(`worker_stats:${workerId}`, 'tasksProcessed', 1);
      await client.hIncrByFloat(`worker_stats:${workerId}`, 'totalProcessingTime', processingTime);

      console.log(`[${workerId}] Task ${parsedTask.taskId} processed in ${processingTime} ms`);
    } catch (error) {
      console.error(`[${workerId}] Error processing task:`, error);
    }
  }
}

processTask().catch(console.error);
