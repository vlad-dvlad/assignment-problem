const express = require('express');
const redis = require('redis');

const app = express();
const port = process.env.PORT || 3000;

const redisClient = redis.createClient({ url: process.env.REDIS_URL });
const redisSubscriber = redis.createClient({ url: process.env.REDIS_URL });

function make_cost_matrix(profit_matrix) {
  const maximum = Math.max(...profit_matrix.flat());
  return profit_matrix.map(row => row.map(value => maximum - value));
}

async function format_matrix(matrix) {
  let columnWidths = matrix[0].map((_, colIndex) => Math.max(...matrix.map(row => String(row[colIndex]).length)));

  return matrix
    .map(row => row.map((val, colIndex) => String(val).padStart(columnWidths[colIndex])).join(" "))
    .join("\n");
}

function makeCostMatrixForMaximization(matrix) {
    const maxVal = Math.max(...matrix.flat());
    return matrix.map(row => row.map(value => maxVal - value));
}

(async () => {
  await redisClient.connect();
  await redisSubscriber.connect();
  console.log('Main server connected to Redis');
})();

app.use(express.json());

app.post('/solve-assignment', async (req, res) => {
  const { matrix, mode } = req.body;

  // Convert matrix to a cost matrix to minimize the total
  const adjustedMatrix = mode === 'max' ? makeCostMatrixForMaximization(matrix) : matrix;
  const costMatrix = make_cost_matrix(adjustedMatrix);

  // Store the cost matrix in Redis
  await redisClient.set('matrix', JSON.stringify(costMatrix));
  console.log('Cost matrix stored in Redis');

  // Publish the event to start the Hungarian algorithm
  redisClient.publish('start_assignment', 'Matrix processing started');

  // Listen for the final result
  redisSubscriber.subscribe('assignment_complete', async () => {
    const assignments = JSON.parse(await redisClient.get('assignments'));
    
    // Calculate the minimum total cost using the original matrix
    const totalCost = assignments.reduce((sum, [row, col]) => sum + matrix[row][col], 0);
    
    // Format matrix for display
    const formattedMatrix = format_matrix(matrix);

    // Prepare structured response
    const response = {
      formattedMatrix,
      assignments: assignments.map(([row, col]) => `Row ${row} -> Col ${col} (Cost: ${matrix[row][col]})`),
      totalCost
    };

    res.json({ result: response });
    await redisSubscriber.unsubscribe('assignment_complete');
  });
});

app.listen(port, () => console.log(`Main server listening on port ${port}`));
