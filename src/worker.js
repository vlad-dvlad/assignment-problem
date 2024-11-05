const redis = require('redis');
const { computeHungarian, make_cost_matrix } = require('./hungarian');

const redisClient = redis.createClient({ url: process.env.REDIS_URL });
const redisSubscriber = redis.createClient({ url: process.env.REDIS_URL });

async function startWorker() {
  await redisClient.connect();
  await redisSubscriber.connect();

  console.log('Worker connected to Redis');

  // Subscribe to the relevant event channels
  redisSubscriber.subscribe('start_assignment', async (message) => {
    console.log(`Received message on channel start_assignment: ${message}`);
    const matrix = JSON.parse(await redisClient.get('matrix'));
    await startAssignment(matrix);
  });
}

// Function to handle the full Hungarian algorithm
async function startAssignment(matrix) {
  // Step 1: Convert the matrix to a cost matrix
  const costMatrix = make_cost_matrix(matrix);
  await redisClient.set('cost_matrix', JSON.stringify(costMatrix));
  console.log('Cost matrix prepared');

  // Step 2: Run the Hungarian algorithm
  const assignments = computeHungarian(costMatrix);
  await redisClient.set('assignments', JSON.stringify(assignments));
  console.log('Assignments calculated');

  // Step 3: Publish the completion event
  redisClient.publish('assignment_complete', 'Assignments complete');
}

// Start the worker and listen for events
startWorker().catch(console.error);
