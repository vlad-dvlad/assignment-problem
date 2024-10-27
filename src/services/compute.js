const { Hungarian } = require('../models/Hungarian')

const compute = (req, res) => {
    const { subMatrix, n } = req.body;
    const hungarian = new Hungarian();
    const result = hungarian.assignmentProblem(subMatrix, n);
    res.json(result);
}

module.exports = {
    compute
}