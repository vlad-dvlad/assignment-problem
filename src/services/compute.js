const { Hungarian } = require('../models/Hungarian')

const compute = (req, res) => {
    try {
        const { subMatrix, n } = req.body;
        const hungarian = new Hungarian();
        const result = hungarian.assignmentProblem(subMatrix, n);
        res.json({ result });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });

    }
    
}

module.exports = {
    compute
}