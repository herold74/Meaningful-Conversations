const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Debug log file path
const DEBUG_LOG_PATH = process.env.DEBUG_LOG_PATH || '/tmp/mc-debug.log';

/**
 * POST /api/debug/log
 * Receives debug logs from frontend and writes them to a file
 * Used for debugging issues on devices without developer tools access
 */
router.post('/log', async (req, res) => {
    try {
        const { location, message, data, timestamp, sessionId } = req.body;
        
        const logEntry = {
            timestamp: timestamp || Date.now(),
            isoTime: new Date(timestamp || Date.now()).toISOString(),
            sessionId: sessionId || 'unknown',
            location: location || 'unknown',
            message: message || '',
            data: data || {},
            userAgent: req.headers['user-agent'] || 'unknown'
        };
        
        const logLine = JSON.stringify(logEntry) + '\n';
        
        // Append to log file
        fs.appendFileSync(DEBUG_LOG_PATH, logLine);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Debug log error:', error);
        res.status(500).json({ error: 'Failed to write debug log' });
    }
});

/**
 * GET /api/debug/logs
 * Retrieves recent debug logs (admin only in production)
 */
router.get('/logs', async (req, res) => {
    try {
        if (!fs.existsSync(DEBUG_LOG_PATH)) {
            return res.json({ logs: [] });
        }
        
        const content = fs.readFileSync(DEBUG_LOG_PATH, 'utf-8');
        const lines = content.trim().split('\n').filter(line => line);
        
        // Return last 100 entries
        const logs = lines.slice(-100).map(line => {
            try {
                return JSON.parse(line);
            } catch {
                return { raw: line };
            }
        });
        
        res.json({ logs });
    } catch (error) {
        console.error('Debug logs read error:', error);
        res.status(500).json({ error: 'Failed to read debug logs' });
    }
});

/**
 * DELETE /api/debug/logs
 * Clears debug logs
 */
router.delete('/logs', async (req, res) => {
    try {
        if (fs.existsSync(DEBUG_LOG_PATH)) {
            fs.unlinkSync(DEBUG_LOG_PATH);
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Debug logs clear error:', error);
        res.status(500).json({ error: 'Failed to clear debug logs' });
    }
});

module.exports = router;
