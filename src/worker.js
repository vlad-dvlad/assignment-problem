const express = require('express');
const { computeRows, computeCols, coverZeros, assign } = require('./services/compute');
const app = express();
app.use(express.json());

const port = process.env.DEFAULT_URL || 3001;

app.post('/compute-rows', computeRows);
app.post('/compute-cols', computeCols);
app.post('/cover-zeros', coverZeros);
app.post('/assign', assign);

app.listen(port, () => {
    console.log(`Worker listening on port ${port}`);
});
