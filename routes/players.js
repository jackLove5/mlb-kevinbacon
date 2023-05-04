const { getAllPlayers, getShortestPath } = require('../controller/players')

const router = require('express').Router();

router.route('/').get(getAllPlayers);
router.route('/connection').get(getShortestPath)

module.exports = router;