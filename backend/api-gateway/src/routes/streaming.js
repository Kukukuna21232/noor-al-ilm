const express = require('express'); const router = express.Router(); router.get('/', (req, res) => res.json({ service: 'streaming', status: 'active' })); module.exports = router;
