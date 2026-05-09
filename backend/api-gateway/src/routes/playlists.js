const express = require('express'); const router = express.Router(); router.get('/', (req, res) => res.json({ service: 'playlists', status: 'active' })); module.exports = router;
