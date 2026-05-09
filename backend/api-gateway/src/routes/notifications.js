const express = require('express'); const router = express.Router(); router.get('/', (req, res) => res.json({ service: 'notifications', status: 'active' })); module.exports = router;
