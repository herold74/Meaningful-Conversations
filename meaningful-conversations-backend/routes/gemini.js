const express = require('express');
const router = express.Router();

router.use('/', require('./gemini/translate'));
router.use('/', require('./gemini/chat'));
router.use('/', require('./gemini/session'));
router.use('/', require('./gemini/interview'));
router.use('/', require('./gemini/admin'));
router.use('/', require('./gemini/transcript'));
router.use('/', require('./gemini/botRecommendation'));

module.exports = router;
