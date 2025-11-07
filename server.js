const express = require('express');
const path = require('path');
const app = express();

// Cloud Run provides the PORT environment variable.
// Default to 8080 for local testing if PORT is not set.
const port = process.env.PORT || 8080;

// Middleware to set correct MIME types and headers for PWA files (CRITICAL for iOS)
app.use((req, res, next) => {
    // Serve manifest.json with correct MIME type
    // Use max-age=0 instead of no-store to allow Service Worker caching
    if (req.path === '/manifest.json') {
        res.setHeader('Content-Type', 'application/manifest+json');
        res.setHeader('Cache-Control', 'max-age=0, must-revalidate');
    }
    // Serve service worker with no caching
    else if (req.path === '/sw.js') {
        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'max-age=0, must-revalidate');
        res.setHeader('Service-Worker-Allowed', '/');
    }
    // Don't cache index.html (ensures latest PWA config is loaded)
    else if (req.path === '/index.html' || req.path === '/') {
        res.setHeader('Cache-Control', 'max-age=0, must-revalidate');
    }
    // Allow icons to be cached but revalidate
    else if (req.path.match(/^\/.*-icon.*\.png$/) || req.path.match(/^\/icon-.*\.png$/)) {
        res.setHeader('Cache-Control', 'max-age=0, must-revalidate');
    }
    next();
});

// Serve the static files from the Vite build output directory 'dist'
app.use(express.static(path.join(__dirname, 'dist')));

// For a Single Page Application (SPA), all other routes should fall back to index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Frontend server is running on port ${port}`);
});
