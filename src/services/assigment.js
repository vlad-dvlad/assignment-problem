const { divideMatrix } = require('../helpers/divide-matrix');
const { aggregateResults } = require('../helpers/aggregate-result');


const solveAssigment = async (req, res) => {
    const { matrix, n } = req.body;

    // Divide the matrix into submatrices
    const subMatrices = divideMatrix(matrix, n);
    
    // Distribute tasks to worker containers
    const results = await Promise.all(subMatrices.map((subMatrix, index) =>
        axios.post(`${process.env.DEFAULT_URL}-${index}:${process.env.PORT}/compute`, { subMatrix, n })
    ));
    
    // Gather partial results from each container and compute the final result
    const finalResult = aggregateResults(results.map(result => result.data));
    
    res.json({ result: finalResult });
}

module.exports = {
    solveAssigment
}