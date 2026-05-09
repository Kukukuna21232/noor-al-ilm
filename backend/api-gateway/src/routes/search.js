const express = require('express'); const router = express.Router(); router.get('/', (req, res) => res.json({ service: 'search', status: 'active' })); module.exports = router;
