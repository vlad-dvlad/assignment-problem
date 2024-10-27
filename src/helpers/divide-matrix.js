function divideMatrix(matrix, n) {
    // Custom logic to split the matrix into parts for each container
    const parts = Math.ceil(n / 2); // Example: dividing into two parts
    const subMatrices = [];

    for (let i = 0; i < parts; i++) {
        subMatrices.push(matrix.slice(i * (n / parts), (i + 1) * (n / parts)));
    }
    
    return subMatrices;
}

module.exports = {
    divideMatrix
}