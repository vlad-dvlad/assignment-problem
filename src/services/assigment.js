const solveAssignment = (redisClient, axios) => async (req, res) => {
    try {
        const { matrix, n } = req.body;

        // Validate matrix and n
        if (!Array.isArray(matrix) || typeof n !== 'number') {
            throw new Error("Invalid argument type: 'matrix' should be an array and 'n' should be a number");
        }

        // Prepare promises to compute row and column minimums
        const rowMinPromise = axios.post(`${process.env.DEFAULT_URL}/compute-rows`, { matrix, n });
        const colMinPromise = axios.post(`${process.env.DEFAULT_URL}/compute-cols`, { matrix, n });

        // Await results from both promises
        const [rowMins, colMins] = await Promise.all([rowMinPromise, colMinPromise]);

        if (!Array.isArray(rowMins.data) || !Array.isArray(colMins.data)) {
            throw new Error("Invalid response format: 'rowMins' and 'colMins' should be arrays");
        }

        // Store results in Redis
        await redisClient.set('rowMins', JSON.stringify(rowMins.data));
        await redisClient.set('colMins', JSON.stringify(colMins.data));

        // Proceed with other computations as needed
        const coverZerosPromise = axios.post(`${process.env.DEFAULT_URL}/cover-zeros`, { rowMins: rowMins.data, colMins: colMins.data });
        const coverZeros = await coverZerosPromise;

        const assignPromise = axios.post(`${process.env.DEFAULT_URL}/assign`, { coverZeros: coverZeros.data });
        const finalAssignment = await assignPromise;

        res.json({ result: finalAssignment.data });
    } catch (error) {
        console.error("Error in solveAssignment:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { solveAssignment };
