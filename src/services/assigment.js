const axios = require('axios');
const { divideMatrix } = require('../helpers/divide-matrix');
const { aggregateResults } = require('../helpers/aggregate-result');

const solveAssigment = async (req, res) => {
    try {
        const { matrix, n } = req.body;
        // Divide the matrix into submatrices
        const subMatrices = divideMatrix(matrix, n);
        
        // Distribute tasks to worker containers
        const results = await Promise.all(subMatrices.map((subMatrix) =>
            axios.post(`${process.env.DEFAULT_URL}/compute`, { subMatrix, n })
        ));
        // Gather partial results from each container and compute the final result
        const finalResult = aggregateResults(results.map(result => result.data));
        res.json({ result: finalResult });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
}

module.exports = {
    solveAssigment
}