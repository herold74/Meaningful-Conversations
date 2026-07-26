const express = require('express');
const { BOTS } = require('../constants.js');
const { resolvePublicAssetUrl } = require('../utils/publicAssetUrl.js');

const router = express.Router();

// GET /api/bots - Get the public-facing list of bots (no prompts)
router.get('/', (req, res) => {
    // Sanitize the bots, removing the system prompts before sending to the client
    const publicBots = BOTS.map(({ systemPrompt, systemPrompt_de, ...publicBot }) => ({
        ...publicBot,
        avatar: resolvePublicAssetUrl(publicBot.avatar),
    }));
    res.json(publicBots);
});

module.exports = router;