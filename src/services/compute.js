// Мінімальне значення для кожного рядка
const computeRows = (req, res) => {
    const { matrix } = req.body;
    const rowMins = matrix.map(row => Math.min(...row));
    res.json(rowMins);
};

// Мінімальне значення для кожного стовпця
const computeCols = (req, res) => {
    const { matrix } = req.body;
    const colMins = matrix[0].map((_, colIndex) =>
        Math.min(...matrix.map(row => row[colIndex]))
    );
    res.json(colMins);
};

// Покриття нулів
const coverZeros = (req, res) => {
    const { rowMins, colMins } = req.body;
    // Алгоритм покриття нулів
    // Виконайте покриття і поверніть результат
    const coverResult = {}; // Приклад результату покриття
    res.json(coverResult);
};

// Призначення завдань
const assign = (req, res) => {
    const { coverZeros } = req.body;
    // Алгоритм призначення завдань
    const assignments = {}; // Приклад результату призначення
    res.json(assignments);
};

module.exports = { computeRows, computeCols, coverZeros, assign };
