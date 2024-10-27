const express = require('express');
const axios = require('axios');
const app = express();

const { solveAssigment } = require('./src/services/assigment')
const { compute } = require('./src/services/compute')

const port = process.env.PORT || 3000;

app.post('/solve-assignment', solveAssigment)
app.post('compute', compute)

app.listen(port, () => {
    console.log('Main server listening on port 3000');
});