const aggregateResults = (partialResults) => {
    // Implement logic to combine the partial results back into one final result
    return partialResults.reduce((acc, val) => acc + val, 0); // Example combining logic
}

module.exports = {
    aggregateResults
}